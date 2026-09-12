import test from "node:test";
import assert from "node:assert/strict";
import { AXES, readingInput } from "../src/lib/compatibility";
import { mergeSection, paragraphRepairTarget, repairReport, type PipelineEvent, type RepairRequest } from "../src/lib/reading-pipeline";
import { countText, displayText, validateReport, type Report, type ReportSection } from "../src/lib/reading-schema";

const input = readingInput({
  self: { year: "임신", month: "경술", day: "계유", hour: null },
  favorite: { year: "경오", month: "신사", day: "경진", hour: null },
}, "2026-09-11");

// Synthetic prose exercises pipeline decisions; model quality is covered by live evaluation.
// Every paragraph is one uniquely identified sentence, with a known rendered length.
function paragraph(prefix: string, length: number) {
  const remaining = length - countText(displayText(prefix)) - 1;
  assert.ok(remaining >= 0, "fixture prefix must fit in its paragraph");
  return prefix + "차분한 감상 장면을 기록하는 테스트 문장 ".repeat(length).slice(0, remaining) + ".";
}

function validReport(): Report {
  const evidence = input.evidence.slice(0, 2);
  return {
    report_version: "otaku-report-v1",
    sections: Array.from({ length: 8 }, (_, index) => {
      const id = index + 1;
      const axes = id === 5
        ? `${input.compatibility_type} ${AXES.map(axis => `${axis} ${input.axis_meanings[axis]}`).join(" ")} `
        : "";
      return {
        id,
        title: "서로 다른 감상의 속도가 만나는 첫 순간, 작은 호기심이 이어지기니" + ([2, 5].includes(id) ? "!" : ""),
        paragraphs: [
          paragraph(`상상 속 ${id}번째 장면에서 {{USER}} 님과 {{FAVORITE}} 님의 ${evidence.map(item => item.label).join(" 및 ")} 근거를 비유로 살피며 `, 240),
          paragraph(`${id}번째 장면의 두 번째 문단에서 ${axes}`, 240),
          paragraph(`${id}번째 장면의 세 번째 문단에서 `, 245),
        ],
        evidence_ids: evidence.map(item => item.id),
        flow_ids: [],
      };
    }),
    limitations: ["NO_YEARLY_FLOW", "THREE_PILLARS_ONLY"],
  };
}

function withBodyLength(section: ReportSection, length: number): ReportSection {
  return {
    ...section,
    paragraphs: [section.paragraphs[0], section.paragraphs[1], paragraph(`${section.id}번째 길이 수정 문단에서 `, length - 480)],
  };
}

test("mergeSection rejects a replacement whose id differs from the requested section", () => {
  const report = validReport();
  assert.throws(() => mergeSection(report, 2, report.sections[2]), /REPAIR_SECTION_MISMATCH/);
});

test("mergeSection changes only the requested section and does not mutate the original", () => {
  const report = validReport();
  const original = JSON.stringify(report);
  const replacement = withBodyLength(report.sections[2], 730);
  const merged = mergeSection(report, 3, replacement);

  assert.deepEqual(merged.sections[2], replacement);
  for (const section of report.sections.filter(section => section.id !== 3)) {
    assert.equal(JSON.stringify(merged.sections[section.id - 1]), JSON.stringify(section));
  }
  assert.equal(JSON.stringify(report), original);
  assert.deepEqual(merged.limitations, report.limitations);
});

test("paragraphRepairTarget expands the shortest paragraph using rendered, normalized lengths", () => {
  const section = validReport().sections[0];
  section.paragraphs = [
    paragraph("{{USER}} 님과 {{FAVORITE}} 님 그리고 가 ", 200),
    paragraph("중간 문단 ", 220),
    paragraph("긴 문단 ", 230),
  ];

  assert.notEqual(countText(section.paragraphs.join("")), 650);
  assert.deepEqual(paragraphRepairTarget(section), { index: 0, current_chars: 200, target_chars: 275, total_chars: 650 });
});

test("paragraphRepairTarget shortens the longest paragraph and leaves a target-length body stable", () => {
  const section = validReport().sections[0];
  section.paragraphs = [paragraph("가장 긴 문단 ", 300), paragraph("중간 문단 ", 260), paragraph("짧은 문단 ", 240)];
  assert.deepEqual(paragraphRepairTarget(section), { index: 0, current_chars: 300, target_chars: 225, total_chars: 800 });
  assert.deepEqual(paragraphRepairTarget(validReport().sections[0]), { index: 0, current_chars: 240, target_chars: 240, total_chars: 725 });
});

test("a valid report completes without invoking repair", async () => {
  const draft = validReport();
  assert.deepEqual(validateReport(draft, input), []);
  const result = await repairReport(draft, input, async () => assert.fail("passing sections must not be repaired"));
  assert.deepEqual(result, { report: draft, validation: [], attempts: [] });
});

test("editorial issues dispatch a repair even when deterministic validation passes", async () => {
  const draft = validReport();
  const replacement = withBodyLength(draft.sections[1], 730);
  const editorialIssues = { 2: ["2:editorial=remove an unsupported interpretation"] };
  const requests: RepairRequest[] = [];
  assert.deepEqual(validateReport(draft, input), []);

  const result = await repairReport(draft, input, async request => {
    requests.push(request);
    return replacement;
  }, { editorialIssues });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].section.id, 2);
  assert.deepEqual(requests[0].errors, editorialIssues[2]);
  assert.deepEqual(result.report.sections[1], replacement);
  assert.deepEqual(result.validation, []);
  assert.equal(result.attempts[0].accepted, true);
  assert.deepEqual(editorialIssues, { 2: ["2:editorial=remove an unsupported interpretation"] });
  for (const section of draft.sections.filter(section => section.id !== 2)) {
    assert.equal(JSON.stringify(result.report.sections[section.id - 1]), JSON.stringify(section));
  }
});

test("rejected editorial repairs retain their unresolved issue", async () => {
  const draft = validReport();
  const issue = "2:editorial=revise the chapter conclusion";
  const result = await repairReport(draft, input, async request => ({ ...request.section, title: "오류" }), {
    editorialIssues: { 2: [issue] }, stages: ["terra"],
  });

  assert.equal(result.attempts[0].accepted, false);
  assert.deepEqual(result.report, draft);
  assert.deepEqual(result.validation, [issue]);
});

test("repairReport repairs only failing sections and preserves every passing section exactly", async () => {
  const valid = validReport();
  const draft = structuredClone(valid);
  draft.sections[1] = withBodyLength(draft.sections[1], 650);
  draft.sections[5] = withBodyLength(draft.sections[5], 805);
  const original = JSON.stringify(draft);
  const requests: RepairRequest[] = [];
  const progress: PipelineEvent[] = [];

  const result = await repairReport(draft, input, async request => {
    requests.push(request);
    return valid.sections[request.section.id - 1];
  }, { onProgress: event => progress.push(event) });

  assert.deepEqual(requests.map(request => request.section.id).sort(), [2, 6]);
  assert.ok(requests.every(request => request.stage === "luna" && request.attempt === 1));
  assert.ok(requests.every(request => request.errors.every(error => error.startsWith(`${request.section.id}:`))));
  assert.deepEqual(result.validation, []);
  assert.deepEqual(result.report, valid);
  assert.ok(result.attempts.every(attempt => attempt.accepted));
  for (const section of draft.sections.filter(section => ![2, 6].includes(section.id))) {
    assert.equal(JSON.stringify(result.report.sections[section.id - 1]), JSON.stringify(section));
  }
  assert.equal(JSON.stringify(draft), original);
  assert.deepEqual(progress, [{ stage: "repair", completed: 8, total: 8 }]);
});

test("repairReport accepts an improved candidate, rejects regression, and retries the accepted version", async () => {
  const valid = validReport();
  const draft = structuredClone(valid);
  draft.sections[0] = withBodyLength(draft.sections[0], 650);
  const requests: RepairRequest[] = [];
  const candidateLengths = [675, 600, 725];

  const result = await repairReport(draft, input, async request => {
    requests.push(request);
    return withBodyLength(request.section, candidateLengths[request.attempt - 1]);
  });

  assert.deepEqual(result.attempts.map(attempt => attempt.accepted), [true, false, true]);
  assert.deepEqual(requests.map(request => request.errors), [["1:body_length=650"], ["1:body_length=675"], ["1:body_length=675"]]);
  assert.deepEqual(requests.map(request => [request.stage, request.attempt]), [["luna", 1], ["terra", 2], ["terra", 3]]);
  assert.deepEqual(result.validation, []);
  assert.equal(countText(displayText(result.report.sections[0].paragraphs.join(""))), 725);
});

test("a candidate cannot make a later passing section fail through duplicated prose", async () => {
  const valid = validReport();
  const draft = structuredClone(valid);
  draft.sections[0] = withBodyLength(draft.sections[0], 650);
  const candidate = structuredClone(valid.sections[0]);
  candidate.paragraphs[1] = valid.sections[1].paragraphs[1];

  const result = await repairReport(draft, input, async () => candidate, { stages: ["luna"] });

  assert.equal(result.attempts[0].accepted, false);
  assert.deepEqual(result.report, draft);
  assert.deepEqual(result.validation, ["1:body_length=650"]);
});

test("concurrent candidates are revalidated together so they cannot introduce shared prose", async () => {
  const valid = validReport();
  const draft = structuredClone(valid);
  draft.sections[0] = withBodyLength(draft.sections[0], 650);
  draft.sections[1] = withBodyLength(draft.sections[1], 650);
  const candidates = structuredClone(valid.sections.slice(0, 2));
  const shared = paragraph("두 수정안이 우연히 함께 선택한 감상 문단에서 ", 240);
  candidates.forEach(candidate => { candidate.paragraphs[1] = shared; });
  const requested: number[] = [];

  const result = await repairReport(draft, input, async request => {
    requested.push(request.section.id);
    await Promise.resolve();
    return candidates[request.section.id - 1];
  }, { stages: ["luna"] });

  assert.deepEqual(requested, [1, 2]);
  assert.deepEqual(result.attempts.map(attempt => attempt.accepted), [true, false]);
  assert.deepEqual(result.report.sections[0], candidates[0]);
  assert.deepEqual(result.report.sections[1], draft.sections[1]);
  assert.deepEqual(result.validation, ["2:body_length=650"]);
});

test("repairReport stops after three default rounds and limits concurrency to two repairs", async () => {
  const draft = validReport();
  draft.sections = draft.sections.map(section => ({ ...section, title: "검증 오류" }));
  const calls: RepairRequest[] = [];
  let active = 0;
  let peak = 0;
  const result = await repairReport(draft, input, async request => {
    calls.push(request);
    active += 1;
    peak = Math.max(peak, active);
    await new Promise<void>(resolve => setImmediate(resolve));
    active -= 1;
    return request.section;
  });

  assert.equal(calls.length, 24);
  assert.equal(result.attempts.length, 24);
  assert.equal(peak, 2);
  for (const section of draft.sections) {
    assert.deepEqual(calls.filter(call => call.section.id === section.id).map(call => [call.stage, call.attempt]), [["luna", 1], ["terra", 2], ["terra", 3]]);
  }
  assert.ok(result.validation.length > 0);
  assert.deepEqual(result.report, draft);
});

test("checkpoints retain completed repairs when a later sibling fails and can resume", async () => {
  const valid = validReport();
  const draft = structuredClone(valid);
  for (let index = 0; index < 4; index++) draft.sections[index] = withBodyLength(draft.sections[index], 650);
  const original = JSON.stringify(draft);
  const checkpoints: Report[] = [];
  const failure = new Error("mock request failed after the first completed batch");

  await assert.rejects(repairReport(draft, input, async request => {
    if (request.section.id === 4) throw failure;
    return valid.sections[request.section.id - 1];
  }, { onCheckpoint: report => checkpoints.push(report) }), error => error === failure);

  assert.equal(checkpoints.length, 2);
  assert.deepEqual(checkpoints[0].sections.slice(0, 2), valid.sections.slice(0, 2));
  assert.deepEqual(checkpoints[0].sections.slice(2), draft.sections.slice(2));
  assert.deepEqual(validateReport(checkpoints[0], input), ["3:body_length=650", "4:body_length=650"]);
  const latest = checkpoints[1];
  assert.deepEqual(latest.sections.slice(0, 3), valid.sections.slice(0, 3));
  assert.deepEqual(latest.sections.slice(3), draft.sections.slice(3));
  assert.deepEqual(validateReport(latest, input), ["4:body_length=650"]);
  assert.equal(JSON.stringify(draft), original);
  const checkpointSnapshot = JSON.stringify(latest);
  const resumedIds: number[] = [];

  const resumed = await repairReport(latest, input, async request => {
    resumedIds.push(request.section.id);
    return valid.sections[request.section.id - 1];
  });

  assert.deepEqual(resumedIds, [4]);
  assert.deepEqual(resumed.report, valid);
  assert.deepEqual(resumed.validation, []);
  assert.equal(JSON.stringify(latest), checkpointSnapshot);
});

test("an incomplete Luna repair preserves its section while siblings finish and Terra can recover", async () => {
  const valid = validReport();
  const draft = structuredClone(valid);
  for (let index = 0; index < 3; index++) draft.sections[index] = withBodyLength(draft.sections[index], 650);
  const original = JSON.stringify(draft);
  const checkpoints: Report[] = [];
  const requests: RepairRequest[] = [];

  const result = await repairReport(draft, input, async request => {
    requests.push(request);
    if (request.section.id === 1 && request.stage === "luna") throw new Error("READING_INCOMPLETE");
    return valid.sections[request.section.id - 1];
  }, { onCheckpoint: report => checkpoints.push(report) });

  assert.deepEqual(requests.map(request => [request.section.id, request.stage, request.attempt]), [
    [1, "luna", 1], [2, "luna", 1], [3, "luna", 1], [1, "terra", 2],
  ]);
  assert.deepEqual(result.attempts[0], {
    stage: "luna", id: 1, before: ["1:body_length=650"],
    after: ["1:body_length=650", "1:incomplete_response"], accepted: false,
  });
  assert.deepEqual(result.attempts.slice(1).map(attempt => attempt.accepted), [true, true, true]);
  assert.equal(checkpoints.length, 3);
  assert.deepEqual(checkpoints[0].sections[0], draft.sections[0]);
  assert.deepEqual(checkpoints[0].sections[1], valid.sections[1]);
  assert.deepEqual(checkpoints[1].sections[0], draft.sections[0]);
  assert.deepEqual(checkpoints[1].sections.slice(1), valid.sections.slice(1));
  assert.deepEqual(result.report, valid);
  assert.deepEqual(result.validation, []);
  assert.equal(JSON.stringify(draft), original);
});

test("repeated incomplete responses stop at the configured stage limit with the original section intact", async () => {
  const draft = validReport();
  draft.sections[0] = withBodyLength(draft.sections[0], 650);
  const editorialIssue = "1:editorial=improve the interpretation";
  let calls = 0;
  const result = await repairReport(draft, input, async () => {
    calls += 1;
    throw new Error("READING_INCOMPLETE");
  }, { stages: ["luna", "terra"], editorialIssues: { 1: [editorialIssue] } });

  assert.equal(calls, 2);
  assert.deepEqual(result.attempts.map(attempt => attempt.stage), ["luna", "terra"]);
  assert.ok(result.attempts.every(attempt => !attempt.accepted && attempt.after.includes("1:incomplete_response")));
  assert.ok(result.attempts.every(attempt => attempt.before.includes(editorialIssue)));
  assert.deepEqual(result.report, draft);
  assert.deepEqual(result.validation, ["1:body_length=650", editorialIssue]);
});

for (const { name, failure } of [
  { name: "authentication", failure: Object.assign(new Error("invalid key"), { status: 401, code: "invalid_api_key" }) },
  { name: "quota", failure: Object.assign(new Error("quota exhausted"), { status: 429, code: "insufficient_quota" }) },
  { name: "abort", failure: new DOMException("request aborted", "AbortError") },
  { name: "a different incomplete message", failure: new Error("READING_INCOMPLETE_OTHER") },
  { name: "a non-Error lookalike", failure: { message: "READING_INCOMPLETE" } },
]) {
  test(`${name} still propagates unchanged after preserving a fulfilled sibling`, async () => {
    const valid = validReport();
    const draft = structuredClone(valid);
    for (let index = 0; index < 2; index++) draft.sections[index] = withBodyLength(draft.sections[index], 650);
    const checkpoints: Report[] = [];
    const calls: number[] = [];

    await assert.rejects(repairReport(draft, input, async request => {
      calls.push(request.section.id);
      if (request.section.id === 1) throw failure;
      return valid.sections[1];
    }, { onCheckpoint: report => checkpoints.push(report) }), error => error === failure);

    assert.deepEqual(calls, [1, 2]);
    assert.equal(checkpoints.length, 1);
    assert.deepEqual(checkpoints[0].sections[0], draft.sections[0]);
    assert.deepEqual(checkpoints[0].sections[1], valid.sections[1]);
  });
}

test("an incomplete sibling does not hide a fatal error from the same batch", async () => {
  const draft = validReport();
  for (let index = 0; index < 2; index++) draft.sections[index] = withBodyLength(draft.sections[index], 650);
  const failure = new Error("fatal request failure");
  const calls: number[] = [];

  await assert.rejects(repairReport(draft, input, async request => {
    calls.push(request.section.id);
    throw request.section.id === 1 ? new Error("READING_INCOMPLETE") : failure;
  }), error => error === failure);
  assert.deepEqual(calls, [1, 2]);
});

test("an empty stage list returns the draft and its unresolved validation without repairs", async () => {
  const draft = validReport();
  draft.sections[0] = withBodyLength(draft.sections[0], 650);
  const result = await repairReport(draft, input, async () => assert.fail("no stages means no repairs"), { stages: [] });
  assert.deepEqual(result.report, draft);
  assert.deepEqual(result.validation, ["1:body_length=650"]);
  assert.deepEqual(result.attempts, []);
});

test("repairReport rejects an already-aborted signal before dispatching repairs", async () => {
  const draft = validReport();
  draft.sections[0] = withBodyLength(draft.sections[0], 650);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(repairReport(draft, input, async () => assert.fail("aborted work must not dispatch"), { signal: controller.signal }), { name: "AbortError" });
  await assert.rejects(repairReport(validReport(), input, async () => assert.fail("aborted work must not dispatch"), { signal: controller.signal }), { name: "AbortError" });
});

test("repairReport does not return a successful last-batch repair after an in-flight abort", async () => {
  const valid = validReport();
  const draft = structuredClone(valid);
  draft.sections[0] = withBodyLength(draft.sections[0], 650);
  const controller = new AbortController();
  const progress: PipelineEvent[] = [];

  await assert.rejects(repairReport(draft, input, async () => {
    await Promise.resolve();
    controller.abort();
    return valid.sections[0];
  }, { signal: controller.signal, onProgress: event => progress.push(event) }), { name: "AbortError" });
  assert.deepEqual(progress, []);
});
