import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chartCardTitle, chartOneLineSummary } from "../src/lib/compatibility";

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
  assert.match(overview, /className=\{styles\.pillarHeader\}/);
  assert.match(overview, /<strong>\{value \?\? "미상"\}<\/strong>/);
  assert.match(overview, /className=\{styles\.pillarColumn\}/);
  assert.doesNotMatch(overview, /<dt>\{label\}·\{element\}<\/dt>/);
  assert.match(css, /\.pillarColumn[\s\S]*gap: 8px/);
  assert.match(css, /\.pillarUpper[\s\S]*gap: 4px/);
  assert.match(css, /\.pillarHeader[\s\S]*font-size: 10px/);
  assert.match(css, /\.pillarHeader strong[\s\S]*font-weight: 500/);
  assert.match(css, /\.pillar[\s\S]*padding: 11px 4px/);
  assert.match(css, /\.favoriteCard[\s\S]*border-color: rgba\(250, 249, 153, 0\.2\)/);
  assert.match(css, /\.chartSummary[\s\S]*background: rgba\(250, 249, 153, 0\.08\)/);
  assert.match(css, /\.chartSummaryLabel[\s\S]*color: #faf999/);
  assert.match(css, /\.chartSummaryLabel[\s\S]*font-size: 8px/);
  assert.match(css, /\.chartSummaryText[\s\S]*font-size: 13px/);
});

test("the self chart title follows the day master instead of using one fixed slogan", () => {
  const overview = readFileSync(new URL("../src/components/ReadingOverview.tsx", import.meta.url), "utf8");
  const water = { year: "임신", month: "경술", day: "계유", hour: null } as const;
  const wood = { year: "임신", month: "경술", day: "갑신", hour: null } as const;

  assert.equal(chartCardTitle(water), "조용히 스며드는 이슬비");
  assert.equal(chartCardTitle(wood), "곧게 자라는 큰 나무");
  assert.notEqual(chartCardTitle(water), chartCardTitle(wood));
  assert.match(overview, /chartCardTitle\(pillar\)/);
  assert.doesNotMatch(overview, /흙더미 속 다이아 원석/);
});

test("report heading stays transparent, the backdrop owns only the bottom gradient, and the visible disclaimer is removed", () => {
  const screen = readFileSync(new URL("../src/components/ResultScreen.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");
  const headingRule = css.match(/\.tierHeading\s*\{([^}]+)\}/)?.[1] ?? "";
  const backdropRule = css.match(/\.background\s*\{([^}]+)\}/)?.[1] ?? "";

  assert.match(headingRule, /background:\s*transparent/);
  assert.match(headingRule, /border:\s*0/);
  assert.match(backdropRule, /background:\s*linear-gradient/);
  assert.match(backdropRule, /rgba\(18, 18, 18, 0\.7\) 72\.226%/);
  assert.match(backdropRule, /100% 250px no-repeat/);
  assert.doesNotMatch(backdropRule, /calc\(100% - 440px\)/);
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

test("the share dock includes the revised expiring-link caption", () => {
  const screen = readFileSync(new URL("../src/components/ResultScreen.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");
  const captionRule = css.match(/\.shareCaption\s*\{([^}]+)\}/)?.[1] ?? "";

  assert.doesNotMatch(screen, /보고서 내용을 바로 공유해요/);
  assert.match(screen, /\{shareMessage \|\| "링크는 3일 뒤 사라져요"\}/);
  assert.match(captionRule, /font-size:\s*10px/);
  assert.match(captionRule, /font-weight:\s*400/);
  assert.match(captionRule, /color:\s*rgba\(248, 242, 230, 0\.8\)/);
  assert.match(screen, /className=\{styles\.shareCaption\} role="status" aria-live="polite"/);
});

test("sharing creates one privacy-minimized expiring report link and prefers Kakao", () => {
  const screen = readFileSync(new URL("../src/components/ResultScreen.tsx", import.meta.url), "utf8");
  const payload = screen.match(/const payload = \{([\s\S]*?)\n      \};/)?.[1] ?? "";

  assert.match(screen, /useRef<Promise<SharedReportResponse> \| null>\(/);
  assert.match(screen, /props\.initialShareUrl/);
  assert.match(screen, /fetch\("\/api\/shared-reports"/);
  assert.match(screen, /selfChart: \{ \.\.\.result\.self, variants: \[result\.self\.variants\[0\]\] \}/);
  assert.match(screen, /favoriteChart: \{ \.\.\.result\.favorite, variants: \[result\.favorite\.variants\[0\]\] \}/);
  assert.doesNotMatch(payload, /birthDateText|birthTime|birthHour|birthMinute|gender|calendar|form\./);
  assert.match(screen, /kakao_js_sdk\/2\.8\.3\/kakao\.min\.js/);
  assert.match(screen, /window\.Kakao\?\.Share\.sendDefault\(kakaoShareTemplate\(url\)\)/);
  assert.match(screen, /navigator\.share\(\{ title: "성덕기니 보고서", url \}\)/);
  assert.match(screen, /navigator\.clipboard\.writeText\(url\)/);
  assert.match(screen, /disabled=\{isSharing\}/);
  assert.match(screen, /aria-busy=\{isSharing\}/);
});

test("the report owns its responsive bottom gradient and keeps the share CTA pinned to its shell", () => {
  const screen = readFileSync(new URL("../src/components/ResultScreen.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");
  const backgroundRule = css.match(/\.background\s*\{([^}]+)\}/)?.[1] ?? "";
  const screenRule = css.match(/\.screen\s*\{([^}]+)\}/)?.[1] ?? "";
  const scrollRule = css.match(/\.scrollArea\s*\{([^}]+)\}/)?.[1] ?? "";
  const contentRule = css.match(/\.content\s*\{([^}]+)\}/)?.[1] ?? "";
  const dockRule = css.match(/\.shareDock\s*\{([^}]+)\}/)?.[1] ?? "";
  const restartRule = css.match(/\.restart\s*\{([^}]+)\}/)?.[1] ?? "";
  const shareRule = css.match(/\.share\s*\{([^}]+)\}/)?.[1] ?? "";

  assert.match(backgroundRule, /rgba\(18, 18, 18, 0\.7\) 72\.226%/);
  assert.match(backgroundRule, /100% 250px no-repeat/);
  assert.match(restartRule, /border:\s*0/);
  assert.match(restartRule, /background:\s*rgba\(1, 46, 88, 0\.4\)/);
  assert.match(restartRule, /color:\s*rgba\(255, 255, 255, 0\.8\)/);
  assert.match(restartRule, /font-family:\s*var\(--font-report-serif\)/);
  assert.match(restartRule, /font-size:\s*20px/);
  assert.match(restartRule, /font-weight:\s*900/);
  assert.match(restartRule, /line-height:\s*normal/);
  assert.match(screenRule, /overflow:\s*hidden/);
  assert.match(scrollRule, /height:\s*100%/);
  assert.match(scrollRule, /overflow-y:\s*auto/);
  assert.match(contentRule, /padding-bottom:\s*var\(--share-dock-reserve\)/);
  assert.match(dockRule, /position:\s*absolute/);
  assert.match(dockRule, /inset-inline:\s*0/);
  assert.match(dockRule, /bottom:\s*0/);
  assert.match(dockRule, /z-index:\s*30/);
  assert.match(dockRule, /gap:\s*10px/);
  assert.match(dockRule, /#000c17 0%/);
  assert.match(dockRule, /rgba\(0, 25, 49, 0\.28\) 86\.229%/);
  assert.match(dockRule, /rgba\(0, 30, 59, 0\) 100%/);
  assert.match(dockRule, /backdrop-filter:\s*blur\(10px\)/);
  assert.match(dockRule, /pointer-events:\s*none/);
  assert.match(shareRule, /max-width:\s*354px/);
  assert.match(shareRule, /height:\s*54px/);
  assert.match(shareRule, /border:\s*1\.5px solid #f3ef9c/);
  assert.match(shareRule, /font-size:\s*18px/);
  assert.match(shareRule, /font-weight:\s*800/);
  assert.match(shareRule, /pointer-events:\s*auto/);
  assert.match(screen, /className=\{styles\.scrollArea\}/);
  assert.match(screen, /<\/div>\s*<div className=\{styles\.shareDock\}>/);
});

test("the revised report hero typography matches the Figma text styles", () => {
  const css = readFileSync(new URL("../src/components/ResultScreen.module.css", import.meta.url), "utf8");
  const taglineRule = css.match(/\.tierHeading p\s*\{([^}]+)\}/)?.[1] ?? "";
  const descriptionRule = css.match(/\.scoreDescription\s*\{([^}]+)\}/)?.[1] ?? "";

  assert.match(taglineRule, /font-family:\s*var\(--font-report-serif\)/);
  assert.match(taglineRule, /font-size:\s*16px/);
  assert.match(taglineRule, /font-weight:\s*500/);
  assert.match(taglineRule, /line-height:\s*normal/);
  assert.match(descriptionRule, /font-family:\s*var\(--font-report-sans\)/);
  assert.match(descriptionRule, /font-size:\s*14px/);
  assert.match(descriptionRule, /font-weight:\s*400/);
  assert.match(descriptionRule, /line-height:\s*1\.7/);
  assert.match(descriptionRule, /text-align:\s*left/);
  assert.match(descriptionRule, /text-wrap:\s*pretty/);
});

test("the intro and loading copy use the revised Figma font weights and sizes", () => {
  const intro = readFileSync(new URL("../src/components/IntroScreen.tsx", import.meta.url), "utf8");
  const analyzing = readFileSync(new URL("../src/components/AnalyzingScreen.tsx", import.meta.url), "utf8");

  assert.match(intro, /text-\[15px\] font-medium leading-\[normal\] text-\[rgba\(252,252,244,0\.78\)\]/);
  assert.match(intro, /text-\[48px\] font-extrabold leading-\[normal\] text-\[#f3ef9c\]/);
  assert.match(analyzing, /font-hambak text-\[24px\] font-extrabold leading-\[normal\] text-white/);
  assert.match(analyzing, /\[font-family:var\(--font-report-serif\)\] text-\[15px\] font-medium leading-\[normal\] text-\[rgba\(252,252,244,0\.78\)\]/);
});

test("the loading composition shares one centered Figma stack without a motion transform collision", () => {
  const analyzing = readFileSync(new URL("../src/components/AnalyzingScreen.tsx", import.meta.url), "utf8");
  const backdrop = readFileSync(new URL("../src/components/Backdrop.tsx", import.meta.url), "utf8");
  const stack = analyzing.match(/data-loading-stack="true"[\s\S]*?className="([^"]+)"/)?.[1] ?? "";
  const orbit = analyzing.match(/data-loading-orbit="true"[\s\S]*?className="([^"]+)"/)?.[1] ?? "";
  const summary = analyzing.match(/data-loading-summary="true"[\s\S]*?className="([^"]+)"/)?.[1] ?? "";

  assert.match(stack, /top-\[15\.33%\]/);
  assert.match(stack, /bottom-\[13\.96%\]/);
  assert.match(stack, /left-1\/2/);
  assert.match(stack, /w-\[81\.1%\]/);
  assert.match(stack, /max-w-\[326px\]/);
  assert.match(stack, /-translate-x-1\/2/);
  assert.match(stack, /gap-\[min\(60px,6\.86dvh\)\]/);
  assert.doesNotMatch(stack, /justify-center/);
  assert.match(analyzing, /h-\[57px\] w-\[90\.18%\][^"\n]*justify-center[^"\n]*gap-1/);
  assert.match(orbit, /relative/);
  assert.match(orbit, /h-\[306px\]/);
  assert.match(orbit, /w-full/);
  assert.doesNotMatch(orbit, /left-1\/2|-translate-x-1\/2/);
  assert.match(summary, /w-\[97\.24%\]/);
  assert.match(summary, /max-w-\[317px\]/);
  assert.match(summary, /gap-6/);
  assert.doesNotMatch(analyzing, /top-\[31\.35%\]|top-\[73\.55%\]|top-\[89\.25%\]/);
  assert.doesNotMatch(analyzing, /"[^"\n]*\\n[^"\n]*"/);
  assert.match(backdrop, /top-\[-8\.92%\] left-\[-54\.23%\]/);
});
