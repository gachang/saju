import { mkdir, readFile, writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { calculateChart } from "../src/lib/engine";
import { generateCompleteReading, type ReadingUsage } from "../src/lib/reading-complete.server";
import { displayedBodyLength, reportSchema } from "../src/lib/reading-schema";
import { nameLengthsSchema, readingInput } from "../src/lib/compatibility";

const fixtures = [
  [{ year: 1992, month: 10, day: 24, hour: 5, minute: 30 }, { year: 1990, month: 5, day: 15 }],
  [{ year: 2000, month: 2, day: 29 }, { year: 1995, month: 8, day: 17 }],
  [{ year: 1988, month: 8, day: 8, hour: 23, minute: 30 }, { year: 1998, month: 11, day: 12 }],
  [{ year: 1997, month: 2, day: 8 }, { year: 1997, month: 2, day: 8 }],
  [{ year: 2020, month: 4, day: 1, isLunar: true, isLeapMonth: true }, { year: 2001, month: 7, day: 19 }],
];
async function main() {
  const index = Number(process.argv[2] ?? 0), tag = process.argv[3] ?? "complete";
  if (!Number.isInteger(index) || index < 0 || index >= fixtures.length || !/^[a-z0-9-]+$/.test(tag)) throw new Error("INVALID_EVAL_CONFIG");
  const [self, favorite] = fixtures[index].map(p => calculateChart(p).variants[0]);
  const previous = process.argv[4] ? JSON.parse(await readFile(process.argv[4], "utf8")) : undefined;
  const initial = previous ? reportSchema.parse(previous.report) : undefined;
  const initialEditorialIssues: Record<number, string[]> = {};
  for (const issue of previous?.validation ?? []) if (/^\d+:editorial:/.test(issue)) (initialEditorialIssues[Number(issue.split(":")[0])] ??= []).push(issue);
  const nameLengths = nameLengthsSchema.parse({ self: Number(process.env.READING_EVAL_NAME_SELF ?? 3), favorite: Number(process.env.READING_EVAL_NAME_FAVORITE ?? 2) });
  const draftModel = process.env.READING_EVAL_MODEL === "gpt-5.6-terra" ? "gpt-5.6-terra" : "gpt-5.6-luna";
  await mkdir(".eval", { recursive: true });
  const traces: ReadingUsage[] = [];
  const result = await generateCompleteReading({ self, favorite }, { today: "2026-09-12", initial, nameLengths, draftModel,
    initialEditorialIssues: Object.keys(initialEditorialIssues).length ? initialEditorialIssues : undefined,
    onCheckpoint: report => writeFileSync(`.eval/${tag}-${index + 1}-checkpoint.json`, JSON.stringify({ fixture: index, pair: { self, favorite }, nameLengths, report }, null, 2)),
    onUsage: usage => { traces.push(usage); writeFileSync(`.eval/${tag}-${index + 1}-usage.json`, JSON.stringify(traces, null, 2)); },
    onProgress: progress => console.log(JSON.stringify({ fixture: index, progress })) });
  await mkdir(".eval", { recursive: true });
  await writeFile(`.eval/${tag}-${index + 1}.json`, JSON.stringify({ fixture: index, pair: { self, favorite }, nameLengths, draftModel, ...result }, null, 2));
  console.log(JSON.stringify({ fixture: index, tag, errors: result.validation, lengths: result.report.sections.map(s => displayedBodyLength(s, readingInput({ self, favorite }, "2026-09-12", nameLengths))), attempts: result.attempts, calls: result.usage.length, elapsedMs: result.elapsedMs }));
}
main().catch(error => {
  const safe = error as { status?: number; code?: string; name?: string; message?: string; cause?: unknown };
  const internalCode = /^[A-Z_]+$/.test(safe.message ?? "") ? safe.message : undefined;
  console.log(JSON.stringify({ failed: true, status: safe.status ?? null, code: safe.code ?? internalCode ?? safe.name ?? "Error",
    // Only our own generation error has this deliberately text-free diagnostic payload.
    diagnostic: internalCode === "READING_INCOMPLETE" ? safe.cause : undefined })); process.exitCode = 1;
});
