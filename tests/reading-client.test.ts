import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { createReadingClient } from "../src/lib/reading-client.server";

test("Codyssey transport uses Chat Completions, gpt-5.4, and validates structured output", async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.CODYSSEY_API_KEY;
  process.env.CODYSSEY_API_KEY = "sk-cody-test-not-a-real-key";
  let finish = "stop", content = '{"title":"확인"}';
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://copa.codyssey.kr/v1/chat/completions");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "gpt-5.4");
    assert.equal(body.response_format.type, "json_schema");
    assert.deepEqual(body.messages.map((m: { role: string }) => m.role), ["system", "user"]);
    assert.equal(body.max_completion_tokens, 100);
    assert.equal(body.input, undefined);
    return new Response(JSON.stringify({ choices: [{ finish_reason: finish, message: { role: "assistant", content } }] }), { headers: { "content-type": "application/json" } });
  };
  try {
    const client = createReadingClient(1000);
    const request = { model: "gpt-5.4", instructions: "Return JSON", input: "test", max_output_tokens: 100, text: { format: zodTextFormat(z.object({ title: z.string() }), "test") } };
    assert.deepEqual((await client.structured.parse(request)).output_parsed, { title: "확인" });
    finish = "length";
    await assert.rejects(client.structured.parse(request), /READING_INCOMPLETE/);
    finish = "stop"; content = '{"title":3}';
    await assert.rejects(client.structured.parse(request));
    process.env.CODYSSEY_API_KEY = "sk-proj-not-for-this-provider";
    assert.throws(() => createReadingClient(1000), /READING_PROVIDER_KEY_REQUIRED/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.CODYSSEY_API_KEY;
    else process.env.CODYSSEY_API_KEY = previousKey;
  }
});
