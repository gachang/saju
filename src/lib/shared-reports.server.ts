import { createHash, randomBytes as secureRandomBytes } from "node:crypto";
import { sharedReportInputSchema, sharedReportRecordSchema, type SharedReportInput, type SharedReportRecord } from "./shared-report-schema";

export const SHARED_REPORT_TTL_SECONDS = 259_200;
export const SHARED_REPORT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;
export const SHARED_REPORT_RATE_LIMIT = 12;

const KEY_PREFIX = "otaku-saju:shared-report:v1:";
const RATE_KEY_PREFIX = "otaku-saju:shared-report-rate:v1:";
const RATE_WINDOW_SECONDS = 60;
const UPSTASH_TIMEOUT_MS = 5_000;
const MAX_TOKEN_ATTEMPTS = 3;

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type StoreDependencies = {
  fetcher?: Fetcher;
  now?: () => Date;
  randomBytes?: (size: number) => Uint8Array;
  env?: {
    url?: string;
    token?: string;
  };
};

type UpstashEnvelope = { result?: unknown; error?: unknown };

export class SharedReportStorageUnavailableError extends Error {
  constructor() {
    super("SHARED_REPORT_STORAGE_UNAVAILABLE");
    this.name = "SharedReportStorageUnavailableError";
  }
}

function runtimeStorageEnvironment(): { url?: string; token?: string } {
  const candidates = [
    {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    },
  ];

  return candidates.find(({ url, token }) => url?.trim() && token?.trim()) ?? {};
}

function storageConfig(dependencies: StoreDependencies) {
  const environment = dependencies.env ?? runtimeStorageEnvironment();
  const rawUrl = environment.url;
  const token = environment.token;
  if (!rawUrl?.trim() || !token?.trim()) throw new SharedReportStorageUnavailableError();

  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
      throw new Error("invalid Upstash URL");
    }
    return { url: url.toString().replace(/\/$/u, ""), token: token.trim() };
  } catch {
    throw new SharedReportStorageUnavailableError();
  }
}

export function hasSharedReportStorageConfig() {
  try {
    storageConfig({});
    return true;
  } catch {
    return false;
  }
}

async function command(
  args: Array<string | number>,
  dependencies: StoreDependencies,
): Promise<unknown> {
  const config = storageConfig(dependencies);
  const fetcher = dependencies.fetcher ?? fetch;
  let response: Response;
  try {
    response = await fetcher(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
    });
  } catch {
    throw new SharedReportStorageUnavailableError();
  }

  if (!response.ok) throw new SharedReportStorageUnavailableError();
  let envelope: UpstashEnvelope;
  try {
    envelope = JSON.parse(await response.text()) as UpstashEnvelope;
  } catch {
    throw new SharedReportStorageUnavailableError();
  }
  if (!("result" in envelope) || envelope.error !== undefined) {
    throw new SharedReportStorageUnavailableError();
  }
  return envelope.result;
}

function tokenFrom(random: (size: number) => Uint8Array) {
  return Buffer.from(random(24)).toString("base64url");
}

export function sharedReportRedisKey(token: string) {
  if (!SHARED_REPORT_TOKEN_PATTERN.test(token)) return null;
  const digest = createHash("sha256").update(token, "utf8").digest("hex");
  return `${KEY_PREFIX}${digest}`;
}

export async function consumeSharedReportCreationQuota(
  fingerprint: string,
  dependencies: StoreDependencies = {},
): Promise<boolean> {
  const now = (dependencies.now ?? (() => new Date()))();
  if (!Number.isFinite(now.getTime())) throw new TypeError("Invalid shared-report timestamp");
  const bucket = Math.floor(now.getTime() / (RATE_WINDOW_SECONDS * 1_000));
  const digest = createHash("sha256")
    .update(`${fingerprint.trim().slice(0, 256)}:${bucket}`, "utf8")
    .digest("hex");
  const key = `${RATE_KEY_PREFIX}${digest}`;
  const count = await command(["INCR", key], dependencies);
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 1) {
    throw new SharedReportStorageUnavailableError();
  }
  if (count === 1) {
    const expirySet = await command(["EXPIRE", key, RATE_WINDOW_SECONDS], dependencies);
    if (expirySet !== 1) throw new SharedReportStorageUnavailableError();
  }
  return count <= SHARED_REPORT_RATE_LIMIT;
}

export async function saveSharedReport(
  input: SharedReportInput,
  dependencies: StoreDependencies = {},
): Promise<{ token: string; record: SharedReportRecord }> {
  const parsed = sharedReportInputSchema.parse(input);
  const now = (dependencies.now ?? (() => new Date()))();
  if (!Number.isFinite(now.getTime())) throw new TypeError("Invalid shared-report timestamp");
  const record = sharedReportRecordSchema.parse({
    ...parsed,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SHARED_REPORT_TTL_SECONDS * 1_000).toISOString(),
  });
  const value = JSON.stringify(record);
  const random = dependencies.randomBytes ?? secureRandomBytes;

  for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt += 1) {
    const token = tokenFrom(random);
    if (!SHARED_REPORT_TOKEN_PATTERN.test(token)) throw new Error("SHARED_REPORT_TOKEN_GENERATION_FAILED");
    const key = sharedReportRedisKey(token);
    if (!key) throw new Error("SHARED_REPORT_TOKEN_GENERATION_FAILED");
    const result = await command(["SET", key, value, "EX", SHARED_REPORT_TTL_SECONDS, "NX"], dependencies);
    if (result === "OK") return { token, record };
    if (result !== null) throw new SharedReportStorageUnavailableError();
  }

  throw new SharedReportStorageUnavailableError();
}

export async function loadSharedReport(
  token: string,
  dependencies: StoreDependencies = {},
): Promise<SharedReportRecord | null> {
  const key = sharedReportRedisKey(token);
  if (!key) return null;
  const result = await command(["GET", key], dependencies);
  if (result === null) return null;
  if (typeof result !== "string") throw new SharedReportStorageUnavailableError();

  let record: SharedReportRecord;
  try {
    record = sharedReportRecordSchema.parse(JSON.parse(result));
  } catch {
    throw new SharedReportStorageUnavailableError();
  }
  const now = (dependencies.now ?? (() => new Date()))();
  if (new Date(record.expiresAt).getTime() <= now.getTime()) return null;
  return record;
}
