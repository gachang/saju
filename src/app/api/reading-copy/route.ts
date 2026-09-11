import "server-only";
import { pairSchema } from "@/lib/compatibility";
import { generateReading } from "@/lib/reading.server";

export const runtime = "nodejs";
export const maxDuration = 240;
// Per-instance backstop, NOT a global quota. Enable Vercel Firewall rate limits before public API launch.
let active = 0;
let windowStart = Date.now();
let calls = 0;
const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (process.env.READING_API_ENABLED !== "true" || !process.env.OPENAI_API_KEY) return respond({ error: "AI 보고서는 준비 중이에요. 아래 계산 결과를 먼저 확인해 주세요." }, 503);
  if (request.headers.get("origin") !== new URL(request.url).origin) return respond({ error: "허용되지 않은 요청이에요." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return respond({ error: "JSON 형식이 필요해요." }, 415);
  if (Date.now() - windowStart > 60_000) { windowStart = Date.now(); calls = 0; }
  if (active >= 2 || calls >= 6) return respond({ error: "요청이 많아요. 잠시 후 다시 시도해 주세요." }, 429);
  let pair;
  try {
    const reader = request.body?.getReader();
    if (!reader) return respond({ error: "명식 정보가 필요해요." }, 400);
    let bytes = 0, text = "";
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) { await reader.cancel(); return respond({ error: "요청이 너무 커요." }, 413); }
      text += decoder.decode(value, { stream: true });
    }
    pair = pairSchema.parse(JSON.parse(text + decoder.decode()));
  } catch { return respond({ error: "명식 형식을 확인해 주세요." }, 400); }
  // Recheck after awaiting the request body, so simultaneous slow requests cannot bypass this guard.
  if (active >= 2 || calls >= 6) return respond({ error: "요청이 많아요. 잠시 후 다시 시도해 주세요." }, 429);
  active++; calls++;
  try {
    let result = await generateReading(pair);
    if (result.validation.length) result = await generateReading(pair, { previous: result.report });
    if (result.validation.length) return respond({ error: "보고서 품질 검사에 통과하지 못했어요. 계산 결과는 계속 확인할 수 있어요." }, 502);
    return respond({ report: result.report, promptVersion: result.promptVersion });
  } catch {
    return respond({ error: "AI 보고서를 불러오지 못했어요. 계산 결과는 계속 확인할 수 있어요." }, 502);
  } finally { active--; }
}
