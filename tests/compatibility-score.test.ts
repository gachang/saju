import test from "node:test";
import assert from "node:assert/strict";
import { AXES, compatibility, compatibilityScore } from "../src/lib/compatibility";

const chart = (pillar: string) => ({ year: pillar, month: pillar, day: pillar, hour: null });

test("relation-table extrema map to 1 and 100 without altering evidence", () => {
  const low = compatibility({ self: chart("갑자"), favorite: chart("신미") });
  const high = compatibility({ self: chart("병인"), favorite: chart("신해") });
  const before = structuredClone(high);
  assert.equal(compatibilityScore(low), 1);
  assert.equal(compatibilityScore(high), 100);
  assert.deepEqual(high, before);
});

test("all 3600 sexagenary pillar pairs stay bounded and preserve score ordering", () => {
  const stems = "갑을병정무기경신임계", branches = "자축인묘진사오미신유술해";
  const pillars = Array.from({ length: 60 }, (_, i) => stems[i % 10] + branches[i % 12]);
  const results = pillars.flatMap(a => pillars.map(b => {
    const result = compatibility({ self: chart(a), favorite: chart(b) });
    return { mean: AXES.reduce((sum, axis) => sum + result.scores[axis], 0) / 5, score: compatibilityScore(result) };
  })).sort((a, b) => a.mean - b.mean);
  results.forEach((result, i) => {
    assert.ok(Number.isInteger(result.score) && result.score >= 1 && result.score <= 100);
    if (i) assert.ok(result.score >= results[i - 1].score);
  });
});

test("the reported 58-point example now uses the unrounded mean and ignores birth time", () => {
  const pair = {
    self: { year: "신사", month: "계사", day: "갑신", hour: "갑자" },
    favorite: { year: "경진", month: "기축", day: "갑술", hour: null },
  };
  const result = compatibility(pair);
  assert.deepEqual(Object.values(result.scores), [56, 57, 58, 57, 60]);
  assert.equal(compatibilityScore(result), 24);
  assert.equal(compatibilityScore(compatibility({ ...pair, self: { ...pair.self, hour: null } })), 24);
});
