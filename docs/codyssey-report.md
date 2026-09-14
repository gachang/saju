# Codyssey report deployment

- Provider endpoint: `https://copa.codyssey.kr/v1/chat/completions`
- Model: `gpt-5.4`, low reasoning for draft, repairs and editorial review.
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
- `/report/example` is the existing synthetic accepted fixture, not a live
  personal reading or evidence that the new provider completed a request.

Verify offline with `node --import tsx --test tests/*.test.ts`, then explicitly
run `node --import tsx scripts/smoke-production-reading.ts` after deployment.
The live smoke test consumes provider credits and sends synthetic chart data only.
