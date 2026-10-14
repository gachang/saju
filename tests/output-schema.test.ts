import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { zodTextFormat } from "openai/helpers/zod";
import { pairSchema, readingInput } from "../src/lib/compatibility";
import { generatedReportSchema, generatedSectionSchema, generatedTitleSchema } from "../src/lib/reading-output-schema";
import { normalizeTitleStyle, reportSchema, validateSection } from "../src/lib/reading-schema";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/accepted-report.json", import.meta.url), "utf8"));
const report = reportSchema.parse(fixture.report);
const input = readingInput(pairSchema.parse(fixture.pair), "2026-09-12", fixture.nameLengths);
const title = "낯선 표현이 호기심을 깨우는 첫 감상, 입덕의 문을 여는 계기니";
const invalidTitles = [
  { name: "extra comma", value: title.replace(", ", ", , "), error: "1:title_style" },
  { name: "space before the mascot suffix", value: title.replace(/기니$/, " 기니"), error: "1:title_style" },
  { name: "braces", value: title.replace("첫", "{첫}"), error: "1:title_placeholder" },
  { name: "embedded newline", value: title.replace(" ", "\n"), error: "1:title_style" },
  { name: "trailing newline", value: title + "\n", error: "1:title_style" },
  { name: "carriage return", value: title.replace(" ", "\r"), error: "1:title_style" },
];

test("the accepted eight-section fixture passes generation schemas unchanged", () => {
  assert.deepEqual(generatedReportSchema.parse(report), report);
  for (const section of report.sections) {
    assert.deepEqual(generatedSectionSchema.parse(section), section);
    assert.equal(generatedTitleSchema.parse(section.title), section.title);
    assert.deepEqual(validateSection(section, input), []);
  }
});

test("generation bounds title size without forcing the advisory length target", () => {
  assert.equal(title.length, 35);
  assert.equal(generatedTitleSchema.safeParse(title).success, true);
  assert.equal(generatedTitleSchema.safeParse("가".repeat(10) + title).success, true);
  assert.equal(generatedTitleSchema.safeParse("빛").success, true);
  assert.equal(generatedTitleSchema.safeParse("가".repeat(100)).success, true);
  assert.equal(generatedTitleSchema.safeParse("").success, false);
  assert.equal(generatedTitleSchema.safeParse("가".repeat(101)).success, false);
});

test("full reports and repairs preserve complete present and noun titles outside the target", () => {
  const naturalTitles = [
    "화면의 한 줄기 빛, 눈길이 머무는 순간이기니",
    "익숙한 하루 사이로 스며든 무대의 작은 손짓, 마음속에서 오래 다시 떠오르는 장면이기니",
  ];
  assert.ok(naturalTitles[0].length < 35);
  assert.ok(naturalTitles[1].length > 45);
  for (const naturalTitle of naturalTitles) {
    const section = { ...report.sections[0], title: naturalTitle };
    const draft = { ...report, sections: [section, ...report.sections.slice(1)] };
    assert.deepEqual(generatedSectionSchema.parse(section), section);
    assert.deepEqual(generatedReportSchema.parse(draft), draft);
  }
});

test("title normalization removes accidental punctuation and suffix spacing", () => {
  const base = report.sections[7];
  const changed = { ...base, title: base.title.replace(/기니$/u, " 기니!?") };
  const normalized = normalizeTitleStyle(changed);
  assert.equal(normalized.title, base.title);
  assert.ok(!validateSection(normalized, input).includes("8:title_style"));
  const excited = normalizeTitleStyle({ ...report.sections[1], title: report.sections[1].title.replace(/기니!$/u, " 기니 !?") });
  assert.equal(excited.title, report.sections[1].title);
  const duplicateComma = normalizeTitleStyle({ ...base, title: base.title.replace(", ", ", , ") });
  assert.equal(duplicateComma.title, base.title);
  const missingComma = normalizeTitleStyle({ ...base, title: base.title.replace(",", "") });
  assert.equal((missingComma.title.match(/,/gu) ?? []).length, 1);
  assert.ok(!validateSection(missingComma, input).includes("8:title_style"));
  const missingSuffix = normalizeTitleStyle({ ...base, title: base.title.replace(/기니$/u, "결론") });
  assert.match(missingSuffix.title, /기니$/u);
  assert.ok(!validateSection(missingSuffix, input).includes("8:title_style"));
});

for (const { name, value, error } of invalidTitles) {
  test(`${name} fails code validation while repair ingestion stays permissive`, () => {
    const section = { ...report.sections[0], title: value };
    const draft = { ...report, sections: [section, ...report.sections.slice(1)] };
    const withinLengthBounds = value.length >= 1 && value.length <= 100;
    assert.equal(generatedTitleSchema.safeParse(value).success, withinLengthBounds);
    assert.equal(generatedSectionSchema.safeParse(section).success, withinLengthBounds);
    assert.equal(generatedReportSchema.safeParse(draft).success, withinLengthBounds);
    assert.ok(validateSection(section, input).includes(error));
    assert.deepEqual(reportSchema.parse(draft), draft);
  });
}

test("generation schemas remain strict about unexpected report and section fields", () => {
  assert.equal(generatedReportSchema.safeParse({ ...report, score: 100 }).success, false);
  assert.equal(generatedSectionSchema.safeParse({ ...report.sections[0], commentary: "extra" }).success, false);
});

test("body content remains permissive at generation and ingestion, with validation applied in code", () => {
  const section = { ...report.sections[0], paragraphs: ["", "", ""] };
  const draft = { ...report, sections: [section, ...report.sections.slice(1)] };
  assert.deepEqual(generatedSectionSchema.parse(section), section);
  assert.deepEqual(generatedReportSchema.parse(draft), draft);
  assert.deepEqual(reportSchema.parse(draft), draft);
  assert.ok(validateSection(section, input).includes("1:body_length=0"));
});

type JsonSchema = {
  type?: string;
  additionalProperties?: boolean;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  description?: string;
};

function assertStrictObject(schema: JsonSchema) {
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual([...(schema.required ?? [])].sort(), Object.keys(schema.properties ?? {}).sort());
}

test("report and repair JSON schemas send consistent semantic title instructions with broad size bounds", () => {
  const fullFormat = zodTextFormat(generatedReportSchema, "test_report");
  const sectionFormat = zodTextFormat(generatedSectionSchema, "test_section");
  const fullSchema = fullFormat.schema as JsonSchema;
  const sectionSchemas = [fullSchema.properties!.sections.items!, sectionFormat.schema as JsonSchema];

  assert.equal(fullFormat.type, "json_schema");
  assert.equal(fullFormat.strict, true);
  assert.equal(sectionFormat.type, "json_schema");
  assert.equal(sectionFormat.strict, true);
  assertStrictObject(fullSchema);
  for (const schema of sectionSchemas) {
    assertStrictObject(schema);
    const titleSchema = schema.properties!.title;
    assert.equal(titleSchema.type, "string");
    assert.equal(titleSchema.minLength, 1);
    assert.equal(titleSchema.maxLength, 100);
    assert.equal(Object.hasOwn(titleSchema, "pattern"), false);
    assert.equal(typeof titleSchema.description, "string");
    assert.ok(titleSchema.description!.includes("쉼표"));
    assert.match(titleSchema.description!, /35~45자를 목표로/u);
    assert.match(titleSchema.description!, /짧고 완성된 제목을 우선/u);
    assert.match(titleSchema.description!, /과거형이나 특정 동사를 강제하지 않는다/u);
    assert.match(titleSchema.description!, /현재형·명사형도 문법과 의미가 자연스러우면 허용/u);
    assert.match(titleSchema.description!, /본문에 없는 내용을 덧붙이지 않는다/u);
    assert.match(titleSchema.description!, /API·스키마·요청 형식·생성 실패 등 기술적 오류나 작업 상태를 제목에 쓰지 않는다/u);
    assert.doesNotMatch(titleSchema.description!, /완료된 행동|명사형은 금지/u);
    const paragraphSchema = schema.properties!.paragraphs.items!;
    assert.equal(paragraphSchema.type, "string");
    assert.equal(paragraphSchema.minLength, undefined);
    assert.equal(paragraphSchema.maxLength, undefined);
    assert.equal(paragraphSchema.pattern, undefined);
  }
  assert.equal(sectionSchemas[0].properties!.title.description, sectionSchemas[1].properties!.title.description);
});
