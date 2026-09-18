import test from "node:test";
import assert from "node:assert/strict";
import { PROMPT_VERSION, SECTION_TOPICS, SYSTEM_PROMPT } from "../src/lib/reading-prompt";
import { REPORT_CHAPTER_TITLES } from "../src/lib/reading-schema";

test("the report prompt anchors every chapter in a distinct fan experience", () => {
  assert.equal(PROMPT_VERSION, "otaku-report-v2.5-fan-scenes");
  assert.equal(SECTION_TOPICS.length, 8);
  SECTION_TOPICS.forEach((topic, index) => assert.ok(topic.startsWith(`${REPORT_CHAPTER_TITLES[index]}:`)));
  assert.match(SECTION_TOPICS[0], /유튜브.*페스티벌.*팝업스토어/u);
  assert.match(SECTION_TOPICS[1], /일상.*답답함.*무대·콘텐츠/u);
  assert.match(SYSTEM_PROMPT, /팬이 공개된 무대와 콘텐츠를 통해 최애를 좋아하는 경험/u);
  assert.match(SYSTEM_PROMPT, /장마다 공개 콘텐츠나 팬 활동에서 볼 수 있는 구체적인 장면/u);
  assert.match(SYSTEM_PROMPT, /장마다 정확히 3문단, 공백 포함 총 700~750자/u);
  assert.match(SYSTEM_PROMPT, /실제 성격이 아니라 무대·영상에서 팬이 느끼는 표현의 결/u);
});
