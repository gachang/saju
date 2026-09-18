import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyPerson, isBirthDateValid, isPersonComplete } from "../src/lib/saju";

const today = new Date();
const validDate = {
  ...emptyPerson,
  name: "테스트",
  year: String(today.getFullYear() - 20),
  month: "1",
  day: "1",
};

test("form completeness requires a non-future date and an explicit time choice", () => {
  assert.equal(isBirthDateValid(validDate), true);
  assert.equal(isPersonComplete(validDate), false);
  assert.equal(isPersonComplete({ ...validDate, birthTime: "12:30" }), true);
  assert.equal(isPersonComplete({ ...validDate, timeUnknown: true }), true);
  assert.equal(isPersonComplete({ ...validDate, name: "", timeUnknown: true }), false);
  assert.equal(isPersonComplete({ ...validDate, name: "   ", timeUnknown: true }), false);
  assert.equal(isBirthDateValid({ ...validDate, year: String(today.getFullYear() + 1) }), false);
});

test("form and analyzing screens expose visible recovery guidance", () => {
  const form = readFileSync(new URL("../src/components/FormScreen.tsx", import.meta.url), "utf8");
  const analyzing = readFileSync(new URL("../src/components/AnalyzingScreen.tsx", import.meta.url), "utf8");

  assert.match(form, /태어난 시간을 설정하거나/);
  assert.match(form, /이름을 입력해 주세요/);
  assert.match(form, /required/);
  assert.match(form, /오늘보다 이전의 올바른 생년월일/);
  assert.match(form, /aria-invalid=/);
  assert.match(analyzing, /입력 다시 확인하기/);
  assert.match(analyzing, /onBack\(charts\.invalidStep/);
  assert.match(analyzing, /!charts\.error && <div/);
});

test("self and partner input forms scroll without covering fields with the submit button", () => {
  const form = readFileSync(new URL("../src/components/FormScreen.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

  assert.match(form, /saju-form-scroll absolute inset-0 z-10 overflow-y-auto/);
  assert.match(form, /saju-form-page flex min-h-full flex-col px-6/);
  assert.match(form, /className="mt-auto pt-8"/);
  assert.doesNotMatch(form, /absolute inset-x-6 bottom-\[54px\]/);
  assert.match(styles, /\.saju-form-scroll[\s\S]*-webkit-overflow-scrolling: touch/);
  assert.match(styles, /\.saju-form-page[\s\S]*padding-bottom: max\(54px, env\(safe-area-inset-bottom\)\)/);
});
