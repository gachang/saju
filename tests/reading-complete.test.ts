import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nameLengthsSchema, pairSchema } from "../src/lib/compatibility";
import { generateCompleteReading } from "../src/lib/reading-complete.server";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "../src/lib/reading-prompt";
import { REPORT_CHAPTER_TITLES, reportSchema } from "../src/lib/reading-schema";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/accepted-report.json", import.meta.url), "utf8"));
const acceptedReport = reportSchema.parse(fixture.report);
const pair = pairSchema.parse(fixture.pair);
const nameLengths = nameLengthsSchema.parse(fixture.nameLengths);

type CapturedRequest = {
  url: string;
  body: {
    messages: { role: string; content: string }[];
    response_format: {
      type: string;
      json_schema: {
        strict: boolean;
        schema: { properties: { sections: { items: { properties: { title: { minLength: number; maxLength: number } } } } } };
      };
    };
  };
};

async function completeOfflineWithTitle(title: string) {
  const draft = structuredClone(acceptedReport);
  draft.sections[0].title = title;
  const requests: CapturedRequest[] = [];
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "sk-test-not-a-real-key";
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify({
      choices: [{ finish_reason: "stop", message: { role: "assistant", content: JSON.stringify(draft) } }],
      usage: { prompt_tokens: 100, completion_tokens: 100, total_tokens: 200 },
    }), { headers: { "content-type": "application/json" } });
  };
  try {
    const result = await generateCompleteReading(pair, { today: "2026-09-12", nameLengths });
    return { result, requests, draft };
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
}

function assertOnePassResult({ result, requests }: Awaited<ReturnType<typeof completeOfflineWithTitle>>) {
  assert.deepEqual(result.validation, []);
  assert.deepEqual(result.attempts, []);
  assert.deepEqual(result.editorial, []);
  assert.equal(result.promptVersion, PROMPT_VERSION);
  assert.equal(result.report.sections.length, 8);
  assert.deepEqual(result.report.sections.map(section => section.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  result.report.sections.forEach(section => assert.equal(section.paragraphs.length, 3));
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.openai.com/v1/chat/completions");
  assert.deepEqual(requests[0].body.messages.map(message => message.role), ["system", "user"]);
  assert.equal(requests[0].body.messages[0].content, SYSTEM_PROMPT);
  assert.equal(requests[0].body.response_format.type, "json_schema");
  assert.equal(requests[0].body.response_format.json_schema.strict, true);
  const titleSchema = requests[0].body.response_format.json_schema.schema.properties.sections.items.properties.title;
  assert.equal(titleSchema.minLength, 1);
  assert.equal(titleSchema.maxLength, 100);
}

test("complete generation replaces the observed request-error title in one offline call", async () => {
  const observedTitle = "어두운 화면을 가른 한 줄의 빛, 시선이 오래 머물-요청 형식 오류로 생성 불기니";
  const completed = await completeOfflineWithTitle(observedTitle);
  assertOnePassResult(completed);
  assert.equal(completed.result.report.sections[0].title, REPORT_CHAPTER_TITLES[0]);
  const expected = structuredClone(completed.draft);
  expected.sections[0].title = REPORT_CHAPTER_TITLES[0];
  assert.deepEqual(completed.result.report, expected);
  assert.equal(completed.draft.sections[0].title, observedTitle);
});

test("complete generation preserves a short complete title in one offline call", async () => {
  const shortTitle = "화면의 한 줄기 빛, 눈길이 머무는 순간이기니";
  assert.ok(shortTitle.length < 35);
  const completed = await completeOfflineWithTitle(shortTitle);
  assertOnePassResult(completed);
  assert.equal(completed.result.report.sections[0].title, shortTitle);
  assert.deepEqual(completed.result.report, completed.draft);
});
