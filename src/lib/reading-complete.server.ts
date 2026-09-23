import { READING_MODEL } from "./reading-client.server";
import { readingInput, type ChartPair, type NameLengths } from "./compatibility";
import { generateReading, type ReadingModel } from "./reading.server";
import type { PipelineEvent } from "./reading-pipeline";
import { REPORT_CHAPTER_TITLES, hasBrokenTitleClause, normalizeTitleStyle, validateReport, type Report } from "./reading-schema";
import { PROMPT_VERSION } from "./reading-prompt";

export type ReadingUsage = { model: ReadingModel; phase: string; usage: unknown; elapsedMs: number };

// Presentation polish remains measurable in offline evals, but no longer turns
// a grounded one-pass report into several minutes of additional model calls.
const isNonBlockingCopyIssue = (issue: string) =>
  /^(?:[1-8]:(?:body_length|title_length|title_style|title_fluency|formal_register|repeated_sentence_with|duplicate_paragraph_with|evidence_label|axis_meaning|compatibility_type|names)=?|title_punctuation_count$|missing_(?:time|hour)_limitation$)/u.test(issue);

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

export const finalizeSection = (section: Report["sections"][number]) => {
  const paragraphs = section.paragraphs.map(paragraph => finishParagraph(removeAbstractClosing(sanitizeParagraph(paragraph))));
  const normalized = normalizeTitleStyle({ ...section, paragraphs });
  // Keep the generated wording; only a genuinely broken/empty title falls back
  // to its chapter label, never a fabricated stock conclusion.
  return normalized.title.trim() && !hasBrokenTitleClause(normalized.title)
    ? normalized
    : { ...normalized, title: REPORT_CHAPTER_TITLES[section.id - 1] };
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
