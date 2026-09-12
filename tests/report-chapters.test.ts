import test, { before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { countText, displayText, reportSchema } from "../src/lib/reading-schema";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/accepted-report.json", import.meta.url), "utf8"));
const report = reportSchema.parse(fixture.report);
let ReportChapters: typeof import("../src/components/ReportChapters").ReportChapters;

before(async () => {
  // Node does not compile CSS Modules. Supply only the class map for static HTML assertions.
  const require = createRequire(import.meta.url);
  const previousLoader = require.extensions[".css"];
  require.extensions[".css"] = (module, filename) => {
    const selectors = [...readFileSync(filename, "utf8").matchAll(/\.([a-zA-Z][\w-]*)\s*(?:\{|[\s,.#>:])/g)];
    module.exports = Object.fromEntries(selectors.map(([, name]) => [name, name]));
  };
  try {
    ({ ReportChapters } = await import("../src/components/ReportChapters"));
  } finally {
    if (previousLoader) require.extensions[".css"] = previousLoader;
    else delete require.extensions[".css"];
  }
});

test("report layout renders all eight chapters and all 24 original paragraphs", () => {
  const html = renderToStaticMarkup(createElement(ReportChapters, { report, selfName: "사용자", favoriteName: "최애" }));
  assert.equal((html.match(/<article\b/g) ?? []).length, 8);
  assert.equal((html.match(/<h2\b/g) ?? []).length, 1);
  assert.equal((html.match(/<h3\b/g) ?? []).length, 8);
  assert.equal((html.match(/<p\b/g) ?? []).length, 24);
  for (const section of report.sections) {
    assert.ok(html.includes(`id="report-chapter-${section.id}-heading"`));
    assert.ok(html.includes(`aria-labelledby="report-chapter-${section.id}-heading"`));
    assert.ok(html.includes(section.title));
    for (const paragraph of section.paragraphs) assert.ok(html.includes(displayText(paragraph)));
  }
});

test("names render as escaped text and footer counts use the displayed names", () => {
  const selfName = "<나&별>";
  const favoriteName = "$&빛";
  const html = renderToStaticMarkup(createElement(ReportChapters, { report, selfName, favoriteName }));
  assert.ok(html.includes("&lt;나&amp;별&gt; 님"));
  assert.ok(html.includes("$&amp;빛 님"));
  assert.ok(!html.includes("<나&별>"));
  assert.ok(!html.includes("{{USER}}"));
  assert.ok(!html.includes("{{FAVORITE}}"));
  const footerCounts = [...html.matchAll(/<footer[^>]*>(\d+)자 · 3문단<\/footer>/g)].map(match => Number(match[1]));
  const expectedCounts = report.sections.map(section => section.paragraphs.reduce((total, paragraph) => total + countText(displayText(paragraph, selfName, favoriteName)), 0));
  assert.deepEqual(footerCounts, expectedCounts);
});

test("blank names fall back consistently and content containers do not clip copy", () => {
  const html = renderToStaticMarkup(createElement(ReportChapters, { report, selfName: " ", favoriteName: "" }));
  assert.ok(html.includes("사용자 님"));
  assert.ok(html.includes("최애 님"));
  assert.ok(html.includes("725자 · 3문단"));
  const css = readFileSync(new URL("../src/components/ReportChapters.module.css", import.meta.url), "utf8");
  for (const selector of ["card", "title", "body"]) {
    const rule = css.match(new RegExp(`\\.${selector}\\s*\\{([^}]+)\\}`))?.[1] ?? "";
    assert.ok(rule);
    assert.doesNotMatch(rule, /(?:^|;)\s*(?:height|max-height|line-clamp|-webkit-line-clamp)\s*:/);
    assert.doesNotMatch(rule, /(?:overflow\s*:\s*hidden|white-space\s*:\s*nowrap)/);
  }
});
