import test from "node:test";
import assert from "node:assert/strict";
import { withRateLimitRetry } from "../src/lib/openai-retry.server";

test("a successful request returns its original value with one attempt", async () => {
  const value = { completed: true };
  let calls = 0;
  const result = await withRateLimitRetry(async () => {
    calls += 1;
    return value;
  });
  assert.equal(result, value);
  assert.equal(calls, 1);
});

for (const failure of [
  { name: "authentication", status: 401, code: "invalid_api_key" },
  { name: "insufficient quota", status: 429, code: "insufficient_quota" },
  { name: "timeout", code: "ETIMEDOUT" },
  { name: "API timeout", status: 408, code: "request_timeout" },
  { name: "unclassified 429", status: 429 },
  { name: "server error", status: 500, code: "server_error" },
]) {
  test(`${failure.name} is propagated unchanged without retry`, async () => {
    let calls = 0;
    await assert.rejects(withRateLimitRetry(async () => {
      calls += 1;
      throw failure;
    }), error => error === failure);
    assert.equal(calls, 1);
  });
}

test("an already-aborted signal prevents the first request", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(withRateLimitRetry(async () => assert.fail("aborted work must not dispatch"), controller.signal), { name: "AbortError" });
});

test("cancellation after a confirmed transient 429 prevents waiting and dispatching again", async () => {
  const controller = new AbortController();
  const failure = { status: 429, code: "rate_limit_exceeded", headers: new Headers({ "retry-after": "30" }) };
  let calls = 0;
  await assert.rejects(withRateLimitRetry(async () => {
    calls += 1;
    controller.abort();
    throw failure;
  }, controller.signal), { name: "AbortError" });
  assert.equal(calls, 1);
});
