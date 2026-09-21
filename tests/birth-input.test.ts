import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  birthDateDigits,
  formatBirthDate,
  hasOnlyBirthDateChars,
  parseBirthDateInput,
  resolveTwoDigitYear,
  to24HourTime,
} from "../src/lib/saju";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("eight-digit birth dates parse as written", () => {
  assert.deepEqual(parseBirthDateInput("20010111"), { year: "2001", month: "1", day: "11" });
  assert.deepEqual(parseBirthDateInput("19200101"), { year: "1920", month: "1", day: "1" });
});

test("separators people actually type are tolerated", () => {
  for (const raw of ["2001.06.21", "2001-06-21", "2001/06/21", "2001 06 21", "2001,06,21", " 2001.06.21 "]) {
    assert.deepEqual(parseBirthDateInput(raw), { year: "2001", month: "6", day: "21" }, raw);
  }
});

test("six-digit dates land in the hundred-year window ending this year", () => {
  const today = new Date(2026, 0, 1);

  assert.equal(resolveTwoDigitYear(20, today), 2020);
  assert.equal(resolveTwoDigitYear(26, today), 2026);
  assert.equal(resolveTwoDigitYear(27, today), 1927);
  assert.deepEqual(parseBirthDateInput("200101", today), { year: "2020", month: "1", day: "1" });
  assert.deepEqual(parseBirthDateInput("990101", today), { year: "1999", month: "1", day: "1" });
});

test("incomplete, oversized, and out-of-range dates are rejected", () => {
  for (const raw of ["", "2001", "20010", "2001011", "200101110", "2001.13.01", "2001.00.11", "2001.01.32", "abcd"]) {
    assert.equal(parseBirthDateInput(raw), null, raw);
  }
});

test("the field keeps at most eight digits and flags non-numeric characters", () => {
  assert.equal(birthDateDigits("2001.01.11"), "20010111");
  assert.equal(birthDateDigits("2001011199"), "20010111");
  assert.equal(birthDateDigits("20a01b"), "2001");
  assert.equal(hasOnlyBirthDateChars("2001.01.11"), true);
  assert.equal(hasOnlyBirthDateChars("2001년"), false);
  assert.equal(formatBirthDate({ year: "2001", month: "6", day: "1" }), "2001.06.01");
});

test("12-hour input folds into the 24-hour string the engine reads", () => {
  assert.equal(to24HourTime("12", "00", "AM"), "00:00");
  assert.equal(to24HourTime("12", "30", "PM"), "12:30");
  assert.equal(to24HourTime("1", "5", "AM"), "01:05");
  assert.equal(to24HourTime("9", "45", "PM"), "21:45");
  assert.equal(to24HourTime("", "30", "AM"), "");
  assert.equal(to24HourTime("13", "00", "AM"), "");
  assert.equal(to24HourTime("0", "00", "AM"), "");
  assert.equal(to24HourTime("10", "60", "AM"), "");
});

test("the 본인 profile is stored on 분석하기 and reloaded on entry and restart", () => {
  const storage = source("../src/lib/profile-storage.ts");
  const stage = source("../src/components/Stage.tsx");

  assert.match(storage, /window\.localStorage\.setItem/);
  assert.match(storage, /storedPersonSchema\.safeParse/);
  assert.match(stage, /saveSelfProfile\(form\.self\)/);
  assert.match(stage, /const openSelfForm = useCallback\(\(\) => \{\s*const saved = loadSelfProfile\(\);/);
  assert.match(stage, /onStart=\{openSelfForm\}/);
});
