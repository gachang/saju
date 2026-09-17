# OpenAI 직접 연동

현재 보고서는 `https://api.openai.com/v1/chat/completions`를 직접 호출합니다.
초안·보정·검수는 모두 Structured Outputs를 지원하는 저비용 모델 `gpt-4o-mini`를 사용합니다.
Structured Outputs와 서버의 분량·근거·문체 검사를 함께 사용합니다.

Vercel 프로젝트의 Environment Variables에서 사용자가 직접 설정합니다.

- `OPENAI_API_KEY`: 서버 전용 OpenAI 키, Production 환경에 설정
- 저장한 다음 Production 재배포 필요

기존 `CODYSSEY_API_KEY`와 커스텀 base URL 변수는 사용하지 않습니다.
키를 Git, 브라우저 코드, `NEXT_PUBLIC_` 변수에 넣지 마세요.
키 변경 전에 생성한 이어 처리 토큰은 무효가 되므로 새 보고서를 시작하세요.

프로덕션은 Vercel에 등록된 `OPENAI_API_KEY`만 서버 런타임에서 사용합니다.
실제 초안 생성, 서명된 중간 결과 이어 처리, 장별 보정과 편집 검수를 거쳐 8장·24문단을 완성합니다.
`scripts/smoke-openai.ts`는 명시적으로 실행할 때만 1회 유료 호출하며 자동 빌드에는 연결하지 않습니다.
