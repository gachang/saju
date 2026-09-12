import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readingInput, pairSchema, nameLengthsSchema } from "../src/lib/compatibility";
import { reportSchema, displayText, displayedBodyLength, validateReport } from "../src/lib/reading-schema";

async function main() {
  const file = process.argv[2], name = process.argv[3];
  if (!file || !name || !/^[a-z0-9-]+$/.test(name)) throw new Error("EXPORT_ARGUMENTS");
  const data = JSON.parse(await readFile(file, "utf8"));
  const report = reportSchema.parse(data.report);
  const pair = pairSchema.parse(data.pair);
  const nameLengths = nameLengthsSchema.parse(data.nameLengths ?? { self: 3, favorite: 2 });
  const input = readingInput(pair, "2026-09-12", nameLengths);
  if (validateReport(report, input).length || data.validation?.length || !data.editorial?.length || data.editorial.at(-1).length) throw new Error("EXPORT_UNVERIFIED_REPORT");
  const self = nameLengths.self === 3 ? "사용자" : "가나다라마바사아자차카타".slice(0, nameLengths.self);
  const favorite = nameLengths.favorite === 2 ? "최애" : "하파타카차자아사바마라다".slice(0, nameLengths.favorite);
  const format = (text: string) => displayText(text, self, favorite);
  const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const intro = "합성 명식으로 OpenAI API에서 생성한 검증용 완성본입니다. 실제 인물의 성격·감정·미래를 판단하지 않는 엔터테인먼트 콘텐츠입니다.";
  const lengths = report.sections.map(s => displayedBodyLength(s, input));
  const markdown = `# 성덕기니 AI 보고서 완성본\n\n${intro}\n\n- 프롬프트: ${data.promptVersion}\n- 사용 호칭: ${self} 님 / ${favorite} 님\n- 각 장 본문 글자 수: ${lengths.join(", ")}\n- 자동 형식·근거 표현 검사: 통과\n- Terra low 편집 검수: 통과 (의미 정확성의 보증은 아님)\n\n` + report.sections.map(s => `## ${s.id}. ${s.title}\n\n${s.paragraphs.map(format).join("\n\n")}\n\n근거: ${s.evidence_ids.join(", ")}`).join("\n\n");
  const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>성덕기니 · AI 보고서 완성본</title><style>body{margin:0;background:#111924;color:#e8e8e8;font:16px/1.95 system-ui,sans-serif}main{max-width:780px;margin:auto;padding:48px 24px}h1,h2{color:#efce8d;line-height:1.55}h1{font-size:30px}h2{font-size:23px}section{border-top:1px solid #6e6045;padding:26px 0}p{word-break:keep-all;overflow-wrap:anywhere}aside,small{color:#b8c2cf}details{font-size:12px;color:#aaa}a{color:#efce8d}@media print{body{background:white;color:#111}h1,h2{color:#333}section{break-inside:avoid}}</style><main><small>성덕기니 · 합성 입력 검증본</small><h1>감상이 취향의 언어가 될 때</h1><aside>${escape(intro)}</aside><p>${escape(self)} 님 × ${escape(favorite)} 님<br>8개 장 · 각 700~750자 · 프롬프트 ${escape(data.promptVersion)}</p>${report.sections.map(s => `<section><h2>${s.id}. ${escape(s.title)}</h2>${s.paragraphs.map(p => `<p>${escape(format(p))}</p>`).join("")}<details><summary>사용 근거 · 본문 ${lengths[s.id - 1]}자</summary>${escape(s.evidence_ids.join(", "))}</details></section>`).join("")}<aside>명식은 선택한 계산 관법의 결과이며, 궁합 지표와 문장은 재미를 위한 자체 해석입니다. 출생시각 미상과 연도별 계산의 한계는 유지됩니다.</aside></main></html>`;
  await mkdir("docs/reports", { recursive: true });
  await writeFile(`docs/reports/${name}.md`, markdown);
  await writeFile(`docs/reports/${name}.html`, html);
  console.log(JSON.stringify({ exported: name, lengths }));
}
main().catch(() => { console.error("Report export failed: verify input and validation results."); process.exitCode = 1; });
