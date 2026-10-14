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

const observedErrorTitle = "어두운 화면을 가른 한 줄의 빛, 시선이 오래 머물-요청 형식 오류로 생성 불기니";

const errorTitles = [
  ["the observed live title", observedErrorTitle],
  ["whitespace around the observed notice", "  어두운 화면을 가른 한 줄의 빛, 시선이 오래 머물 - 요청\t형식\n오류로 생성 불기니  "],
  ["a notice before generated wording", "요청 형식 오류로 생성 불가 - 어두운 화면을 가른 한 줄의 빛"],
  ["a notice after generated wording", "어두운 화면을 가른 한 줄의 빛 — 요청 형식 오류로 생성 불가"],
  ["a standalone request format error", "요청 형식 오류"],
  ["an invalid response format", "응답 형식 오류로 보고서 생성 실패"],
  ["an API request failure", "API 요청 실패로 보고서 생성 불가"],
  ["an API response error", "API 응답 오류로 생성할 수 없습니다"],
  ["a JSON parsing failure", "JSON 파싱 실패로 보고서 생성 불가"],
  ["a schema validation failure", "JSON 스키마 검증 실패"],
  ["a schema validation error", "스키마 검증 오류로 생성 불가"],
  ["a report generation failure", "보고서 생성 실패"],
  ["an English JSON parsing failure", "JSON parsing failed"],
  ["an English JSON schema validation failure", "JSON schema validation failed"],
  ["an English invalid request format", "Request format is invalid"],
  ["a request processing failure", "요청 처리 중 오류가 발생했습니다"],
  ["an invalid request format description", "요청 형식이 올바르지 않아 생성할 수 없습니다"],
  ["a standalone generation failure", "생성 불가"],
] as const;

for (const [description, title] of errorTitles) {
  test(`${description} uses the chapter label without changing section content`, () => {
    const original = {
      ...section(1, title),
      evidence_ids: ["evidence-first", "evidence-second"],
      flow_ids: ["flow-first"],
    };
    const snapshot = structuredClone(original);
    assert.deepEqual(finalizeSection(original), { ...original, title: REPORT_CHAPTER_TITLES[0] });
    assert.deepEqual(original, snapshot);
  });
}

for (const title of ["", " \t\n ", "?!,.;:—()[]", "… — !"]) {
  test(`an empty or punctuation-only title ${JSON.stringify(title)} uses the chapter label`, () => {
    const original = section(4, title);
    assert.deepEqual(finalizeSection(original), { ...original, title: REPORT_CHAPTER_TITLES[3] });
  });
}

test("error fallback selects the corresponding label for all eight chapters and is idempotent", () => {
  REPORT_CHAPTER_TITLES.forEach((title, index) => {
    const original = {
      ...section(index + 1, observedErrorTitle),
      evidence_ids: ["evidence-first", "evidence-second"],
      flow_ids: ["flow-first"],
    };
    const finalized = finalizeSection(original);
    assert.deepEqual(finalized, { ...original, title });
    assert.deepEqual(finalizeSection(finalized), finalized);
  });
});

const validTitles = [
  "편지를 쓰는 시간",
  "응원하는 마음이 오래 머무는 곳",
  "나의 일상에 남는 한 장면",
  "알림 오류로 놓친 방송을 다시 즐기는 시간",
  "팬아트 저장 실패 뒤에도 이어지는 응원",
  "편지에 담은 한마디, 내 방식으로 응원하는 순간이기니",
  "퇴근길 흥얼거린 한 소절, 오늘의 기분을 바꾸기니",
] as const;

for (const title of validTitles) {
  test(`a valid title remains distinct: ${title}`, () => {
    const original = section(3, title);
    const finalized = finalizeSection(original);
    assert.deepEqual(finalized, original);
    assert.deepEqual(finalizeSection(finalized), finalized);
  });
}

test("a title fallback keeps the existing paragraph sanitation and evidence references", () => {
  const original = {
    ...section(1, observedErrorTitle),
    paragraphs: [
      "당신은 그 사람의 공개 콘텐츠를 운명적으로 좋아한다고 정해지지 않아요",
      "공개 콘텐츠를 잠시 쉬며 내 취향을 살펴봐요. 따뜻한 여운을 남겨요.",
      "좋아하는 마음을 어떤 형태로 남길지는 자유예요.",
    ],
    evidence_ids: ["evidence-first", "evidence-second"],
    flow_ids: ["flow-first"],
  };
  const finalized = finalizeSection(original);
  assert.deepEqual(finalized, {
    ...original,
    title: REPORT_CHAPTER_TITLES[0],
    paragraphs: [
      "{{USER}} 님은 {{FAVORITE}} 님의 공개 콘텐츠를 자연스럽게 좋아한다고 정해지지 않아요.",
      "공개 콘텐츠를 잠시 쉬며 내 취향을 살펴봐요.",
      "좋아하는 마음을 어떤 형태로 남길지는 자유예요.",
    ],
  });
  assert.deepEqual(finalizeSection(finalized), finalized);
});
