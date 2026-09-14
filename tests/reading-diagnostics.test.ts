import test from "node:test";
import assert from "node:assert/strict";
import { readingFailure, validationSummary } from "../src/lib/reading-diagnostics";

test("classifies quota separately from temporary rate limits", () => {
  assert.equal(readingFailure({ status: 429, code: "insufficient_quota" }).code, "API_QUOTA");
  assert.equal(readingFailure({ status: 429, code: "rate_limit_exceeded" }).code, "API_RATE_LIMIT");
  assert.equal(readingFailure({ status: 401 }).code, "API_AUTH");
  assert.equal(readingFailure({ code: "model_not_found" }).code, "API_ACCESS");
  assert.equal(readingFailure({ name: "APIConnectionTimeoutError" }).status, 504);
});
test("does not copy upstream secrets, messages or generated text", () => {
  const result = JSON.stringify(readingFailure({ message: "private input", code: "private input", body: "private input" }));
  assert.equal(result.includes("private input"), false);
  assert.deepEqual(validationSummary(["1:body_length=612", "2:editorial:meaning:private input", "private input"]), ["1:body_length", "2:editorial", "validation"]);
});
