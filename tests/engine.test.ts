import test from "node:test";
import assert from "node:assert/strict";
import { solarToLunar as primaryLunar, getSolarTerm } from "manseryeok";
import { solarToLunar as referenceLunar, calculateSaju } from "@fullstackfamily/manseryeok";
import { calculateChart } from "../src/lib/engine";
import { compatibility, readingInput, pairSchema } from "../src/lib/compatibility";

test("README fixed example and lunar equivalent", () => {
  const solar = calculateChart({ year: 1992, month: 10, day: 24, hour: 5, minute: 30 });
  assert.deepEqual(solar.variants[0], { year: "임신", month: "경술", day: "계유", hour: "을묘" });
  assert.deepEqual(calculateChart({ year: 1992, month: 9, day: 29, hour: 5, minute: 30, isLunar: true }).variants, solar.variants);
});
for (const [year, month, day] of [[1990, 5, 15], [1997, 2, 8], [2000, 8, 15], [2024, 2, 10], [2020, 5, 23]]) {
  test(`cross-library lunar and safe-noon pillars ${year}-${month}-${day}`, () => {
    const p = primaryLunar(year, month, day), r = referenceLunar(year, month, day).lunar;
    assert.deepEqual(p, { year: r.year, month: r.month, day: r.day, isLeapMonth: r.isLeapMonth });
    const a = calculateChart({ year, month, day, hour: 12 }).variants[0];
    const b = calculateSaju(year, month, day, 12, 0, { applyTimeCorrection: false });
    assert.equal(a.year, b.yearPillar); assert.equal(a.month, b.monthPillar); assert.equal(a.day, b.dayPillar);
  });
}
test("unknown hour omits hour and exposes all term-boundary variants", () => {
  const instant = getSolarTerm(2024, 2).date;
  const kst = new Date(instant.getTime() + 9 * 3600_000);
  const result = calculateChart({ year: kst.getUTCFullYear(), month: kst.getUTCMonth() + 1, day: kst.getUTCDate() });
  assert.equal(result.coverage, "복수 명식");
  assert.equal(result.variants.length, 2);
  assert.ok(result.variants.every(p => p.hour === null));
  assert.notEqual(result.variants[0].year, result.variants[1].year);
});
test("day boundaries and solar time are explicit", () => {
  const input = { year: 2024, month: 3, day: 10, hour: 23, minute: 30 };
  const midnight = calculateChart(input).variants[0];
  const jasi = calculateChart({ ...input, dayBoundary: "jasi" }).variants[0];
  assert.notEqual(midnight.day, jasi.day);
  const atSeven = { year: 1990, month: 5, day: 15, hour: 7, minute: 5 };
  assert.notEqual(calculateChart(atSeven).variants[0].hour, calculateChart({ ...atSeven, trueSolarTime: { longitude: 126.978 } }).variants[0].hour);
});
test("invalid dates and leap flags fail closed", () => {
  assert.throws(() => calculateChart({ year: 2023, month: 2, day: 29 }));
  assert.throws(() => calculateChart({ year: 2024, month: 1, day: 1, isLeapMonth: true }));
  assert.throws(() => calculateChart({ year: 2024, month: 1, day: 1, isLunar: true, isLeapMonth: true }));
});
test("scores are deterministic, bounded and independent of hour; copy payload excludes raw input", () => {
  const self = calculateChart({ year: 1992, month: 10, day: 24, hour: 5 }).variants[0];
  const favorite = calculateChart({ year: 1990, month: 5, day: 15 }).variants[0];
  const a = compatibility({ self, favorite });
  assert.deepEqual(a, compatibility({ self: { ...self, hour: null }, favorite }));
  assert.ok(Object.values(a.scores).every(v => v >= 0 && v <= 100));
  assert.ok(a.evidence.length >= 3);
  const payload = JSON.stringify(readingInput({ self, favorite }));
  assert.doesNotMatch(payload, /1992|1990|birthTime|longitude|"name"|"self_name"|"favorite_name"|gender/);
  assert.equal(pairSchema.safeParse({ self, favorite, rawBirth: "1992-10-24" }).success, false);
});
