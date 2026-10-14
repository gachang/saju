import test from "node:test";
import assert from "node:assert/strict";
import { PROMPT_VERSION, SECTION_BLUEPRINTS, SECTION_TOPICS, SYSTEM_PROMPT } from "../src/lib/reading-prompt";
import { REPORT_CHAPTER_TITLES } from "../src/lib/reading-schema";

test("the report prompt anchors every chapter in a distinct fan experience", () => {
  assert.equal(PROMPT_VERSION, "otaku-report-v2.10-title-content-guard");
  assert.equal(SECTION_TOPICS.length, 8);
  assert.equal(SECTION_BLUEPRINTS.length, 8);
  assert.equal(new Set(SECTION_BLUEPRINTS).size, 8);
  SECTION_TOPICS.forEach((topic, index) => assert.ok(topic.startsWith(`${REPORT_CHAPTER_TITLES[index]}:`)));
  assert.match(SYSTEM_PROMPT, /예시이며 선택지를 제한하지 않는다/u);
  assert.match(SECTION_TOPICS[1], /일상적 필요나 취향/u);
  assert.match(SYSTEM_PROMPT, /팬이 공개된 무대와 콘텐츠를 통해 최애를 좋아하는 경험/u);
  assert.match(SYSTEM_PROMPT, /장마다 공개 콘텐츠나 팬 활동에서 볼 수 있는 구체적인 장면/u);
  assert.match(SYSTEM_PROMPT, /장마다 정확히 3문단, 공백 포함 총 700~750자/u);
  assert.match(SYSTEM_PROMPT, /최애의 감정이나 사적 성격은 알 수 없으므로/u);
  assert.match(SYSTEM_PROMPT, /도입 방식 \/ 대표 이미지 \/ 대표 행동 \/ 마지막 결론/u);
  assert.match(SYSTEM_PROMPT, /같은 결론이나 행동을 두 장에서 재사용하지 않는다/u);
  assert.match(SYSTEM_PROMPT, /모든 장에 똑같은 ‘설명→주의→조언’ 틀을 복제하지 않는다/u);
  assert.match(SYSTEM_PROMPT, /‘멈췄 다른’, ‘곱씹었 조금씩’, ‘조화시켰 서로’는 금지/u);
  assert.match(SYSTEM_PROMPT, /자연스러운 연결형으로 다시 쓴다/u);
  assert.match(SYSTEM_PROMPT, /35~45자를 목표로/u);
  assert.match(SYSTEM_PROMPT, /짧고 완성된 제목을 우선/u);
  assert.match(SYSTEM_PROMPT, /과거형이나 특정 동사를 강제하지 않는다/u);
  assert.match(SYSTEM_PROMPT, /현재형·명사형도 문법과 의미가 자연스러우면 허용/u);
  assert.match(SYSTEM_PROMPT, /본문에 없는 내용을 덧붙이지 않는다/u);
  assert.match(SYSTEM_PROMPT, /API·스키마·요청 형식·생성 실패 등 기술적 오류나 작업 상태를 제목에 쓰지 않는다/u);
});
