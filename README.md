# 성덕기니 / 오타쿠 사주

앱은 저장소 루트에 있습니다. 기존 `saju/` 하위 경로는 제거했습니다.
Vercel `otaku-saju-web`의 Root Directory는 빈 값(저장소 루트), Production Branch는 `main`입니다.

## 계산과 보고서

- 주 계산: `manseryeok@2.0.0`, 한국 표준시/자정 일 경계. 시간 미상은 전체 분 단위를 검토해 가능한 명식을 표시합니다.
- 검증 전용: `@fullstackfamily/manseryeok@1.0.8`. 음양력과 절기 경계에서 떨어진 날짜의 명식을 보정 없이 비교합니다. 런타임 결과를 두 라이브러리에서 섞지 않습니다.
- 5축은 `compat-v1.0-core` 자체 엔터테인먼트 규칙입니다. 연/월/일 20/30/50%이며 사용자와 최애 모두 시주는 제외합니다. 실제 관계 확률이나 검증된 성격 척도가 아닙니다.
- 이 버전은 같은 위치의 기둥 간 천간 합·상생·비화·상극과 지지 육합·충·일부 형·해·파를 다룹니다. 교차 위치, 삼합·방합, 삼형 전체, 원진·십신·용신·대운·신살, 연도별 예측은 포함하지 않습니다.
- OpenAI Responses API `gpt-5.6-luna`, 구조화 출력, `store:false`, 도구 없음. 고정 프롬프트: `src/lib/reading-prompt.ts`.
- 브라우저에서 명식을 계산하며 API에는 선택한 명식만 전달합니다. 서버가 점수와 승인된 근거를 다시 구성한 뒤 OpenAI에는 근거·점수·범위만 보냅니다. 원본 생일/호칭/성별/그룹명은 전송하지 않습니다.
- 선택한 명식의 형식은 검증하지만 원본 생일의 진위까지 서버가 인증하지는 않습니다. 출생정보·명식·보고서는 서버 저장소나 브라우저 저장소에 저장하지 않습니다.
- API 실패/분량·근거·형식 검사 실패 시 계산 결과를 유지하고 안내합니다. 짧은 기본 해석을 완성된 AI 보고서로 가장하지 않습니다.

## 실행 및 API 테스트

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
pnpm test
pnpm lint
pnpm build
# OPENAI_API_KEY를 실행 환경에 제공한 상태에서만, 합성 입력 4회 테스트
pnpm eval:reading 0 4 baseline
```

이 환경의 pnpm 자동 설치 정책이 방해하면 `node --import tsx tests/engine.test.ts`, `node --import tsx tests/reading.test.ts`, `node --import tsx scripts/eval-reading.ts 0 4 baseline`으로 실행할 수 있습니다.

공개 AI API는 기본 비활성입니다. Vercel에 새 서버 전용 `OPENAI_API_KEY`와 `READING_API_ENABLED=true`를 설정하고 재배포해야 합니다. 테스트 키는 Git/문서/배포에 저장하지 않았습니다. 인스턴스별 호출 제한은 글로벌 비용 한도가 아니므로 공개 활성화 전 Vercel Firewall 등의 분산 호출 제한을 추가해야 합니다. 글자 수는 기본 호칭(사용자/최애) 기준이며 닉네임 치환 후에는 길이가 달라질 수 있습니다.

API 키를 터미널 명령에 직접 붙여넣거나 Git에 커밋하지 마세요. `.env.local`은 무시되며 `.env.example`은 변수명만 포함합니다. `store:false`도 공급자의 보안용 보관을 전부 없애지는 않으므로 OpenAI의 데이터 정책을 확인하세요.

## 기존 Next.js 개발 안내

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
