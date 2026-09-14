import OpenAI from "openai";
import type { AutoParseableTextFormat } from "openai/lib/parser";

export const READING_MODEL = "gpt-5.4" as const;
export const READING_BASE_URL = "https://copa.codyssey.kr/v1";

/** All report stages use the explicitly selected provider; no direct-OpenAI fallback. */
export function createReadingClient(timeout: number) {
  if (!process.env.CODYSSEY_API_KEY?.startsWith("sk-cody-")) throw new Error("READING_PROVIDER_KEY_REQUIRED");
  const client = new OpenAI({ apiKey: process.env.CODYSSEY_API_KEY, baseURL: READING_BASE_URL, maxRetries: 0, timeout });
  return { structured: { async parse<T>(request: {
    model: string; instructions: string; input: string; max_output_tokens: number;
    text: { format: AutoParseableTextFormat<T>; verbosity?: string };
    reasoning?: { effort: "low" }; store?: false; tools?: never[];
  }, options: { signal?: AbortSignal } = {}) {
    const format = request.text.format;
    const response = await client.chat.completions.create({
      model: request.model,
      messages: [{ role: "system", content: request.instructions }, { role: "user", content: request.input }],
      max_completion_tokens: request.max_output_tokens,
      reasoning_effort: "low",
      response_format: { type: "json_schema", json_schema: { name: format.name, strict: true, schema: format.schema } },
      stream: false,
    }, options);
    const choice = response.choices[0];
    if (!choice || choice.finish_reason !== "stop" || choice.message.refusal || !choice.message.content) {
      throw new Error("READING_INCOMPLETE");
    }
    return { status: "completed" as const, output_parsed: format.$parseRaw(choice.message.content), usage: response.usage };
  } } };
}
