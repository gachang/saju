import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: 20000 });
const headers = h => Object.fromEntries(["retry-after", "retry-after-ms", "x-ratelimit-limit-requests", "x-ratelimit-remaining-requests", "x-ratelimit-reset-requests", "x-ratelimit-limit-tokens", "x-ratelimit-remaining-tokens", "x-ratelimit-reset-tokens"].map(k => [k, h?.get(k) ?? null]));
try {
  const model = process.argv[2] === "luna" ? "gpt-5.6-luna" : "gpt-5.6-terra";
  const { data, response } = await client.responses.create({ model, input: "Reply OK.", reasoning: { effort: "low" }, max_output_tokens: 256, store: false }).withResponse();
  console.log(JSON.stringify({ status: response.status, responseStatus: data.status, headers: headers(response.headers), usage: data.usage }));
} catch (error) {
  // Extract only diagnostic categories/numbers, never print the error body or credentials.
  const message = String(error.message ?? "");
  console.log(JSON.stringify({ status: error.status, code: error.code, headers: headers(error.headers),
    category: /tokens per min|tokens per minute|TPM/i.test(message) ? "tokens_per_minute" : /requests per min|RPM/i.test(message) ? "requests_per_minute" : "other",
    numbers: message.match(/(?:Limit|Used|Requested|try again in)[^\d]{0,8}[\d.,]+\s*(?:ms|s|m|h)?/gi) ?? [] }));
}
