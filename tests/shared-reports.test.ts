import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  selectSharedChart,
  sharedReportInputSchema,
  sharedReportRecordSchema,
  type SharedReportInput,
} from "../src/lib/shared-report-schema";
import {
  consumeSharedReportCreationQuota,
  loadSharedReport,
  saveSharedReport,
  sharedReportRedisKey,
  SHARED_REPORT_RATE_LIMIT,
  SHARED_REPORT_TTL_SECONDS,
  SharedReportStorageUnavailableError,
} from "../src/lib/shared-reports.server";
import { POST } from "../src/app/api/shared-reports/route";
import type { ChartResult } from "../src/lib/engine";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/accepted-report.json", import.meta.url), "utf8"));

const selfChart: ChartResult = {
  variants: [
    { year: "갑자", month: "을축", day: "병인", hour: "정묘" },
    { year: "갑자", month: "을축", day: "병인", hour: "무진" },
  ],
  coverage: "복수 명식",
  convention: "보정 없는 KST · midnight",
};

const favoriteChart: ChartResult = {
  variants: [{ year: "무진", month: "기사", day: "경오", hour: null }],
  coverage: "3주",
  convention: "보정 없는 KST · midnight",
};

const input: SharedReportInput = {
  selfName: "이규민",
  favoriteName: "이나경",
  groupName: "프로미스나인",
  selfChart: selectSharedChart(selfChart),
  favoriteChart: selectSharedChart(favoriteChart),
  report: fixture.report,
};

test("shared payload keeps one selected chart and rejects raw birth PII", () => {
  assert.equal(input.selfChart.variants.length, 1);
  assert.equal(input.selfChart.variants[0].hour, "정묘");
  assert.equal(input.selfChart.coverage, "복수 명식");
  assert.equal(sharedReportInputSchema.safeParse({ ...input, birthDate: "1999-01-02" }).success, false);
  assert.equal(sharedReportInputSchema.safeParse({
    ...input,
    selfChart: { ...input.selfChart, birthTime: "12:34" },
  }).success, false);
  assert.equal(sharedReportInputSchema.safeParse({
    ...input,
    selfChart: { ...input.selfChart, variants: selfChart.variants },
  }).success, false);
});

test("shared-report storage uses an opaque token, hashed key, and exact three-day TTL", async () => {
  const calls: Array<Array<string | number>> = [];
  let stored = "";
  const fetcher = async (_url: string | URL | Request, init?: RequestInit) => {
    const command = JSON.parse(String(init?.body)) as Array<string | number>;
    calls.push(command);
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-token");
    if (command[0] === "SET") {
      stored = String(command[2]);
      return Response.json({ result: "OK" });
    }
    return Response.json({ result: stored });
  };
  const now = () => new Date("2026-09-22T03:04:05.000Z");
  const dependencies = {
    fetcher,
    now,
    randomBytes: (size: number) => new Uint8Array(size).fill(7),
    env: { url: "https://example.upstash.io", token: "test-token" },
  };

  const saved = await saveSharedReport(input, dependencies);
  assert.match(saved.token, /^[A-Za-z0-9_-]{32}$/);
  assert.equal(saved.record.createdAt, "2026-09-22T03:04:05.000Z");
  assert.equal(saved.record.expiresAt, "2026-09-25T03:04:05.000Z");
  assert.deepEqual(calls[0].slice(0, 2), ["SET", sharedReportRedisKey(saved.token)]);
  assert.deepEqual(calls[0].slice(3), ["EX", SHARED_REPORT_TTL_SECONDS, "NX"]);
  assert.equal(String(calls[0][1]).includes(saved.token), false);
  assert.match(String(calls[0][1]), /^otaku-saju:shared-report:v1:[a-f0-9]{64}$/);
  assert.doesNotMatch(stored, /birthDate|birthTime|"year":"19\d\d"/u);
  assert.deepEqual(sharedReportRecordSchema.parse(JSON.parse(stored)), saved.record);

  const loaded = await loadSharedReport(saved.token, dependencies);
  assert.deepEqual(loaded, saved.record);
  assert.deepEqual(calls[1], ["GET", sharedReportRedisKey(saved.token)]);
});

test("shared-report loading rejects malformed tokens without querying storage", async () => {
  let called = false;
  const result = await loadSharedReport("../not-a-token", {
    fetcher: async () => { called = true; return Response.json({ result: null }); },
    env: { url: "https://example.upstash.io", token: "test-token" },
  });
  assert.equal(result, null);
  assert.equal(called, false);
});

test("shared-report creation quota is per fingerprint and one-minute bucket", async () => {
  let count = 0;
  const calls: Array<Array<string | number>> = [];
  const dependencies = {
    fetcher: async (_url: string | URL | Request, init?: RequestInit) => {
      const command = JSON.parse(String(init?.body)) as Array<string | number>;
      calls.push(command);
      if (command[0] === "INCR") return Response.json({ result: ++count });
      if (command[0] === "EXPIRE") return Response.json({ result: 1 });
      return Response.json({ result: null });
    },
    now: () => new Date("2026-09-22T03:04:05.000Z"),
    env: { url: "https://example.upstash.io", token: "test-token" },
  };

  for (let index = 0; index < SHARED_REPORT_RATE_LIMIT; index += 1) {
    assert.equal(await consumeSharedReportCreationQuota("203.0.113.8", dependencies), true);
  }
  assert.equal(await consumeSharedReportCreationQuota("203.0.113.8", dependencies), false);
  assert.deepEqual(calls[0]?.slice(0, 1), ["INCR"]);
  assert.deepEqual(calls[1]?.slice(0, 1), ["EXPIRE"]);
  assert.equal(String(calls[0]?.[1]).includes("203.0.113.8"), false);
});

test("shared-report storage fails closed when Upstash is not configured", async () => {
  await assert.rejects(
    saveSharedReport(input, { env: { url: "", token: "" } }),
    (error) => error instanceof SharedReportStorageUnavailableError,
  );
});

test("shared-report POST enforces same-origin JSON and returns a canonical link", async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  let command: Array<string | number> = [];
  globalThis.fetch = async (_url, init) => {
    command = JSON.parse(String(init?.body));
    if (command[0] === "INCR") return Response.json({ result: 1 });
    if (command[0] === "EXPIRE") return Response.json({ result: 1 });
    return Response.json({ result: "OK" });
  };

  try {
    const crossOrigin = await POST(new Request("https://otaku-saju-web.vercel.app/api/shared-reports", {
      method: "POST",
      headers: { origin: "https://attacker.example", "content-type": "application/json" },
      body: JSON.stringify(input),
    }));
    assert.equal(crossOrigin.status, 403);

    const response = await POST(new Request("https://otaku-saju-web.vercel.app/api/shared-reports", {
      method: "POST",
      headers: { origin: "https://otaku-saju-web.vercel.app", "content-type": "application/json" },
      body: JSON.stringify(input),
    }));
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
    const body = await response.json() as { token: string; path: string; url: string; expiresAt: string };
    assert.equal(body.path, `/report/${body.token}`);
    assert.equal(body.url, `https://otaku-saju-web.vercel.app${body.path}`);
    assert.match(body.expiresAt, /^\d{4}-\d{2}-\d{2}T/u);
    assert.deepEqual(command.slice(3), ["EX", SHARED_REPORT_TTL_SECONDS, "NX"]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});

test("shared-report POST returns 503 before reading a body when storage is absent", async () => {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  try {
    const response = await POST(new Request("https://otaku-saju-web.vercel.app/api/shared-reports", {
      method: "POST",
      headers: { origin: "https://otaku-saju-web.vercel.app", "content-type": "application/json" },
      body: "{}",
    }));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  } finally {
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});
