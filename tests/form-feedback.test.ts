import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyPerson, isBirthDateValid, isPersonComplete } from "../src/lib/saju";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

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
  const fields = source("../src/components/form/PersonFields.tsx");
  const analyzing = source("../src/components/AnalyzingScreen.tsx");

  assert.match(fields, /태어난 시간을 설정하거나/);
  assert.match(fields, /이름을 입력해 주세요/);
  assert.match(fields, /required/);
  assert.match(fields, /오늘보다 이전의 올바른 생년월일/);
  assert.match(fields, /숫자만 입력해주세요/);
  assert.match(fields, /aria-invalid=/);
  assert.match(analyzing, /입력 다시 확인하기/);
  assert.match(analyzing, /onBack\(charts\.invalidStep/);
  assert.match(analyzing, /!charts\.error && <div/);
});

test("self and partner input forms scroll without covering fields with the submit button", () => {
  const shell = source("../src/components/form/FormShell.tsx");
  const styles = source("../src/app/globals.css");

  assert.match(shell, /saju-form-scroll absolute inset-0 z-10 overflow-y-auto/);
  assert.match(shell, /saju-form-page flex min-h-full flex-col px-6/);
  assert.match(shell, /className="mt-auto pt-8"/);
  assert.doesNotMatch(shell, /absolute inset-x-6 bottom-\[54px\]/);
  assert.match(styles, /\.saju-form-scroll[\s\S]*-webkit-overflow-scrolling: touch/);
  assert.match(styles, /\.saju-form-page[\s\S]*padding-bottom: max\(54px, env\(safe-area-inset-bottom\)\)/);
});

test("input screen brand and title participate in the same scroll flow as the fields", () => {
  const shell = source("../src/components/form/FormShell.tsx");
  const styles = source("../src/app/globals.css");
  const formStart = shell.indexOf("<form");

  assert.ok(shell.indexOf("<BrandMark", formStart) > formStart);
  assert.ok(shell.indexOf("<h1", formStart) > formStart);
  assert.doesNotMatch(shell, /<BrandMark className="absolute/);
  assert.match(source("../src/components/SelfFormScreen.tsx"), /titleGap="mt-4"/);
  assert.match(source("../src/components/PartnerFormScreen.tsx"), /titleGap="mt-\[47px\]"/);
  assert.match(styles, /\.saju-form-page[\s\S]*padding-top: 6\.86dvh/);
});

test("input screens use Diphylleia, white completed values, and a next-step label", () => {
  const controls = source("../src/components/form/controls.tsx");
  const shell = source("../src/components/form/FormShell.tsx");

  assert.match(controls, /controlClass =[\s\S]*font-diphylleia[\s\S]*text-white/);
  assert.match(shell, /saju-form-scroll[^"]*font-diphylleia/);
  assert.match(source("../src/components/SelfFormScreen.tsx"), /submitLabel="다음으로"/);
  assert.match(source("../src/components/PartnerFormScreen.tsx"), /submitLabel="분석하기"/);
});

test("only the 좋아하는 사람 screen carries a back control, wired to the 본인 step", () => {
  const shell = source("../src/components/form/FormShell.tsx");
  const stage = source("../src/components/Stage.tsx");

  assert.match(shell, /aria-label="이전 단계로 돌아가기"/);
  assert.match(shell, /onBack && <BackButton/);
  assert.match(shell, /absolute top-4 left-4 z-20 grid size-9/);
  assert.match(source("../src/components/PartnerFormScreen.tsx"), /onBack=\{onBack\}/);
  assert.doesNotMatch(source("../src/components/SelfFormScreen.tsx"), /onBack/);
  assert.match(stage, /onBack=\{\(\) => setStep\("self"\)\}/);
});
