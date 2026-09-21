import { z } from "zod";
import { sharedReportInputSchema } from "@/lib/shared-report-schema";
import {
  consumeSharedReportCreationQuota,
  hasSharedReportStorageConfig,
  saveSharedReport,
  SharedReportStorageUnavailableError,
} from "@/lib/shared-reports.server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 100_000;
const PRODUCTION_ORIGIN = "https://otaku-saju-web.vercel.app";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

const respond = (body: unknown, status: number, headers?: HeadersInit) => Response.json(body, {
  status,
  headers: { ...responseHeaders, ...Object.fromEntries(new Headers(headers).entries()) },
});

function firstForwardedValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() ?? "";
}

function requestOrigin(request: Request) {
  const rawOrigin = request.headers.get("origin");
  if (!rawOrigin) return null;
  let origin: URL;
  let requestUrl: URL;
  try {
    origin = new URL(rawOrigin);
    requestUrl = new URL(request.url);
  } catch {
    return null;
  }
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return null;

  const forwardedHost = firstForwardedValue(request.headers.get("x-forwarded-host"));
  const host = firstForwardedValue(request.headers.get("host"));
  const allowedHosts = new Set([requestUrl.host, forwardedHost, host].filter(Boolean));
  if (!allowedHosts.has(origin.host)) return null;

  const forwardedProto = firstForwardedValue(request.headers.get("x-forwarded-proto"));
  const expectedProtocol = forwardedProto ? `${forwardedProto}:` : requestUrl.protocol;
  if (origin.protocol !== expectedProtocol) return null;
  if (origin.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) return null;
  return origin.origin;
}

function publicOrigin(origin: string) {
  const url = new URL(origin);
  return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ? url.origin : PRODUCTION_ORIGIN;
}

function clientFingerprint(request: Request) {
  return firstForwardedValue(
    request.headers.get("x-vercel-forwarded-for")
      ?? request.headers.get("x-forwarded-for")
      ?? request.headers.get("x-real-ip"),
  ) || "unknown-client";
}

class BodyTooLargeError extends Error {}

async function readJson(request: Request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new BodyTooLargeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("missing body");
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode()) as unknown;
}

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  if (!origin) return respond({ error: "허용되지 않은 요청이에요." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return respond({ error: "JSON 형식이 필요해요." }, 415);
  }
  if (!hasSharedReportStorageConfig()) {
    return respond({ error: "공유 링크 저장소를 연결하고 있어요. 잠시 후 다시 시도해 주세요." }, 503);
  }

  try {
    const allowed = await consumeSharedReportCreationQuota(clientFingerprint(request));
    if (!allowed) {
      return respond(
        { error: "공유 링크 요청이 잠시 많아요. 1분 뒤 다시 시도해 주세요." },
        429,
        { "Retry-After": "60" },
      );
    }
  } catch {
    return respond({ error: "공유 링크를 만들 수 없어요. 잠시 후 다시 시도해 주세요." }, 503);
  }

  let input;
  try {
    input = sharedReportInputSchema.parse(await readJson(request));
  } catch (error) {
    if (error instanceof BodyTooLargeError) return respond({ error: "요청이 너무 커요." }, 413);
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return respond({ error: "공유할 보고서 형식을 확인해 주세요." }, 400);
    }
    return respond({ error: "공유할 보고서 형식을 확인해 주세요." }, 400);
  }

  try {
    const { token, record } = await saveSharedReport(input);
    const path = `/report/${token}`;
    return respond({
      token,
      path,
      url: new URL(path, publicOrigin(origin)).toString(),
      expiresAt: record.expiresAt,
    }, 201);
  } catch (error) {
    if (!(error instanceof SharedReportStorageUnavailableError)) {
      console.error(JSON.stringify({ event: "shared_report_save_failed", code: "UNEXPECTED_STORAGE_ERROR" }));
    }
    return respond({ error: "공유 링크를 만들 수 없어요. 잠시 후 다시 시도해 주세요." }, 503);
  }
}
