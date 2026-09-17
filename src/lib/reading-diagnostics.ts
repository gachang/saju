// Never serialize upstream errors: messages/bodies can contain keys or report text.
export function readingFailure(error: unknown) {
  const e = (error && typeof error === "object" ? error : {}) as { status?: number; code?: string; name?: string };
  if (e.code === "insufficient_quota") return { code: "API_QUOTA", status: 503, error: "AI 서비스의 사용 한도가 소진됐어요. 운영자 확인이 필요해요." };
  if (e.status === 401) return { code: "API_AUTH", status: 503, error: "AI 서비스 인증 설정을 확인하고 있어요." };
  if (e.status === 403 || e.code === "model_not_found") return { code: "API_ACCESS", status: 503, error: "AI 모델 접근 권한을 확인하고 있어요." };
  if (e.status === 429) return { code: "API_RATE_LIMIT", status: 429, error: "AI 요청 한도에 도달했어요. 잠시 후 다시 시도해 주세요." };
  if (["TimeoutError", "AbortError", "APIConnectionTimeoutError", "APIUserAbortError"].includes(e.name ?? "")) return { code: "READING_TIMEOUT", status: 504, error: "보고서 처리 시간이 초과됐어요. 계산 결과는 계속 확인할 수 있어요." };
  if (e.name === "ZodError" || e.name === "SyntaxError") return { code: "READING_FORMAT", status: 502, error: "AI 응답 형식을 확인하지 못했어요. 계산 결과는 계속 확인할 수 있어요." };
  return { code: "READING_FAILED", status: 502, error: "AI 보고서를 불러오지 못했어요. 계산 결과는 계속 확인할 수 있어요." };
}

export function validationSummary(errors: string[]) {
  // Only section numbers and fixed validation labels; never quotes/explanations.
  return errors.map(value => {
    const editorial = value.match(/^([1-8]):editorial:([a-z_]+):/);
    if (editorial) return `${editorial[1]}:editorial:${editorial[2]}`;
    const match = value.match(/^([1-8]):([a-z_]+)(?:=|:|$)/);
    return match ? `${match[1]}:${match[2]}` : "validation";
  }).filter((value, index, all) => all.indexOf(value) === index).slice(0, 40);
}

export function rateLimitSummary(error: unknown) {
  const e = error as { status?: number; headers?: { get?: (name: string) => string | null } } | null;
  if (e?.status !== 429 || typeof e.headers?.get !== "function") return {};
  const result: Record<string, string> = {};
  for (const name of ["retry-after", "retry-after-ms", "x-ratelimit-limit-requests", "x-ratelimit-limit-tokens", "x-ratelimit-remaining-requests", "x-ratelimit-remaining-tokens", "x-ratelimit-reset-requests", "x-ratelimit-reset-tokens"]) {
    const value = e.headers.get(name);
    if (value && /^[\d.msh]+$/.test(value) && value.length <= 40) result[name] = value;
  }
  return result;
}
