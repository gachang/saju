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

test("the report hero restores both exported Figma orbit circles", () => {
  const overview = readFileSync(new URL("../src/components/ReadingOverview.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");

  assert.match(overview, /\/report\/orbit-outer\.svg/);
  assert.match(overview, /\/report\/orbit-inner\.svg/);
  assert.match(css, /\.orbitOuter[\s\S]*top:\s*42px[\s\S]*left:\s*38px/);
  assert.match(css, /\.orbitInner[\s\S]*top:\s*51px[\s\S]*left:\s*47px/);
});
