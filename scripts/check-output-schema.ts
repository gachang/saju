import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
const client = new OpenAI({ maxRetries: 0, timeout: 20_000 });
async function main() {
  // The pattern is an isolated compatibility probe, not the production output schema.
  const pattern = z.string().min(35).max(45).regex(/^[^,!?{}\r\n]+, [^,!?{}\r\n]*[^\s,!?{}]기니!?$/);
  for (const [label, title] of [["plain", z.string()], ["length", z.string().min(35).max(45)], ["pattern", pattern]] as const) {
    try {
      const response = await client.responses.parse({ model: "gpt-5.6-luna", reasoning: { effort: "low" }, store: false, max_output_tokens: 600,
        input: "title에 다음 제목을 그대로 반환하세요: 낯선 표현이 호기심을 깨우는 첫 감상, 입덕의 문을 여는 계기니",
        text: { format: zodTextFormat(z.object({ title }).strict(), "title_probe") } });
      console.log(JSON.stringify({ label, status: response.status, reason: response.incomplete_details?.reason, usage: response.usage, parsed: !!response.output_parsed }));
    } catch (error) { const e = error as { status?: number; code?: string; name?: string }; console.log(JSON.stringify({ label, status: e.status, code: e.code ?? e.name })); }
  }
}
void main();
