import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkpointScope, openCheckpoint, sealCheckpoint } from "../src/lib/reading-checkpoint";
const fixture = JSON.parse(readFileSync(new URL("./fixtures/accepted-report.json", import.meta.url), "utf8"));
test("checkpoint preserves accepted paragraphs and binds input, secret, expiry", () => {
  const scope = checkpointScope(fixture.pair);
  const token = sealCheckpoint({ scope, attempt: 1, report: fixture.report, editorial: {} }, "test-only-secret", 1000);
  assert.deepEqual(openCheckpoint(token, scope, "test-only-secret", 1001).report, fixture.report);
  assert.throws(() => openCheckpoint(token, "different", "test-only-secret", 1001));
  assert.throws(() => openCheckpoint(token, scope, "different-secret", 1001));
  assert.throws(() => openCheckpoint(token, scope, "test-only-secret", 1_801_000));
  assert.throws(() => openCheckpoint(`x${token}`, scope, "test-only-secret", 1001));
});
test("checkpoint limits resume attempts and retains unresolved editorial issues", () => {
  const scope = checkpointScope(fixture.pair);
  const value = { scope, attempt: 2, report: fixture.report, editorial: { "1": ["1:editorial:misread_evidence"] } };
  assert.deepEqual(openCheckpoint(sealCheckpoint(value, "test"), scope, "test").editorial, value.editorial);
  assert.throws(() => sealCheckpoint({ ...value, attempt: 4 }, "test"));
});
