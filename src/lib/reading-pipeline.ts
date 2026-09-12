import type { readingInput } from "./compatibility";
import { countText, countDisplayedText, reportSchema, sectionSchema, validateReport, type Report, type ReportSection } from "./reading-schema";

export type ReadingInput = ReturnType<typeof readingInput>;
export type RepairStage = "luna" | "terra";
export type RepairRequest = { section: ReportSection; errors: string[]; stage: RepairStage; attempt: number; repeatedSentences: string[] };
export type PipelineEvent = { stage: "draft" | "repair" | "complete"; completed: number; total: 8 };

export function sectionErrors(report: Report, input: ReadingInput, id: number) {
  return validateReport(report, input).filter(error => error.startsWith(`${id}:`));
}

export function mergeSection(report: Report, requestedId: number, replacement: ReportSection): Report {
  const parsed = sectionSchema.parse(replacement);
  if (parsed.id !== requestedId) throw new Error("REPAIR_SECTION_MISMATCH");
  return reportSchema.parse({ ...report, sections: report.sections.map(section => section.id === requestedId ? parsed : section) });
}

// Prefer fewer substantive failures, then closeness to the required length. Never silently truncate or pad.
function penalty(errors: string[]) {
  return errors.reduce((sum, error) => {
    const match = error.match(/(?:body|title)_length=(\d+)/);
    return sum + (match ? Math.abs(Number(match[1]) - (error.includes("body_") ? 725 : 40)) : 10_000);
  }, 0);
}

const isIncompleteResponse = (error: unknown) => error instanceof Error && error.message === "READING_INCOMPLETE";

export function paragraphRepairTarget(section: ReportSection, input?: Pick<ReadingInput, "name_lengths">) {
  const lengths = section.paragraphs.map(p => countDisplayedText(p, input));
  const total = lengths.reduce((a, b) => a + b, 0);
  const delta = 725 - total;
  // One paragraph correction avoids rewriting the two good paragraphs when only length is wrong.
  const index = lengths.indexOf(delta < 0 ? Math.max(...lengths) : Math.min(...lengths));
  return { index, current_chars: lengths[index], target_chars: lengths[index] + delta, total_chars: total };
}

export async function repairReport(
  draft: Report,
  input: ReadingInput,
  repair: (request: RepairRequest) => Promise<ReportSection>,
  options: { signal?: AbortSignal; onProgress?: (event: PipelineEvent) => void; onCheckpoint?: (report: Report) => void; stages?: RepairStage[]; editorialIssues?: Record<number, string[]> } = {},
) {
  options.signal?.throwIfAborted();
  let report = reportSchema.parse(draft);
  const editorialIssues = { ...options.editorialIssues };
  const currentErrors = (value: Report, id: number) => [...sectionErrors(value, input, id), ...(editorialIssues[id] ?? [])];
  const attempts: { stage: RepairStage; id: number; before: string[]; after: string[]; accepted: boolean }[] = [];
  for (const [attempt, stage] of (options.stages ?? ["luna", "terra", "terra"]).entries()) {
    const ids = report.sections.filter(section => currentErrors(report, section.id).length).map(s => s.id);
    if (!ids.length) break;
    // At most two concurrent short repairs; every round preserves all passing sections exactly.
    for (let offset = 0; offset < ids.length; offset += 2) {
      options.signal?.throwIfAborted();
      const snapshot = report;
      const batchIds = ids.slice(offset, offset + 2);
      const candidates = await Promise.allSettled(batchIds.map(async id => {
        const errors = currentErrors(snapshot, id);
        const section = snapshot.sections.find(s => s.id === id)!;
        const sentences = (s: ReportSection) => s.paragraphs.flatMap(p => p.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? []).map(s => s.normalize("NFC").replace(/\s+/gu, " ").trim());
        const otherSentences = new Set(snapshot.sections.filter(s => s.id !== id).flatMap(sentences));
        const repeatedSentences = sentences(section).filter(s => countText(s) >= 30 && otherSentences.has(s));
        const candidate = await repair({ section, errors, stage, attempt: attempt + 1, repeatedSentences });
        return { id, candidate };
      }));
      options.signal?.throwIfAborted();
      for (const [index, settled] of candidates.entries()) {
        if (settled.status === "rejected") {
          if (isIncompleteResponse(settled.reason)) {
            const id = batchIds[index];
            const before = currentErrors(report, id);
            attempts.push({ stage, id, before, after: [...before, `${id}:incomplete_response`], accepted: false });
          }
          continue;
        }
        const { id, candidate } = settled.value;
        const before = currentErrors(report, id);
        const merged = mergeSection(report, id, candidate);
        const after = sectionErrors(merged, input, id);
        const preservesPassing = report.sections.filter(s => s.id !== id && !sectionErrors(report, input, s.id).length)
          .every(s => !sectionErrors(merged, input, s.id).length);
        const accepted = preservesPassing && penalty(after) <= penalty(before);
        attempts.push({ stage, id, before, after, accepted });
        if (accepted) { report = merged; delete editorialIssues[id]; }
      }
      options.onCheckpoint?.(report);
      options.onProgress?.({ stage: "repair", completed: report.sections.filter(s => !sectionErrors(report, input, s.id).length).length, total: 8 });
      const failed = candidates.find(candidate => candidate.status === "rejected" && !isIncompleteResponse(candidate.reason));
      if (failed?.status === "rejected") throw failed.reason;
    }
  }
  return { report, validation: [...validateReport(report, input), ...Object.values(editorialIssues).flat()], attempts };
}
