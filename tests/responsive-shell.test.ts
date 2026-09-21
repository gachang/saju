import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("onboarding and report backgrounds fill phone-width viewports", () => {
  const stage = readFileSync(new URL("../src/components/Stage.tsx", import.meta.url), "utf8");
  const reportCss = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");

  assert.match(stage, /h-dvh w-dvw/);
  assert.match(stage, /relative h-full w-full overflow-hidden bg-ink/);
  assert.match(stage, /sm:max-h-\[874px\] sm:max-w-\[402px\]/);
  assert.doesNotMatch(stage, /step === "intro" \? "sm:max-h/);
  assert.match(stage, /className="absolute inset-0"/);
  assert.match(stage, /\.\.\.\(showingReport \? reportFade : fade\)/);

  const screenRule = reportCss.match(/\.screen\s*\{([^}]+)\}/)?.[1] ?? "";
  const scrollRule = reportCss.match(/\.scrollArea\s*\{([^}]+)\}/)?.[1] ?? "";
  const contentRule = reportCss.match(/\.content\s*\{([^}]+)\}/)?.[1] ?? "";
  const backgroundRule = reportCss.match(/\.background\s*\{([^}]+)\}/)?.[1] ?? "";
  const dockRule = reportCss.match(/\.shareDock\s*\{([^}]+)\}/)?.[1] ?? "";
  const shareRule = reportCss.match(/\.share\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(screenRule, /width:\s*100%/);
  assert.match(screenRule, /height:\s*100%/);
  assert.match(screenRule, /overflow:\s*hidden/);
  assert.doesNotMatch(screenRule, /max-width:\s*402px/);
  assert.match(scrollRule, /height:\s*100%/);
  assert.match(scrollRule, /overflow-y:\s*auto/);
  assert.match(scrollRule, /-webkit-overflow-scrolling:\s*touch/);
  assert.match(contentRule, /padding-bottom:\s*var\(--share-dock-reserve\)/);
  assert.match(dockRule, /width:\s*100%/);
  assert.match(dockRule, /position:\s*absolute/);
  assert.match(dockRule, /bottom:\s*0/);
  assert.match(dockRule, /max\(24px, env\(safe-area-inset-bottom, 0px\)\)/);
  assert.match(shareRule, /width:\s*100%/);
  assert.match(shareRule, /max-width:\s*354px/);
  assert.match(backgroundRule, /100% 250px no-repeat/);
  assert.doesNotMatch(backgroundRule, /402px/);
  assert.match(screenRule, /--share-dock-reserve:\s*calc\(94px \+ max\(24px, env\(safe-area-inset-bottom, 0px\)\)\)/);
  assert.match(
    reportCss,
    /@media \(min-width: 640px\)[\s\S]*?\.screen\s*\{\s*max-width:\s*402px;/,
  );
});
