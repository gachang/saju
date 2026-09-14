import OpenAI from "openai";
import type { AutoParseableTextFormat } from "openai/lib/parser";

export const READING_MODEL = "gpt-5.6-luna" as const;
export const READING_BASE_URL = "https://api.openai.com/v1";

/** All report stages call OpenAI directly; never forward a third-party key. */
export function createReadingClient(timeout: number) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith("sk-cody-")) throw new Error("READING_PROVIDER_KEY_REQUIRED");
  const client = new OpenAI({ apiKey, baseURL: READING_BASE_URL, maxRetries: 0, timeout });
  return { structured: { async parse<T>(request: {
    model: string; instructions: string; input: string; max_output_tokens: number;
    text: { format: AutoParseableTextFormat<T>; verbosity?: string };
    reasoning?: { effort: "low" }; store?: false; tools?: never[];
  }, options: { signal?: AbortSignal } = {}) {
    const format = request.text.format;
    const response = await client.chat.completions.create({
      model: request.model,
      messages: [{ role: "system", content: request.instructions }, { role: "user", content: request.input }],
      response_format: { type: "json_schema", json_schema: { name: format.name, strict: true, schema: format.schema } },
      reasoning_effort: request.reasoning?.effort ?? "low",
      store: false,
      max_completion_tokens: request.max_output_tokens,
      stream: false,
    }, options);
    const choice = response.choices[0];
    if (!choice || choice.finish_reason !== "stop" || choice.message.refusal || !choice.message.content) {
      throw new Error("READING_INCOMPLETE");
    }
    return { status: "completed" as const, output_parsed: format.$parseRaw(choice.message.content), usage: response.usage };
  } } };
}
