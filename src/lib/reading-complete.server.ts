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
  /^(?:[1-8]:(?:body_length|title_length|title_style|formal_register|repeated_sentence_with|duplicate_paragraph_with)=?|title_punctuation_count$)/u.test(issue);

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
    sections: draft.report.sections.map(normalizeTitleStyle),
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
