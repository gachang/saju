import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { readingInput, type ChartPair, type NameLengths } from "./compatibility";
import { generateReading, type ReadingModel } from "./reading.server";
import { paragraphRepairTarget, repairReport, type PipelineEvent, type RepairRequest } from "./reading-pipeline";
import { sectionSchema, type Report } from "./reading-schema";
import { SYSTEM_PROMPT, SECTION_TOPICS, PROMPT_VERSION } from "./reading-prompt";
import { reviewReading } from "./reading-editor.server";
import { withRateLimitRetry } from "./openai-retry.server";
import { generatedSectionSchema } from "./reading-output-schema";
export type ReadingUsage = { model: ReadingModel; phase: string; usage: unknown; elapsedMs: number };

export async function generateCompleteReading(pair: ChartPair, options: {
  today?: string; signal?: AbortSignal; initial?: Report; draftModel?: ReadingModel; nameLengths?: NameLengths;
  onProgress?: (event: PipelineEvent) => void;
  onCheckpoint?: (report: Report) => void; onUsage?: (usage: ReadingUsage) => void;
  initialEditorialIssues?: Record<number, string[]>;
} = {}) {
  const started = Date.now();
  const deadline = AbortSignal.timeout(220_000);
  const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline;
  const usage: ReadingUsage[] = [];
  const recordUsage = (entry: ReadingUsage) => { usage.push(entry); options.onUsage?.(entry); };
  const input = readingInput(pair, options.today, options.nameLengths);
  const draftModel = options.draftModel ?? "gpt-5.6-luna";
  const draft = options.initial ? { report: options.initial } : await generateReading(pair, { today: options.today, model: draftModel, nameLengths: options.nameLengths, signal,
    onUsage: (usage, elapsedMs) => recordUsage({ model: draftModel, phase: "draft", usage, elapsedMs }) });
  options.onCheckpoint?.(draft.report);
  options.onProgress?.({ stage: "draft", completed: 0, total: 8 });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: 55_000 });
  const repair = async ({ section, errors, stage, attempt, repeatedSentences }: RepairRequest) => {
    const model: ReadingModel = stage === "terra" ? "gpt-5.6-terra" : "gpt-5.6-luna";
    const start = Date.now();
    const target = paragraphRepairTarget(section, input);
    const response = await withRateLimitRetry(() => client.responses.parse({
      model, instructions: SYSTEM_PROMPT,
      input: JSON.stringify({ ...input, task: "repair_one_section", section_id: section.id, topic: SECTION_TOPICS[section.id - 1],
        previous_section: section, errors, repeated_sentences_to_rewrite: repeatedSentences, paragraph_repair: target,
        instruction: `오직 ${section.id}번 장을 반환한다. 실측 총 ${target.total_chars}자이며 목표는 725자다. 본문 길이만 문제라면 ${target.index + 1}번째 문단을 약 ${target.target_chars}자로 고치고 다른 문단은 그대로 둔다. formal_register는 모든 입니다/습니다/합니다를 자연스러운 해요체로 바꾸라는 뜻이다. 여러 문제가 있으면 그 오류도 함께 고친다. 편집 검수의 잘못된 의미가 제목이나 다른 문단에도 반복되어 있으면 함께 수정한다. 전체 보고서나 다른 장을 출력하지 않는다. 문장을 자르거나 무관한 문장으로 채우지 않는다.` }),
      // Counts are measured by code; short edits should not spend the entire budget recounting internally.
      reasoning: { effort: "low" }, text: { verbosity: "high", format: zodTextFormat(generatedSectionSchema.extend({ id: z.literal(section.id) }), "report_section") },
      max_output_tokens: 2800, store: false, tools: [],
    }, { signal }), signal);
    recordUsage({ model, phase: `repair-${attempt}-${section.id}`, usage: response.usage, elapsedMs: Date.now() - start });
    if (response.status !== "completed" || !response.output_parsed) throw new Error("READING_INCOMPLETE");
    return sectionSchema.parse(response.output_parsed);
  };
  let result = await repairReport(draft.report, input, repair, { signal, onProgress: options.onProgress, onCheckpoint: options.onCheckpoint, editorialIssues: options.initialEditorialIssues,
    stages: options.initialEditorialIssues ? ["terra", "terra"] : undefined });
  const editorial: Awaited<ReturnType<typeof reviewReading>>["issues"][] = [];
  for (let pass = 0; pass < 3 && !result.validation.length; pass++) {
    const review = await reviewReading(result.report, input, signal);
    recordUsage({ model: "gpt-5.6-terra", phase: `editor-${pass + 1}`, usage: review.usage, elapsedMs: review.elapsedMs });
    editorial.push(review.issues);
    if (!review.issues.length) break;
    const editorialIssues: Record<number, string[]> = {};
    for (const issue of review.issues) (editorialIssues[issue.section_id] ??= []).push(`${issue.section_id}:editorial:${issue.code}:${issue.explanation} [원문: ${issue.quote}]`);
    if (pass === 2) { result.validation.push(...Object.values(editorialIssues).flat()); break; }
    const revised = await repairReport(result.report, input, repair, { signal, onProgress: options.onProgress, onCheckpoint: options.onCheckpoint, stages: ["terra", "terra"], editorialIssues });
    result = { ...revised, attempts: [...result.attempts, ...revised.attempts] };
  }
  if (!result.validation.length) options.onProgress?.({ stage: "complete", completed: 8, total: 8 });
  return { ...result, editorial, usage, elapsedMs: Date.now() - started, promptVersion: PROMPT_VERSION };
}
