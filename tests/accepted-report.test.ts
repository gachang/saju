import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pairSchema, readingInput } from "../src/lib/compatibility";
import { reportSchema, validateReport, displayedBodyLength } from "../src/lib/reading-schema";

test("actual API-produced eight-section fixture passes all deterministic checks", () => {
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/accepted-report.json", import.meta.url), "utf8"));
  const input = readingInput(pairSchema.parse(fixture.pair), "2026-09-12", fixture.nameLengths);
  const report = reportSchema.parse(fixture.report);
  assert.deepEqual(validateReport(report, input), []);
  assert.deepEqual(report.sections.map(s => displayedBodyLength(s, input)), [725, 725, 716, 731, 726, 726, 726, 715]);
});

test("Codyssey GPT-5.4 accepted report passes all final checks", () => {
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/codyssey-accepted-report.json", import.meta.url), "utf8"));
  const input = readingInput(pairSchema.parse(fixture.pair), "2026-09-12", fixture.nameLengths);
  const report = reportSchema.parse(fixture.report);
  assert.equal(fixture.model, "gpt-5.4");
  assert.deepEqual(fixture.editorial, [[]]);
  assert.deepEqual(validateReport(report, input), []);
  assert.deepEqual(report.sections.map(s => displayedBodyLength(s, input)), [720,744,713,746,737,710,712,750]);
});
