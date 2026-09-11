import { mkdir, writeFile } from "node:fs/promises";
import { calculateChart } from "../src/lib/engine";
import { generateReading } from "../src/lib/reading.server";
import { countText, displayText } from "../src/lib/reading-schema";

const fixtures = [
  [{ year: 1992, month: 10, day: 24, hour: 5, minute: 30 }, { year: 1990, month: 5, day: 15 }],
  [{ year: 2000, month: 2, day: 29 }, { year: 1995, month: 8, day: 17 }],
  [{ year: 1988, month: 8, day: 8, hour: 23, minute: 30 }, { year: 1998, month: 11, day: 12 }],
  [{ year: 1997, month: 2, day: 8 }, { year: 1997, month: 2, day: 8 }],
  [{ year: 2020, month: 4, day: 1, isLunar: true, isLeapMonth: true }, { year: 2001, month: 7, day: 19 }],
];
async function main() {
  const start = Number(process.argv[2] ?? 0), count = Number(process.argv[3] ?? 4);
  const tag = process.argv[4] ?? "baseline";
  if (!process.env.OPENAI_API_KEY || !Number.isInteger(count) || count < 1 || count > 10) throw new Error("Invalid evaluation configuration");
  await mkdir(".eval", { recursive: true });
  for (let offset = 0; offset < count; offset += 2) {
    await Promise.all(Array.from({ length: Math.min(2, count - offset) }, async (_, n) => {
      const index = start + offset + n;
      const [self, favorite] = fixtures[index % fixtures.length].map(p => calculateChart(p).variants[0]);
      try {
        const result = await generateReading({ self, favorite }, { today: "2026-09-11" });
        await writeFile(`.eval/${tag}-${index + 1}.json`, JSON.stringify({ fixture: index % fixtures.length, ...result }, null, 2));
        console.log(JSON.stringify({ run: index + 1, tag, errors: result.validation, lengths: result.report.sections.map(s => countText(s.paragraphs.map(p => displayText(p)).join(""))), elapsedMs: result.elapsedMs, usage: result.usage }));
      } catch (error) {
        // Never print API error bodies: they may contain request fragments or keys.
        const safe = error as { status?: number; code?: string; name?: string };
        const result = { run: index + 1, tag, failed: true, status: safe.status ?? null, code: safe.code ?? safe.name ?? "Error" };
        await writeFile(`.eval/${tag}-${index + 1}.json`, JSON.stringify(result));
        console.log(JSON.stringify(result));
      }
    }));
  }
}
main().catch(() => { console.error("Evaluation setup failed; inspect configuration without printing secrets."); process.exitCode = 1; });
