import "server-only";
import { pairSchema, nameLengthsSchema } from "@/lib/compatibility";
import { generateCompleteReading } from "@/lib/reading-complete.server";
import { readingFailure, validationSummary, rateLimitSummary } from "@/lib/reading-diagnostics";
import { checkpointScope, openCheckpoint, sealCheckpoint } from "@/lib/reading-checkpoint";
import { z } from "zod";
import type { Report } from "@/lib/reading-schema";

export const runtime = "nodejs";
export const maxDuration = 240;
// Per-instance backstop, NOT a global quota. Enable Vercel Firewall rate limits before public API launch.
let active = 0;
let windowStart = Date.now();
let calls = 0;
const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const requestSchema = pairSchema.extend({ name_lengths: nameLengthsSchema.optional(), resumeToken: z.string().max(100_000).optional() }).strict();

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return respond({ error: "AI 보고서 연결을 확인하고 있어요. 잠시 후 다시 시도해 주세요." }, 503);
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
      if (bytes > 105_000) { await reader.cancel(); return respond({ error: "요청이 너무 커요." }, 413); }
      text += decoder.decode(value, { stream: true });
    }
    pair = requestSchema.parse(JSON.parse(text + decoder.decode()));
  } catch { return respond({ error: "명식 형식을 확인해 주세요." }, 400); }
  const scope = checkpointScope({ self: pair.self, favorite: pair.favorite, name_lengths: pair.name_lengths });
  let checkpoint;
  try { checkpoint = pair.resumeToken ? openCheckpoint(pair.resumeToken, scope, process.env.OPENAI_API_KEY) : undefined; }
  catch { return respond({ error: "이어서 처리할 정보가 만료되었거나 유효하지 않아요." }, 400); }
  if (checkpoint && checkpoint.attempt >= 3) return respond({ code: "READING_ATTEMPTS", error: "자동 수정 횟수에 도달했어요. 추가 요청을 멈췄습니다." }, 422);
  // Recheck after awaiting the request body, so simultaneous slow requests cannot bypass this guard.
  if (active >= 2 || calls >= 6) return respond({ error: "요청이 많아요. 잠시 후 다시 시도해 주세요." }, 429);
  active++; calls++;
  const requestId = crypto.randomUUID();
  const started = Date.now();
  let phase = "draft";
  let partial: Report | undefined = checkpoint?.report;
  const attempt = (checkpoint?.attempt ?? 0) + 1;
  const continuation = (editorial: Record<string, string[]> = {}) => partial && attempt < 3
    ? sealCheckpoint({ scope, attempt, report: partial, editorial }, process.env.OPENAI_API_KEY!) : undefined;
  const log = (event: string, details: Record<string, unknown> = {}) => console.info(JSON.stringify({ event, requestId, phase, elapsedMs: Date.now() - started, ...details }));
  log("reading_started");
  try {
    const result = await generateCompleteReading({ self: pair.self, favorite: pair.favorite }, {
      signal: request.signal, nameLengths: pair.name_lengths,
      initial: partial, initialEditorialIssues: checkpoint?.editorial,
      onCheckpoint: report => { partial = report; },
      onPhase: value => { phase = value; log("reading_phase"); },
      onUsage: value => log("reading_call_completed", { model: value.model, callPhase: value.phase, callElapsedMs: value.elapsedMs }),
    });
    if (result.validation.length) {
      log("reading_quality_failed", { validation: validationSummary(result.validation), repairAttempts: result.attempts.length });
      partial = result.report;
      const editorial: Record<string, string[]> = {};
      for (const issue of result.validation) if (/^[1-8]:editorial:/.test(issue)) (editorial[issue.split(":")[0]] ??= []).push(issue);
      const resumeToken = continuation(editorial);
      if (resumeToken) return respond({ code: "READING_CONTINUE", resumeToken, requestId, retryAfter: 7 }, 202);
      return respond({ code: "READING_QUALITY", requestId, error: `보고서 품질 검사에 통과하지 못했어요. 확인 번호: ${requestId}` }, 502);
    }
    log("reading_completed");
    return respond({ report: result.report, promptVersion: result.promptVersion });
  } catch (error) {
    const failure = readingFailure(error);
    log("reading_failed", { code: failure.code, limits: rateLimitSummary(error) });
    const resumeToken = ["READING_TIMEOUT", "API_RATE_LIMIT"].includes(failure.code) ? continuation() : undefined;
    if (resumeToken) return respond({ code: failure.code, resumeToken, requestId, error: failure.error }, failure.status);
    return respond({ code: failure.code, requestId, error: `${failure.error} 확인 번호: ${requestId}` }, failure.status);
  } finally { active--; }
}
