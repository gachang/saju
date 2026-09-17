import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { createReadingClient } from "../src/lib/reading-client.server";

test("OpenAI transport uses strict structured output and rejects third-party keys", async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "sk-test-not-a-real-key";
  let finish = "stop", content = '{"title":"확인"}';
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "gpt-5.6-luna");
    assert.equal(body.response_format.type, "json_schema");
    assert.equal(body.response_format.json_schema.strict, true);
    assert.deepEqual(body.response_format.json_schema.schema.required, ["title"]);
    assert.equal(body.reasoning_effort, "low");
    assert.equal(body.store, false);
    assert.deepEqual(body.messages.map((m: { role: string }) => m.role), ["system", "user"]);
    assert.equal(body.max_completion_tokens, 100);
    assert.equal(body.input, undefined);
    return new Response(JSON.stringify({ choices: [{ finish_reason: finish, message: { role: "assistant", content } }] }), { headers: { "content-type": "application/json" } });
  };
  try {
    const client = createReadingClient(1000);
    const request = { model: "gpt-5.6-luna", instructions: "Return JSON", input: "test", max_output_tokens: 100, text: { format: zodTextFormat(z.object({ title: z.string() }), "test") } };
    assert.deepEqual((await client.structured.parse(request)).output_parsed, { title: "확인" });
    finish = "length";
    await assert.rejects(client.structured.parse(request), /READING_INCOMPLETE/);
    finish = "stop"; content = '{"title":3}';
    await assert.rejects(client.structured.parse(request));
    process.env.OPENAI_API_KEY = "sk-cody-not-for-this-provider";
    assert.throws(() => createReadingClient(1000), /READING_PROVIDER_KEY_REQUIRED/);
    delete process.env.OPENAI_API_KEY;
    assert.throws(() => createReadingClient(1000), /READING_PROVIDER_KEY_REQUIRED/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
