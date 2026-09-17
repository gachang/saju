import test from "node:test";
import assert from "node:assert/strict";
import { getCoupleTier } from "../src/lib/couple-tier";

test("score boundaries select the matching Figma couple tier", () => {
  const cases = [
    [100, "민트초코기니피그"],
    [81, "민트초코기니피그"],
    [80, "피클기니피그"],
    [61, "피클기니피그"],
    [60, "레몬기니피그"],
    [41, "레몬기니피그"],
    [40, "꽈배기니피그"],
    [21, "꽈배기니피그"],
    [20, "오니기리피그"],
    [0, "오니기리피그"],
  ] as const;

  for (const [score, expected] of cases) assert.equal(getCoupleTier(score).name, expected);
});

test("out-of-range scores are clamped", () => {
  assert.equal(getCoupleTier(150).name, "민트초코기니피그");
  assert.equal(getCoupleTier(-20).name, "오니기리피그");
});
