import { z } from "zod";
import { AXES, DEFAULT_NAME_LENGTHS, nameLengthsSchema, type readingInput } from "./compatibility";

export const sectionSchema = z.object({
  id: z.number().int(), title: z.string(), paragraphs: z.array(z.string()).length(3),
  evidence_ids: z.array(z.string()), flow_ids: z.array(z.string()),
}).strict();
export const reportSchema = z.object({
  report_version: z.literal("otaku-report-v1"),
  sections: z.array(sectionSchema).length(8),
  limitations: z.array(z.enum(["THREE_PILLARS_ONLY", "MULTIPLE_CHARTS", "NO_YEARLY_FLOW", "INSUFFICIENT_EVIDENCE"])),
}).strict();
export type Report = z.infer<typeof reportSchema>;
export type ReportSection = z.infer<typeof sectionSchema>;
export const countText = (text: string) => Array.from(text.normalize("NFC")).length;
export const displayText = (text: string, self = "사용자", favorite = "최애") => text.replace(/\{\{(USER|FAVORITE)\}\}/g, (_match, person: string) => person === "USER" ? self : favorite);

type ReadingInput = ReturnType<typeof readingInput>;
type DisplayLengthInput = Pick<ReadingInput, "name_lengths">;

export function countDisplayedText(text: string, input?: DisplayLengthInput) {
  const lengths = nameLengthsSchema.parse(input?.name_lengths ?? DEFAULT_NAME_LENGTHS);
  return countText(displayText(text, "가".repeat(lengths.self), "나".repeat(lengths.favorite)));
}

export function displayedBodyLength(section: ReportSection, input?: DisplayLengthInput) {
  return section.paragraphs.reduce((total, paragraph) => total + countDisplayedText(paragraph, input), 0);
}

const normalizeCopy = (text: string) => text.normalize("NFC").replace(/\s+/gu, " ").trim();
const sentences = (text: string) => text.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [];
const evidenceLabelPattern = /[갑을병정무기경신임계자축인묘진사오미유술해]·[갑을병정무기경신임계자축인묘진사오미유술해]\s+(?:육합|상생|비화|상극|합|충|형|해|파)/gu;
const calendarPattern = /\d{4}\s*(?:년|[-/.]\s*\d{1,2})|\d{1,2}\s*(?:월|일)(?!주)|올해|내년|내후년|금년|내달|이달|(?:이번|다음|오는)\s*(?:달|해)|(?:올|내년|지난)(?:봄|여름|가을|겨울)/u;
const seasonPattern = /(?:^|[\s,.;:!?‘’“”'"])(?:봄|여름|가을|겨울)(?:철|날|무렵|부터|까지|에는|이면|에도|에|의|을|이|과|마다|중|은)?(?=$|[\s,.;:!?‘’“”'"])/u;
const unsupportedAstrologyPattern = /용신|희신|기신|십신|십성|원진|귀문|합화|삼합|방합|천을귀인|도화살|홍염살|역마살|백호살|양인살|괴강살|공망|대운|세운|월운|신강|신약|격국|통근|투간|지장간|십이운성|정관|편관|정재|편재|정인|편인|식신|겁재|비견/u;
const unsupportedDeficiencyPattern = /(?:오행|타고난 기운|명식)[^.!?]{0,50}(?:부족|결핍|보충|보완)|(?:목|화|토|금|수)(?:의 기운| 기운)[^.!?]{0,20}(?:부족|결핍)|[‘'](?:목|화|토|금|수)[’'][^.!?]{0,10}(?:부족|결핍)/u;

function hasReciprocalAffectionClaim(text: string) {
  return sentences(text).some(sentence => {
    // These are targeted warning patterns, not a proof that all prose is grounded.
    const deniesKnowledge = /(?:알|단정할|확인할|예측할|판단할|보장할)\s*수\s*없|(?:뜻|의미)하지\s*않|(?:호감|사랑|감정|관계)[^.!?]{0,12}(?:아니|없)|(?:말|서술|주장)하지\s*않/u.test(sentence);
    if (deniesKnowledge) return false;
    return /최애\s*님(?:은|는|이|가|도|께서)[^.!?]{0,40}(?:사용자\s*님|팬(?:들)?)(?:에게|을|를|에\s*대한|이|만|과)[^.!?]{0,30}(?:호감|좋아|사랑|필요|그리워|기다리|보고\s*싶)/u.test(sentence)
      || /최애(?:\s*님)?(?:의)?\s*마음(?:은|이|도)[^.!?]{0,30}(?:사용자\s*님|팬(?:들)?)(?:을|를|에게)[^.!?]{0,15}(?:향|있|열)/u.test(sentence)
      || /서로(?:가|를|에게)?\s*(?:깊은\s*|강한\s*)?(?:호감(?:을)?\s*(?:느끼|나누|품)|사랑(?:하게|\s*하)|좋아(?:하게|하)|필요로\s*하)/u.test(sentence);
  });
}

export function validateSection(section: ReportSection, input: ReadingInput) {
  const errors: string[] = [];
  const fail = (error: string) => errors.push(`${section.id}:${error}`);
  const paragraphs = section.paragraphs.map(p => displayText(p));
  const body = paragraphs.join("");
  const length = displayedBodyLength(section, input);
  const titleLength = countText(section.title);
  if (section.id < 1 || section.id > 8) fail("section_id");
  if (titleLength < 35 || titleLength > 45) fail(`title_length=${titleLength}`);
  const expectedTitleEnd = [2, 5].includes(section.id) ? /기니!$/u : /기니$/u;
  const expectedPunctuation = [2, 5].includes(section.id) ? 1 : 0;
  if ((section.title.match(/기니/gu) ?? []).length !== 1
    || (section.title.match(/,/gu) ?? []).length !== 1
    || (section.title.match(/[!?]/gu) ?? []).length !== expectedPunctuation
    || /[\r\n]/u.test(section.title)
    || /\s기니[!?]?$/u.test(section.title)
    || !expectedTitleEnd.test(section.title)) fail("title_style");
  if (length < 700 || length > 750) fail(`body_length=${length}`);
  if (paragraphs.some(p => /[\r\n]/u.test(p))) fail("paragraph_break");
  if (paragraphs.some(p => !/[.!?]$/u.test(p.trim()))) fail("unfinished_sentence");
  if (/[{}]/u.test(body)) fail("broken_placeholder");
  if (/[{}]/u.test(section.title)) fail("title_placeholder");
  if (/\p{Extended_Pictographic}/u.test(section.title + body)) fail("emoji");
  if (/[\p{Script=Han}]/u.test(section.title + body)) fail("hanja");
  if (/기니|당신|(?:^|\s)그대(?:는|가|를|의|에게|여|와|도)?(?:\s|[,.!?]|$)|그 사람|운명적으로|반드시.*(?:만나|돌아|탈덕)/u.test(body)) fail("forbidden_style");
  if (/[가-힣]니다(?:[.!?]|\s|$)|(?:입니까|습니까)[.!?]?/u.test(body)) fail("formal_register");
  const firstParagraph = section.paragraphs[0] ?? "";
  if (!firstParagraph.includes("{{USER}} 님") || !firstParagraph.includes("{{FAVORITE}} 님")) fail("names");

  const evidenceById = new Map(input.evidence.map(e => [e.id, e]));
  const selectedIds = new Set(section.evidence_ids);
  if (section.evidence_ids.some(id => !evidenceById.has(id))
    || selectedIds.size !== section.evidence_ids.length
    || selectedIds.size < Math.min(2, evidenceById.size)) fail("evidence");
  const selectedLabels = new Set<string>();
  for (const id of selectedIds) {
    const evidence = evidenceById.get(id);
    if (!evidence) continue;
    selectedLabels.add(evidence.label);
    if (!body.includes(evidence.label)) fail(`evidence_label=${id}`);
  }
  if ((body.match(evidenceLabelPattern) ?? []).some(label => !selectedLabels.has(label))) fail("unlisted_evidence_label");

  const allText = `${section.title} ${body}`;
  if (section.flow_ids.length || (input.yearly_flow.length === 0 && (calendarPattern.test(allText) || seasonPattern.test(allText)))) fail("ungrounded_time");
  if (unsupportedAstrologyPattern.test(allText) || unsupportedDeficiencyPattern.test(allText)) fail("unsupported_astrology");
  if (hasReciprocalAffectionClaim(body)) fail("reciprocal_affection");
  if (section.id === 5) {
    if (!body.includes(input.compatibility_type)) fail("compatibility_type");
    for (const axis of AXES) {
      if (!body.includes(axis) || !body.includes(input.axis_meanings[axis])) fail(`axis_meaning=${axis}`);
    }
  }
  if (section.id === 7) {
    const firstSentence = sentences(paragraphs[0] ?? "")[0] ?? "";
    if (!/상상|가상/u.test(firstSentence) || /(?:상상|가상)(?:의)?\s*(?:이\s*)?아니/u.test(firstSentence)) fail("hypothetical");
  }
  return errors;
}

export function validateReport(report: Report, input: ReadingInput) {
  const errors: string[] = [];
  const paragraphOwners = new Map<string, number>();
  const sentenceOwners = new Map<string, number>();
  report.sections.forEach((section, index) => {
    if (section.id !== index + 1) errors.push(`${index + 1}:order`);
    errors.push(...validateSection(section, input));
    for (const paragraph of section.paragraphs) {
      const copy = normalizeCopy(displayText(paragraph));
      const owner = paragraphOwners.get(copy);
      if (copy && owner !== undefined && owner !== section.id) errors.push(`${section.id}:duplicate_paragraph_with=${owner}`);
      else if (copy) paragraphOwners.set(copy, section.id);
      for (const sentence of sentences(copy)) {
        const normalized = normalizeCopy(sentence);
        if (countText(normalized) < 30) continue;
        const sentenceOwner = sentenceOwners.get(normalized);
        if (sentenceOwner !== undefined) errors.push(`${section.id}:repeated_sentence_with=${sentenceOwner}`);
        else sentenceOwners.set(normalized, section.id);
      }
    }
  });
  const punctuation = report.sections.filter(s => /[!?]$/.test(s.title)).length;
  if (punctuation !== 2) errors.push("title_punctuation_count");
  if (!report.limitations.includes("NO_YEARLY_FLOW")) errors.push("missing_time_limitation");
  if ((input.coverage.self === "3주" || input.coverage.favorite === "3주") && !report.limitations.includes("THREE_PILLARS_ONLY")) errors.push("missing_hour_limitation");
  return [...new Set(errors)];
}
