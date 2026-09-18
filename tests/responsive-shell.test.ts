import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("onboarding and report backgrounds fill phone-width viewports", () => {
  const stage = readFileSync(new URL("../src/components/Stage.tsx", import.meta.url), "utf8");
  const reportCss = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");

  assert.match(stage, /h-dvh w-dvw/);
  assert.match(stage, /relative h-full w-full overflow-hidden bg-ink/);
  assert.match(stage, /showingReport \? "min-h-dvh w-full bg-ink"/);
  assert.match(stage, /showingReport \? "relative min-h-dvh w-full"/);
  assert.match(stage, /\.\.\.\(showingReport \? reportFade : fade\)/);

  const screenRule = reportCss.match(/\.screen\s*\{([^}]+)\}/)?.[1] ?? "";
  const dockRule = reportCss.match(/\.shareDock\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(screenRule, /width:\s*100%/);
  assert.match(screenRule, /min-height:\s*100dvh/);
  assert.match(screenRule, /overflow-y:\s*visible/);
  assert.doesNotMatch(screenRule, /overflow-y:\s*auto/);
  assert.doesNotMatch(screenRule, /max-width:\s*402px/);
  assert.match(dockRule, /width:\s*100%/);
  assert.match(reportCss, /padding-bottom:\s*148px/);
  assert.match(reportCss, /padding-bottom:\s*calc\(148px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(
    reportCss,
    /@media \(min-width: 640px\)[\s\S]*?\.screen,[\s\S]*?\.shareDock\s*\{\s*max-width:\s*402px;/,
  );
});
