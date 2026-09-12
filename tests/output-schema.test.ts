import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { zodTextFormat } from "openai/helpers/zod";
import { pairSchema, readingInput } from "../src/lib/compatibility";
import { generatedReportSchema, generatedSectionSchema, generatedTitleSchema } from "../src/lib/reading-output-schema";
import { reportSchema, validateSection } from "../src/lib/reading-schema";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/accepted-report.json", import.meta.url), "utf8"));
const report = reportSchema.parse(fixture.report);
const input = readingInput(pairSchema.parse(fixture.pair), "2026-09-12", fixture.nameLengths);
const title = "낯선 표현이 호기심을 깨우는 첫 감상, 입덕의 문을 여는 계기니";
const invalidTitles = [
  { name: "34-character title", value: title.slice(1), error: "1:title_length=34" },
  { name: "46-character title", value: "가".repeat(11) + title, error: "1:title_length=46" },
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

test("generation accepts both inclusive title length boundaries", () => {
  assert.equal(title.length, 35);
  assert.equal(generatedTitleSchema.safeParse(title).success, true);
  assert.equal(generatedTitleSchema.safeParse("가".repeat(10) + title).success, true);
});

for (const { name, value, error } of invalidTitles) {
  test(`${name} fails code validation while repair ingestion stays permissive`, () => {
    const section = { ...report.sections[0], title: value };
    const draft = { ...report, sections: [section, ...report.sections.slice(1)] };
    const withinLengthBounds = value.length >= 35 && value.length <= 45;
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

test("zodTextFormat sends title length and style instructions without a pattern for reports and repairs", () => {
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
    assert.equal(titleSchema.minLength, 35);
    assert.equal(titleSchema.maxLength, 45);
    assert.equal(Object.hasOwn(titleSchema, "pattern"), false);
    assert.equal(typeof titleSchema.description, "string");
    assert.ok(titleSchema.description!.includes("쉼표"));
    assert.ok(titleSchema.description!.includes("앞말에 붙여"));
    const paragraphSchema = schema.properties!.paragraphs.items!;
    assert.equal(paragraphSchema.type, "string");
    assert.equal(paragraphSchema.minLength, undefined);
    assert.equal(paragraphSchema.maxLength, undefined);
    assert.equal(paragraphSchema.pattern, undefined);
  }
});
