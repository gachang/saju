import test from "node:test";
import assert from "node:assert/strict";
import { finalizeSection } from "../src/lib/reading-complete.server";
import { REPORT_CHAPTER_TITLES, type ReportSection } from "../src/lib/reading-schema";

const section = (id: number, title: string): ReportSection => ({
  id, title,
  paragraphs: ["{{USER}} 님과 {{FAVORITE}} 님의 공개 콘텐츠를 즐기는 방식은 달라질 수 있어요.", "응원 편지를 접으며 생각을 정리해 봐요.", "좋아하는 마음을 어떤 형태로 남길지는 자유예요."],
  evidence_ids: [], flow_ids: [],
});

test("chapter six keeps its generated opening without adding a fixed question", () => {
  const original = section(6, "다른 관심사를 만나도, 응원하는 마음은 남아 있기니");
  assert.deepEqual(finalizeSection(original).paragraphs, original.paragraphs);
});

test("different fluent present-tense titles stay distinct instead of becoming stock conclusions", () => {
  const a = section(3, "편지에 담은 한마디, 내 방식으로 응원하는 순간이기니");
  const b = section(3, "퇴근길 흥얼거린 한 소절, 오늘의 기분을 바꾸기니");
  assert.equal(finalizeSection(a).title, a.title);
  assert.equal(finalizeSection(b).title, b.title);
});

test("a truncated title uses only its neutral chapter label", () => {
  const original = section(1, "처음 본 영상에서 멈췄 다른 마음, 새로운 장면을 발견했기니");
  assert.equal(finalizeSection(original).title, REPORT_CHAPTER_TITLES[0]);
  assert.deepEqual(finalizeSection(original).paragraphs, original.paragraphs);
});
