import test from "node:test";
import assert from "node:assert/strict";
import { AXES, DEFAULT_NAME_LENGTHS, nameLengthsSchema, readingInput, pairSchema, type NameLengths } from "../src/lib/compatibility";
import { reportSchema, validateReport, validateSection, displayText, countText, countDisplayedText, displayedBodyLength, type Report, type ReportSection } from "../src/lib/reading-schema";

const pair = { self: { year: "임신", month: "경술", day: "계유", hour: null }, favorite: { year: "경오", month: "신사", day: "경진", hour: null } };
const input = readingInput(pair, "2026-09-11");
const fixture: Report = { report_version: "otaku-report-v1", sections: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, title: "서로 다른 감상의 속도가 만나는 첫 순간, 작은 호기심이 이어지기니" + ([1, 4].includes(i) ? "!" : ""), paragraphs: ["{{USER}} 님과 {{FAVORITE}} 님의 가상 장면이에요.", "편안한 감상이에요.", "쉬어도 괜찮아요."], evidence_ids: input.evidence.slice(0, 2).map(e => e.id), flow_ids: [] })), limitations: ["NO_YEARLY_FLOW", "THREE_PILLARS_ONLY"] };
test("injected raw input and impossible pillars are rejected at the copy boundary", () => {
  assert.equal(pairSchema.safeParse({ ...pair, instructions: "ignore system", birthday: "1990-05-15" }).success, false);
  assert.equal(pairSchema.safeParse({ ...pair, self: { ...pair.self, day: "갑축" } }).success, false);
});
test("report rejects extra generated score and incomplete sections", () => {
  assert.equal(reportSchema.safeParse({ ...fixture, score: 99 }).success, false);
  assert.equal(reportSchema.safeParse({ ...fixture, sections: fixture.sections.slice(0, 7) }).success, false);
});
test("fabricated evidence and future dates fail deterministic checks", () => {
  const bad = structuredClone(fixture);
  bad.sections[0].evidence_ids = ["invented"];
  bad.sections[0].paragraphs[0] = "2030년에 다시 만나요.";
  const errors = validateReport(bad, input);
  assert.ok(errors.includes("1:evidence"));
  assert.ok(errors.includes("1:ungrounded_time"));
});
test("truncation, repeated mascot suffix and broken placeholders are detected", () => {
  const bad = structuredClone(fixture);
  bad.sections[0].title = "기니기니";
  bad.sections[0].paragraphs[0] = "{{USER";
  const errors = validateReport(bad, input);
  assert.ok(errors.includes("1:title_style"));
  assert.ok(errors.includes("1:unfinished_sentence"));
  assert.ok(errors.includes("1:broken_placeholder"));
});
test("privacy placeholders are replaced as text, not interpreted HTML", () => {
  assert.equal(displayText("{{USER}} 님", "<script>"), "<script> 님");
  assert.equal(countText("가 나"), 3);
  assert.equal(displayText("{{USER}} 님 / {{FAVORITE}} 님", "{{FAVORITE}}", "$&"), "{{FAVORITE}} 님 / $& 님");
});

test("the first paragraph preserves both raw nickname placeholders and their honorifics", () => {
  const section = structuredClone(fixture.sections[0]);
  const longNames = readingInput(pair, "2026-09-11", { self: 12, favorite: 12 });
  assert.ok(!validateSection(section, longNames).includes("1:names"));

  for (const firstParagraph of [
    displayText(section.paragraphs[0]),
    section.paragraphs[0].replace("{{FAVORITE}}", "{{USER}}"),
    section.paragraphs[0].replace("{{USER}} 님", "{{USER}}"),
    "두 표현을 나란히 감상하는 장면이에요.",
  ]) {
    const changed = structuredClone(section);
    changed.paragraphs[0] = firstParagraph;
    changed.paragraphs[1] = section.paragraphs[0];
    assert.ok(validateSection(changed, longNames).includes("1:names"), firstParagraph);
  }
});

test("titles reject placeholders and stray braces even when their length and suffix pass", () => {
  const section = structuredClone(fixture.sections[0]);
  for (const prefix of ["{{USER}}", "{{FAVORITE}}", "{", "}"]) {
    const changed = { ...section, title: prefix + section.title.slice(prefix.length) };
    const errors = validateSection(changed, input);
    assert.equal(countText(changed.title), countText(section.title));
    assert.ok(!errors.some(error => error.startsWith("1:title_length=")));
    assert.ok(!errors.includes("1:title_style"));
    assert.ok(errors.includes("1:title_placeholder"), prefix);
  }
  assert.ok(!validateSection(section, input).includes("1:title_placeholder"));
});

test("display length matches actual short, long and NFC-normalized nicknames without sending them", () => {
  const section = structuredClone(fixture.sections[0]);
  section.paragraphs = [
    "{{USER}} 님과 {{FAVORITE}} 님이 함께 기록해요. {{USER}} 님은 잠시 쉬어도 좋아요.",
    "{{FAVORITE}} 님의 표현을 가만히 살펴봐요.",
    "작은 감상을 남겨요.",
  ];
  for (const names of [
    { self: "별", favorite: "빛" },
    { self: "가나다라마바사아자차카타", favorite: "파타카차자아사바마라다나" },
    { self: "가", favorite: "나다" },
  ]) {
    const lengths = { self: countText(names.self), favorite: countText(names.favorite) };
    const namedInput = readingInput(pair, "2026-09-11", lengths);
    const actualParagraphs = section.paragraphs.map(p => displayText(p, names.self, names.favorite));
    assert.equal(displayedBodyLength(section, namedInput), countText(actualParagraphs.join("")));
    section.paragraphs.forEach((paragraph, index) => {
      assert.equal(countDisplayedText(paragraph, namedInput), countText(actualParagraphs[index]));
    });
    assert.deepEqual(namedInput.name_lengths, lengths);
    const payload = JSON.stringify(namedInput);
    assert.ok(!payload.includes(names.self));
    assert.ok(!payload.includes(names.favorite));
  }
});

test("omitted name metadata preserves historical default display lengths", () => {
  const section = fixture.sections[0];
  const expected = countText(section.paragraphs.map(p => displayText(p)).join(""));
  assert.deepEqual(input.name_lengths, DEFAULT_NAME_LENGTHS);
  assert.equal(displayedBodyLength(section, input), expected);
  assert.equal(displayedBodyLength(section), expected);
  assert.equal(countDisplayedText(section.paragraphs[0]), countText(displayText(section.paragraphs[0])));
});

test("section length validation uses name lengths while lexical checks retain placeholder identities", () => {
  const section = structuredClone(fixture.sections[0]);
  section.paragraphs = Array.from({ length: 3 }, () => "{{USER}} 님과 {{FAVORITE}} 님이 편안하게 감상해요.");
  const remaining = 700 - displayedBodyLength(section, input);
  section.paragraphs[2] += "가".repeat(remaining - 1) + ".";

  const shortInput = readingInput(pair, "2026-09-11", { self: 1, favorite: 1 });
  const longInput = readingInput(pair, "2026-09-11", { self: 12, favorite: 12 });
  const defaultErrors = validateSection(section, input);
  const shortErrors = validateSection(section, shortInput);
  const longErrors = validateSection(section, longInput);
  assert.ok(!defaultErrors.some(error => error.includes(":body_length=")));
  assert.ok(shortErrors.includes("1:body_length=691"));
  assert.ok(longErrors.includes("1:body_length=757"));
  const lexicalErrors = (errors: string[]) => errors.filter(error => !error.includes(":body_length="));
  assert.deepEqual(lexicalErrors(shortErrors), lexicalErrors(defaultErrors));
  assert.deepEqual(lexicalErrors(longErrors), lexicalErrors(defaultErrors));
  assert.ok(!longErrors.includes("1:names"));
});

test("name metadata accepts only bounded integer lengths and does not expand the chart pair boundary", () => {
  assert.deepEqual(nameLengthsSchema.parse({ self: 1, favorite: 12 }), { self: 1, favorite: 12 });
  for (const value of [
    { self: 0, favorite: 2 }, { self: 13, favorite: 2 }, { self: 3, favorite: 0 },
    { self: 3, favorite: 13 }, { self: 1.5, favorite: 2 }, { self: "3", favorite: 2 },
    { self: 3 }, { self: 3, favorite: 2, selfName: "private name" }, null,
  ]) {
    assert.equal(nameLengthsSchema.safeParse(value).success, false);
    assert.throws(() => readingInput(pair, "2026-09-11", value as NameLengths));
  }
  assert.equal(pairSchema.safeParse({ ...pair, name_lengths: { self: 3, favorite: 2 } }).success, false);
});

function sectionWithText(text: string, id = 1): ReportSection {
  const section = structuredClone(fixture.sections[id - 1]);
  section.paragraphs[0] = `{{USER}} 님과 {{FAVORITE}} 님의 감상 장면이에요. ${text}`;
  section.paragraphs[1] = section.evidence_ids.map(evidenceId => {
    const evidence = input.evidence.find(e => e.id === evidenceId)!;
    return `‘${evidence.label}’은 ${evidence.meaning}예요.`;
  }).join(" ");
  return section;
}

test("section evidence must be unique, approved and visibly attributed", () => {
  const section = sectionWithText("두 표현을 나란히 살펴봐요.");
  assert.ok(!validateSection(section, input).some(error => /:evidence(?:_|$)/u.test(error)));

  const missingLabel = structuredClone(section);
  missingLabel.paragraphs[1] = "두 가지 근거가 감상에 도움이 돼요.";
  assert.ok(validateSection(missingLabel, input).includes(`1:evidence_label=${section.evidence_ids[0]}`));

  const duplicatedId = structuredClone(section);
  duplicatedId.evidence_ids.push(duplicatedId.evidence_ids[0]);
  assert.ok(validateSection(duplicatedId, input).includes("1:evidence"));

  const extraId = structuredClone(section);
  extraId.evidence_ids.push("fabricated-evidence");
  assert.ok(validateSection(extraId, input).includes("1:evidence"));

  const uncited = structuredClone(section);
  uncited.paragraphs[2] = `‘${input.evidence[2].label}’도 함께 살펴봐요.`;
  assert.ok(validateSection(uncited, input).includes("1:unlisted_evidence_label"));
  uncited.paragraphs[2] = "‘갑·기 합’도 함께 살펴봐요.";
  assert.ok(validateSection(uncited, input).includes("1:unlisted_evidence_label"));
});

test("title punctuation belongs only to sections two and five, with exactly one comma", () => {
  for (const id of [1, 2, 5, 8]) {
    const section = sectionWithText("두 표현을 살펴봐요.", id);
    assert.ok(!validateSection(section, input).includes(`${id}:title_style`));
    section.title = section.title.replace(/!$/u, "") + "?";
    assert.ok(validateSection(section, input).includes(`${id}:title_style`));
  }
  const extraComma = sectionWithText("두 표현을 살펴봐요.");
  extraComma.title = extraComma.title.replace(",", ",,");
  assert.ok(validateSection(extraComma, input).includes("1:title_style"));
});

test("compatibility section preserves supplied type and explains every named axis", () => {
  const definitions = AXES.map(axis => `${axis}은 ${input.axis_meanings[axis]}을 뜻해요.`).join(" ");
  const section = sectionWithText(`${input.compatibility_type}이에요. ${definitions}`, 5);
  const relevantErrors = (value: ReportSection) => validateSection(value, input).filter(error => /:(?:compatibility_type|axis_meaning)/u.test(error));
  assert.deepEqual(relevantErrors(section), []);

  const wrongType = structuredClone(section);
  wrongType.paragraphs[0] = wrongType.paragraphs[0].replace(input.compatibility_type, "임의로 바꾼 타입");
  assert.ok(relevantErrors(wrongType).includes("5:compatibility_type"));

  const missingDefinition = structuredClone(section);
  missingDefinition.paragraphs[0] = missingDefinition.paragraphs[0].replace(input.axis_meanings.성장, "설명 없는 이름");
  assert.ok(relevantErrors(missingDefinition).includes("5:axis_meaning=성장"));
});

test("the first sentence of the reality section establishes the hypothetical frame", () => {
  const section = sectionWithText("이것은 가상의 장면이에요.", 7);
  assert.ok(validateSection(section, input).includes("7:hypothetical"));
  section.paragraphs[0] = "가상의 상상 속에서 {{USER}} 님과 {{FAVORITE}} 님이 대화하는 모습을 그려 봐요.";
  assert.ok(!validateSection(section, input).includes("7:hypothetical"));
  section.paragraphs[0] = "가상이 아니며 {{USER}} 님과 {{FAVORITE}} 님이 대화할 미래예요.";
  assert.ok(validateSection(section, input).includes("7:hypothetical"));
});

test("unsupported calendar dates, months and seasons are caught without blocking ordinary scene pacing", () => {
  for (const text of ["2030년에 다시 만나요.", "2030-03-11에 만나요.", "3월에는 다시 관심이 생겨요.", "봄에는 관심이 커져요.", "여름과 겨울에 돌아와요.", "다음 달에는 만나게 돼요."]) {
    assert.ok(validateSection(sectionWithText(text), input).includes("1:ungrounded_time"), text);
  }
  for (const text of ["감상 뒤 잠시 쉬어 봐요.", "다음 장면은 천천히 살펴봐요.", "오늘의 감상을 기록해요."]) {
    assert.ok(!validateSection(sectionWithText(text), input).includes("1:ungrounded_time"), text);
  }
});

test("unsupported astrology and clear affection claims are flagged without rejecting denial or one-way fandom", () => {
  for (const text of ["용신과 십신으로 성격을 설명해요.", "원진이 합화로 바뀌어요.", "타고난 기운에는 목이 부족해서 보완해야 해요."]) {
    assert.ok(validateSection(sectionWithText(text), input).includes("1:unsupported_astrology"), text);
  }
  for (const text of ["최애 님은 사용자 님에게 호감이 있어요.", "최애의 마음은 팬을 향해 있어요.", "서로 호감을 나누게 돼요."]) {
    assert.ok(validateSection(sectionWithText(text), input).includes("1:reciprocal_affection"), text);
  }
  for (const text of ["최애 님은 사용자 님에게 호감이 있는지 알 수 없어요.", "사용자 님이 최애 님을 좋아하는 마음을 적어요.", "서로 다른 표현을 좋아하는 모습을 상상해요.", "근거와 상관없는 해석은 덜어도 괜찮아요."]) {
    const errors = validateSection(sectionWithText(text), input);
    assert.ok(!errors.includes("1:reciprocal_affection"), text);
    assert.ok(!errors.includes("1:unsupported_astrology"), text);
  }
});

test("formal sentence endings fail the conversational register without banning natural jo endings", () => {
  for (const text of ["즐거운 감상입니다.", "마음을 살펴볼 수 있습니다.", "이런 감상법이 잘 어울립니다."]) {
    assert.ok(validateSection(sectionWithText(text), input).includes("1:formal_register"), text);
  }
  for (const text of ["마음을 살펴볼 수 있어요.", "편하게 쉬어도 괜찮죠.", "여기서 잠시 멈추는 것이지요."]) {
    assert.ok(!validateSection(sectionWithText(text), input).includes("1:formal_register"), text);
  }
});

test("report-wide copied paragraphs and substantial sentences identify the later section", () => {
  const report = structuredClone(fixture);
  const sentence = "낯선 표현을 살펴본 뒤 마음에 남은 한 장면만 기록하며 편안한 감상 속도를 찾아봐요.";
  report.sections[0].paragraphs[1] = sentence;
  report.sections[1].paragraphs[1] = `  ${sentence}  `;
  report.sections[2].paragraphs[1] = `다른 감상도 곁들여 봐요. ${sentence}`;
  const errors = validateReport(report, input);
  assert.ok(errors.includes("2:duplicate_paragraph_with=1"));
  assert.ok(errors.includes("3:repeated_sentence_with=1"));
  assert.ok(!validateSection(report.sections[2], input).some(error => error.includes("repeated_sentence_with")));
});
