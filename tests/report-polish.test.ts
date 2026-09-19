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

test("report heading and backdrop stay transparent and the visible disclaimer is removed", () => {
  const screen = readFileSync(new URL("../src/components/ResultScreen.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");
  const headingRule = css.match(/\.tierHeading\s*\{([^}]+)\}/)?.[1] ?? "";
  const backdropRule = css.match(/\.background\s*\{([^}]+)\}/)?.[1] ?? "";

  assert.match(headingRule, /background:\s*transparent/);
  assert.match(headingRule, /border:\s*0/);
  assert.match(backdropRule, /background:\s*transparent/);
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
  assert.match(orbit, /animationMode === "loading"/);
  assert.match(orbit, /loading-orbit-outer\.svg/);
  assert.match(orbit, /top-\[12\.88%\][\s\S]*w-\[77\.3%\]/);
  assert.match(orbit, /loading-orbit-inner\.svg/);
  assert.match(orbit, /top-\[15\.64%\][\s\S]*w-\[71\.66%\]/);
});

test("the share button has no visible caption below it", () => {
  const screen = readFileSync(new URL("../src/components/ResultScreen.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");

  assert.doesNotMatch(screen, /보고서 내용을 바로 공유해요/);
  assert.doesNotMatch(screen, /styles\.shareCaption/);
  assert.doesNotMatch(css, /\.shareCaption\s*\{/);
  assert.match(screen, /className="sr-only" aria-live="polite"/);
});
