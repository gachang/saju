import { READING_MODEL } from "./reading-client.server";
import { readingInput, type ChartPair, type NameLengths } from "./compatibility";
import { generateReading, type ReadingModel } from "./reading.server";
import type { PipelineEvent } from "./reading-pipeline";
import { normalizeTitleStyle, validateReport, type Report } from "./reading-schema";
import { PROMPT_VERSION } from "./reading-prompt";

export type ReadingUsage = { model: ReadingModel; phase: string; usage: unknown; elapsedMs: number };

// Presentation polish remains measurable in offline evals, but no longer turns
// a grounded one-pass report into several minutes of additional model calls.
const isNonBlockingCopyIssue = (issue: string) =>
  /^(?:[1-8]:(?:body_length|title_length|title_style|formal_register|repeated_sentence_with|duplicate_paragraph_with|evidence_label|axis_meaning|compatibility_type|names)=?|title_punctuation_count$|missing_(?:time|hour)_limitation$)/u.test(issue);

const TITLE_FALLBACKS = [
  "서로 다른 온도가 첫눈에 호기심을 깨우고, 입덕의 문을 활짝 열었기니",
  "낯선 결이 서로의 매력을 더 또렷하게 비추고, 새로운 끌림을 발견했기니!",
  "감상하는 방식의 차이가 취향을 넓혀 주고, 자기만의 덕질 리듬을 찾았기니",
  "몰입과 쉼의 속도를 서로 다르게 지켜 주고, 오래 좋아할 균형을 맞췄기니",
  "뜨겁고 차가운 기운이 필요한 자리를 채우고, 서로의 다른 온도를 맞췄기니!",
  "서운함과 거리 두기까지 관계의 일부로 품고, 쉬어 갈 여유를 마련했기니",
  "서로 다른 표현이 상상 속 대화로 이어지고, 새로운 이야기를 함께 펼쳤기니",
  "서로의 장점과 위험한 순간을 함께 살피고, 따뜻한 관계의 답을 찾아냈기니",
] as const;

const RELATION_WORDS: Record<string, string> = {
  합: "서로 자연스럽게 맞물리는 기운", 상생: "서로 북돋는 기운", 비화: "결이 닮은 기운",
  상극: "서로 다른 속도를 조절하는 기운", 육합: "편안하게 호흡을 맞추는 기운", 충: "정면으로 부딪히는 기운",
  형: "같은 패턴이 반복되는 기운", 해: "기대가 어긋나기 쉬운 기운", 파: "익숙한 흐름이 흔들리는 기운",
};

const translateRawRelation = (paragraph: string) => paragraph.replace(
  /[갑을병정무기경신임계자축인묘진사오미유술해](?:[·ㆍ∙]\s*)?[갑을병정무기경신임계자축인묘진사오미유술해]\s*(육합|상생|비화|상극|합|충|형|해|파)/gu,
  (_match, kind: string) => RELATION_WORDS[kind] ?? "서로 다른 기운",
);

const removeAbstractClosing = (paragraph: string) => {
  const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [paragraph];
  if (sentences.length < 2) return paragraph;
  const last = sentences.at(-1) ?? "";
  return /일상의 품격|활짝 열린|소중한 이야기|무한한 가능성|따뜻한 여운/u.test(last)
    ? sentences.slice(0, -1).join("").trim()
    : paragraph;
};

const finishParagraph = (paragraph: string) => {
  const trimmed = paragraph.trim();
  return /[.!?]$/u.test(trimmed) ? trimmed : `${trimmed}.`;
};

const sanitizeParagraph = (paragraph: string) => paragraph
  .replace(/그 사람/gu, "{{FAVORITE}} 님")
  .replace(/당신|그대/gu, "{{USER}} 님")
  .replace(/운명적으로/gu, "자연스럽게");

const finalizeSection = (section: Report["sections"][number]) => {
  const paragraphs = section.paragraphs.map(paragraph => finishParagraph(removeAbstractClosing(translateRawRelation(sanitizeParagraph(paragraph)))));
  if (section.id === 6 && !/^\{\{USER\}\} 님![^?]*\?/u.test(paragraphs[0] ?? "")) {
    paragraphs[0] = `{{USER}} 님! 사실 요즘 잠깐 쉬어 가고 싶은 때 아닌가요? {{USER}} 님과 {{FAVORITE}} 님 관계에는 언제든 부담 없이 덕질을 쉬거나 잠시 멀어질 자유가 있어요. ${paragraphs[0]}`;
  }
  const normalized = normalizeTitleStyle({ ...section, paragraphs });
  const completedVerb = /(?:았|었|했|됐|였|렸|졌|쳤|냈|켰|웠|겼|췄)기니!?$/u.test(normalized.title);
  return completedVerb ? normalized : { ...normalized, title: TITLE_FALLBACKS[section.id - 1] };
};

export async function generateCompleteReading(pair: ChartPair, options: {
  today?: string; signal?: AbortSignal; initial?: Report; draftModel?: ReadingModel; nameLengths?: NameLengths;
  onProgress?: (event: PipelineEvent) => void;
  onCheckpoint?: (report: Report) => void; onUsage?: (usage: ReadingUsage) => void;
  onPhase?: (phase: string) => void;
  initialEditorialIssues?: Record<number, string[]>;
} = {}) {
  const started = Date.now();
  const deadline = AbortSignal.timeout(55_000);
  const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline;
  const model = options.draftModel ?? READING_MODEL;
  const usage: ReadingUsage[] = [];

  options.onPhase?.("draft");
  const draft = await generateReading(pair, {
    today: options.today,
    model,
    nameLengths: options.nameLengths,
    signal,
    onUsage: (callUsage, elapsedMs) => {
      const entry = { model, phase: "draft", usage: callUsage, elapsedMs } satisfies ReadingUsage;
      usage.push(entry);
      options.onUsage?.(entry);
    },
  });

  const report: Report = {
    ...draft.report,
    sections: draft.report.sections.map(finalizeSection),
  };
  options.onCheckpoint?.(report);
  options.onProgress?.({ stage: "draft", completed: 8, total: 8 });

  const input = readingInput(pair, options.today, options.nameLengths);
  const validation = validateReport(report, input).filter(issue => !isNonBlockingCopyIssue(issue));
  if (!validation.length) options.onProgress?.({ stage: "complete", completed: 8, total: 8 });

  return {
    report,
    validation,
    attempts: [],
    editorial: [],
    usage,
    elapsedMs: Date.now() - started,
    promptVersion: PROMPT_VERSION,
  };
}
