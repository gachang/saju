import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chartOneLineSummary } from "../src/lib/compatibility";

const chart = { year: "임신", month: "경술", day: "계유", hour: null } as const;

test("chart cards include a grounded one-line summary matching the Figma card", () => {
  const overview = readFileSync(new URL("../src/components/ReadingOverview.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");
  const summary = chartOneLineSummary(chart, "강미");

  assert.match(summary, /^강미님은 /u);
  assert.match(summary, /술월/u);
  assert.match(summary, /계수/u);
  assert.match(overview, /chartSummaryLabel}>한 줄 요약/);
  assert.match(overview, /chartOneLineSummary\(pillar, name\)/);
  assert.match(overview, /!favorite && \(/);
  assert.match(css, /\.chartSummary[\s\S]*background: rgba\(250, 249, 153, 0\.08\)/);
  assert.match(css, /\.chartSummaryLabel[\s\S]*font-size: 8px/);
  assert.match(css, /\.chartSummaryText[\s\S]*font-size: 13px/);
});

test("report heading stays transparent, the backdrop owns only the bottom gradient, and the visible disclaimer is removed", () => {
  const screen = readFileSync(new URL("../src/components/ResultScreen.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");
  const headingRule = css.match(/\.tierHeading\s*\{([^}]+)\}/)?.[1] ?? "";
  const backdropRule = css.match(/\.background\s*\{([^}]+)\}/)?.[1] ?? "";

  assert.match(headingRule, /background:\s*transparent/);
  assert.match(headingRule, /border:\s*0/);
  assert.match(backdropRule, /background:\s*linear-gradient/);
  assert.match(backdropRule, /transparent calc\(100% - 440px\)/);
  assert.match(backdropRule, /#000c17 100%/);
  assert.doesNotMatch(backdropRule, /rgba\(18, 18, 18/);
  assert.doesNotMatch(screen, /전통 명리의 상징을 활용한 오락 콘텐츠/);
  assert.doesNotMatch(css, /\.footnote\s*\{/);
});

test("the Figma orbit circles belong to the loading screen, not the report hero", () => {
  const overview = readFileSync(new URL("../src/components/ReadingOverview.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");
  const orbit = readFileSync(new URL("../src/components/ElementOrbit.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(overview, /orbit-(?:outer|inner)\.svg/);
  assert.doesNotMatch(css, /\.orbit(?:Rings|Outer|Inner)/);
  assert.match(orbit, /animationMode = "loading"/);
  assert.match(orbit, /loading-orbit-outer\.svg/);
  assert.match(orbit, /top-\[12\.88%\][\s\S]*w-\[77\.3%\]/);
  assert.match(orbit, /loading-orbit-inner\.svg/);
  assert.match(orbit, /top-\[15\.64%\][\s\S]*w-\[71\.66%\]/);
  assert.match(orbit, /intro-orbit-middle\.svg/);
  assert.match(orbit, /top-\[21\.17%\][\s\S]*w-\[60\.78%\]/);
  assert.match(orbit, /data-orbit-rings=\{animationMode\}/);
  assert.match(orbit, /animationMode === "intro" \? -0\.5 : 0\.5/);
  assert.match(orbit, /left-\[calc\(50%\+1px\)\]/);
  assert.match(orbit, /saju-orbit-track-intro/);
  assert.match(orbit, /saju-orbit-track-loading/);
});

test("the share button has no visible caption below it", () => {
  const screen = readFileSync(new URL("../src/components/ResultScreen.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");

  assert.doesNotMatch(screen, /보고서 내용을 바로 공유해요/);
  assert.doesNotMatch(screen, /styles\.shareCaption/);
  assert.doesNotMatch(css, /\.shareCaption\s*\{/);
  assert.match(screen, /className="sr-only" aria-live="polite"/);
});

test("the report owns its bottom gradient and keeps compact bordered actions", () => {
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");

  assert.match(css, /\.background\s*\{[\s\S]*linear-gradient\([\s\S]*#000c17 100%/);
  assert.match(css, /\.restart\s*\{[\s\S]*border:\s*1\.5px solid #f3ef9c/);
  assert.match(css, /\.shareDock\s*\{[\s\S]*linear-gradient\(0deg, #000c17 0%, rgba\(0, 30, 59, 0\) 100%\)/);
  assert.match(css, /\.shareDock\s*\{[\s\S]*backdrop-filter:\s*blur\(4px\)/);
  assert.match(css, /padding-bottom:\s*calc\(70px \+ max\(24px, env\(safe-area-inset-bottom\)\)\)/);
});
