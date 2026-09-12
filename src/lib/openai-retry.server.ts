import { setTimeout as wait } from "node:timers/promises";

const durationMs = (text: string | null | undefined) => Array.from((text ?? "").matchAll(/([\d.]+)(ms|s|m|h)/g))
  .reduce((sum, [, value, unit]) => sum + Number(value) * ({ ms: 1, s: 1000, m: 60000, h: 3600000 }[unit] ?? 0), 0);

// Retry only a confirmed transient rate limit, never billing/authentication/timeouts.
export async function withRateLimitRetry<T>(request: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try { return await request(); }
    catch (error) {
      const failure = error as { status?: number; code?: string; headers?: Headers };
      if (attempt >= 2 || failure.status !== 429 || failure.code !== "rate_limit_exceeded") throw error;
      const seconds = Number(failure.headers?.get("retry-after"));
      const milliseconds = Number(failure.headers?.get("retry-after-ms"));
      const tokenReset = durationMs(failure.headers?.get("x-ratelimit-reset-tokens"));
      const requestReset = failure.headers?.get("x-ratelimit-remaining-requests") === "0" ? durationMs(failure.headers?.get("x-ratelimit-reset-requests")) : 0;
      const delay = Math.max(2000 * 2 ** attempt, milliseconds || seconds * 1000 || tokenReset + 500, requestReset);
      if (delay > 60_000) throw error; // A long daily-limit reset is not a useful in-request retry.
      await wait(delay, undefined, { signal });
    }
  }
}
