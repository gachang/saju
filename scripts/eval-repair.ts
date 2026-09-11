import { readFile, writeFile } from "node:fs/promises";
import { calculateChart } from "../src/lib/engine";
import { generateReading } from "../src/lib/reading.server";

async function main() {
  const fixtures = [
    [{ year: 1992, month: 10, day: 24, hour: 5, minute: 30 }, { year: 1990, month: 5, day: 15 }],
    [{ year: 2000, month: 2, day: 29 }, { year: 1995, month: 8, day: 17 }],
  ];
  await Promise.all(fixtures.map(async (fixture, index) => {
    const [self, favorite] = fixture.map(p => calculateChart(p).variants[0]);
    const previous = JSON.parse(await readFile(`.eval/final-${index + 1}.json`, "utf8")).report;
    try {
      const result = await generateReading({ self, favorite }, { today: "2026-09-11", previous });
      await writeFile(`.eval/repair-${index + 1}.json`, JSON.stringify(result, null, 2));
      console.log(JSON.stringify({ run: index + 11, errors: result.validation, usage: result.usage, elapsedMs: result.elapsedMs }));
    } catch (error) {
      const e = error as { status?: number; code?: string; name?: string };
      console.log(JSON.stringify({ run: index + 11, failed: true, status: e.status, code: e.code ?? e.name }));
    }
  }));
}
main().catch(() => { console.error("Repair evaluation setup failed."); process.exitCode = 1; });
