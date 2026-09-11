import { z } from "zod";
import type { readingInput } from "./compatibility";

export const reportSchema = z.object({
  report_version: z.literal("otaku-report-v1"),
  sections: z.array(z.object({
    id: z.number().int(), title: z.string(), paragraphs: z.array(z.string()).length(3),
    evidence_ids: z.array(z.string()), flow_ids: z.array(z.string()),
  }).strict()).length(8),
  limitations: z.array(z.enum(["THREE_PILLARS_ONLY", "MULTIPLE_CHARTS", "NO_YEARLY_FLOW", "INSUFFICIENT_EVIDENCE"])),
}).strict();
export type Report = z.infer<typeof reportSchema>;
export const countText = (text: string) => Array.from(text.normalize("NFC")).length;
export const displayText = (text: string, self = "사용자", favorite = "최애") => text.replaceAll("{{USER}}", self).replaceAll("{{FAVORITE}}", favorite);

export function validateReport(report: Report, input: ReturnType<typeof readingInput>) {
  const errors: string[] = [];
  const ids = new Set(input.evidence.map(e => e.id));
  report.sections.forEach((s, i) => {
    const body = s.paragraphs.map(p => displayText(p)).join("");
    const length = countText(body);
    if (s.id !== i + 1) errors.push(`${i + 1}:order`);
    if (countText(s.title) < 35 || countText(s.title) > 45) errors.push(`${s.id}:title_length=${countText(s.title)}`);
    if ((s.title.match(/기니/g) ?? []).length !== 1 || !/기니[!?]?$/.test(s.title) || !s.title.includes(",")) errors.push(`${s.id}:title_style`);
    if (length < 700 || length > 750) errors.push(`${s.id}:body_length=${length}`);
    if (s.paragraphs.some(p => /[\r\n]/.test(p))) errors.push(`${s.id}:paragraph_break`);
    if (s.paragraphs.some(p => !/[.!?]$/.test(p.trim()))) errors.push(`${s.id}:unfinished_sentence`);
    if (/[{}]/.test(body)) errors.push(`${s.id}:broken_placeholder`);
    if (/\p{Extended_Pictographic}/u.test(s.title + body)) errors.push(`${s.id}:emoji`);
    if (/[\p{Script=Han}]/u.test(s.title + body)) errors.push(`${s.id}:hanja`);
    if (/기니[.!?]|당신|(?:^|\s)그대(?:는|가|를|의|에게|여|와|도)?(?:\s|[,.!?]|$)|그 사람|운명적으로|반드시.*(?:만나|돌아|탈덕)/.test(body)) errors.push(`${s.id}:forbidden_style`);
    if (!body.includes("사용자 님") || !body.includes("최애 님")) errors.push(`${s.id}:names`);
    if (s.evidence_ids.some(id => !ids.has(id)) || new Set(s.evidence_ids).size < Math.min(2, ids.size)) errors.push(`${s.id}:evidence`);
    if (s.flow_ids.length || /(?:19|20|21)\d{2}년|내년|올해|내후년/.test(body + s.title)) errors.push(`${s.id}:ungrounded_time`);
    if (s.id === 7 && !/상상|가상/.test(s.paragraphs[0])) errors.push("7:hypothetical");
  });
  const punctuation = report.sections.filter(s => /[!?]$/.test(s.title)).length;
  if (punctuation < 2 || punctuation > 3) errors.push("title_punctuation_count");
  if (!report.limitations.includes("NO_YEARLY_FLOW")) errors.push("missing_time_limitation");
  if ((input.coverage.self === "3주" || input.coverage.favorite === "3주") && !report.limitations.includes("THREE_PILLARS_ONLY")) errors.push("missing_hour_limitation");
  return errors;
}
