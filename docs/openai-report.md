# OpenAI 직접 연동

현재 보고서는 `https://api.openai.com/v1/chat/completions`를 직접 호출합니다.
초안·보정·검수는 모두 `gpt-5.6-luna`, reasoning effort `low`를 사용합니다.
Structured Outputs와 서버의 분량·근거·문체 검사를 함께 사용합니다.

Vercel 프로젝트의 Environment Variables에서 사용자가 직접 설정합니다.

- `OPENAI_API_KEY`: 서버 전용 OpenAI 키, Production 환경에 설정
- `READING_API_ENABLED`: `true`
- 저장한 다음 Production 재배포 필요

기존 `CODYSSEY_API_KEY`와 커스텀 base URL 변수는 사용하지 않습니다.
키를 Git, 브라우저 코드, `NEXT_PUBLIC_` 변수에 넣지 마세요.
키 변경 전에 생성한 이어 처리 토큰은 무효가 되므로 새 보고서를 시작하세요.

2026-09-17 Vercel Production 키로 Luna 전체 보고서 테스트를 통과했습니다.
실제 초안 생성, 서명된 중간 결과 이어 처리, 장별 보정과 편집 검수를 거쳐 HTTP 200으로 8장·24문단을 받았습니다.
표시 본문 길이는 장별 701, 710, 718, 709, 729, 736, 709, 725자이며 모든 최종 검사를 통과했습니다.
`scripts/smoke-openai.ts`는 명시적으로 실행할 때만 1회 유료 호출하며 자동 빌드에는 연결하지 않습니다.
저장된 `/report/example`은 이 실제 OpenAI Luna 생성 결과를 사용합니다.
