import test from "node:test";
import assert from "node:assert/strict";
import { PROMPT_VERSION, SECTION_BLUEPRINTS, SECTION_TOPICS, SYSTEM_PROMPT } from "../src/lib/reading-prompt";
import { REPORT_CHAPTER_TITLES } from "../src/lib/reading-schema";

test("the report prompt anchors every chapter in a distinct fan experience", () => {
  assert.equal(PROMPT_VERSION, "otaku-report-v2.6-chapter-contrast");
  assert.equal(SECTION_TOPICS.length, 8);
  assert.equal(SECTION_BLUEPRINTS.length, 8);
  assert.equal(new Set(SECTION_BLUEPRINTS).size, 8);
  SECTION_TOPICS.forEach((topic, index) => assert.ok(topic.startsWith(`${REPORT_CHAPTER_TITLES[index]}:`)));
  assert.match(SECTION_TOPICS[0], /유튜브.*페스티벌.*팝업스토어/u);
  assert.match(SECTION_TOPICS[1], /일상.*답답함.*무대·콘텐츠/u);
  assert.match(SYSTEM_PROMPT, /팬이 공개된 무대와 콘텐츠를 통해 최애를 좋아하는 경험/u);
  assert.match(SYSTEM_PROMPT, /장마다 공개 콘텐츠나 팬 활동에서 볼 수 있는 구체적인 장면/u);
  assert.match(SYSTEM_PROMPT, /장마다 정확히 3문단, 공백 포함 총 700~750자/u);
  assert.match(SYSTEM_PROMPT, /실제 성격이 아니라 무대·영상에서 팬이 느끼는 표현의 결/u);
  assert.match(SYSTEM_PROMPT, /대표 장면 \/ 대표 행동 \/ 마지막 결론/u);
  assert.match(SYSTEM_PROMPT, /같은 결론이나 행동을 두 장에서 재사용하지 않는다/u);
  assert.match(SYSTEM_PROMPT, /모든 장에 똑같은 ‘설명→주의→조언’ 틀을 복제하지 않는다/u);
});
