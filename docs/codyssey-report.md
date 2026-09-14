# Codyssey report deployment

- Provider endpoint: `https://copa.codyssey.kr/v1/chat/completions`
- Model: `gpt-5.4` for draft, repairs and editorial review. Codyssey currently
  rejects `reasoning_effort` and both `response_format` variants with HTTP 400
  `unsupported_feature` (verified with minimal requests). These options are omitted.
  JSON Schema is included in the system instruction and validated locally; this
  is not provider-enforced Structured Outputs. Invalid or truncated JSON fails closed.
- Server-only secret: `CODYSSEY_API_KEY`; feature flag: `READING_API_ENABLED=true`.
- The previous `OPENAI_API_KEY` is not read by production report code. It is not
  sent to Codyssey. There is no automatic provider/model fallback.
- Structured JSON is parsed against the existing schema. Eight chapters, three
  paragraphs each, text lengths and evidence checks still gate publication.
- Rotating the provider key invalidates previous signed continuation tokens.
- Figma source: `KuFWGYWdTDWmMaaamF5C5G`, node `2011:4530`. Original exported
  pair illustration, zodiac, divider, chevron and share icon are self-hosted in
  `public/report`. The first chapter is expanded; the other seven are accessible
  native disclosure controls. Unknown birth hours remain unknown.
- `/report/example` uses the synthetic Codyssey GPT-5.4 report generated and
  repaired on 2026-09-14, with eight validated chapters and a clean editorial
  review. It is a saved example, never substituted for a visitor's live report.

Verify offline with `node --import tsx --test tests/*.test.ts`, then explicitly
run `node --import tsx scripts/smoke-production-reading.ts` after deployment.
The live smoke test consumes provider credits and sends synthetic chart data only.
# 과거 연동 기록

이 문서는 이전 Codyssey 구성의 기록입니다. 현재 설정은 [OpenAI 직접 연동](openai-report.md)을 따릅니다.
