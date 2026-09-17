import { getEarthlyBranchElement, getHeavenlyStemElement, type EarthlyBranch, type HeavenlyStem } from "manseryeok";
import { z } from "zod";
import { chartSchema, type Chart } from "./engine";

export const AXES = ["끌림", "소통", "안정", "성장", "덕질 텐션"] as const;
export const AXIS_MEANINGS: Record<typeof AXES[number], string> = {
  끌림: "관심이 시작되는 지점", 소통: "표현 차이를 이해하는 방식", 안정: "편안한 감상 리듬",
  성장: "취향을 넓히는 계기", "덕질 텐션": "몰입과 활력의 정도",
};
export const RULES_VERSION = "compat-v1.0-core";
export const pairSchema = z.object({ self: chartSchema, favorite: chartSchema }).strict();
export type ChartPair = z.infer<typeof pairSchema>;
export const nameLengthsSchema = z.object({
  self: z.number().int().min(1).max(12),
  favorite: z.number().int().min(1).max(12),
}).strict();
export type NameLengths = z.infer<typeof nameLengthsSchema>;
export const DEFAULT_NAME_LENGTHS: NameLengths = { self: 3, favorite: 2 };
type FiveElement = "목" | "화" | "토" | "금" | "수";

const STEM_IMAGES: Record<HeavenlyStem, string> = {
  갑: "곧게 뻗어 방향을 세우는 큰 나무 같은 갑목",
  을: "유연하게 감각을 잇는 풀과 꽃 같은 을목",
  병: "밝고 빠르게 온기를 퍼뜨리는 태양 같은 병화",
  정: "작지만 오래 집중하는 등불 같은 정화",
  무: "넓고 단단하게 중심을 잡는 산 같은 무토",
  기: "세심하게 품고 길러 내는 밭흙 같은 기토",
  경: "결단력 있게 모양을 다듬는 쇠 같은 경금",
  신: "섬세하고 냉철하게 빛을 고르는 보석 같은 신금",
  임: "크게 흐르며 판을 넓히는 바다 같은 임수",
  계: "조용히 스며들어 감각을 적시는 이슬비 같은 계수",
};

const MONTH_CLIMATES: Record<EarthlyBranch, { climate_type: string; description: string; temperature: number; moisture: number }> = {
  자: { climate_type: "한습", description: "찬 수기가 깊고 습기가 강한 자월", temperature: -2, moisture: 2 },
  축: { climate_type: "한습", description: "차갑고 축축한 기운이 남아 있는 축월", temperature: -2, moisture: 1 },
  인: { climate_type: "온조", description: "찬 기운이 풀리며 목의 생기가 오르는 인월", temperature: 0, moisture: 0 },
  묘: { climate_type: "온윤", description: "부드럽고 촉촉한 목 기운이 왕성한 묘월", temperature: 1, moisture: 1 },
  진: { climate_type: "온습", description: "온기와 습기가 함께 머무는 진월", temperature: 1, moisture: 1 },
  사: { climate_type: "조열", description: "열기가 오르고 건조함이 시작되는 사월", temperature: 2, moisture: -1 },
  오: { climate_type: "조열", description: "화기가 가장 뜨겁고 건조하게 치솟는 오월", temperature: 2, moisture: -2 },
  미: { climate_type: "조열", description: "뜨거운 토 기운과 건조함이 남아 있는 미월", temperature: 2, moisture: -1 },
  신: { climate_type: "양조", description: "열기가 가라앉고 금 기운이 서늘해지는 신월", temperature: 0, moisture: -1 },
  유: { climate_type: "양조", description: "차고 건조한 금 기운이 선명한 유월", temperature: -1, moisture: -2 },
  술: { climate_type: "한조", description: "건조한 토 기운과 서늘함이 깊어지는 술월", temperature: -1, moisture: -2 },
  해: { climate_type: "한습", description: "찬 수기가 차오르며 습기가 늘어나는 해월", temperature: -2, moisture: 2 },
};

const GENERATES: Record<FiveElement, FiveElement> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CONTROLS: Record<FiveElement, FiveElement> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

function visibleElementCounts(chart: ChartPair["self"]) {
  const counts: Record<FiveElement, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const position of ["year", "month", "day"] as const) {
    const pillar = chart[position];
    counts[getHeavenlyStemElement(pillar[0] as HeavenlyStem)] += 1;
    counts[getEarthlyBranchElement(pillar[1] as EarthlyBranch)] += 1;
  }
  return counts;
}

function manseProfile(chart: ChartPair["self"]) {
  const dayStem = chart.day[0] as HeavenlyStem;
  const monthBranch = chart.month[1] as EarthlyBranch;
  const dayElement = getHeavenlyStemElement(dayStem) as FiveElement;
  return {
    day_master: { stem: dayStem, element: dayElement, label: `${dayStem}${dayElement}`, image: STEM_IMAGES[dayStem] },
    month_climate: { branch: monthBranch, label: `${monthBranch}월`, ...MONTH_CLIMATES[monthBranch] },
    visible_elements: visibleElementCounts(chart),
    scope: "연주·월주·일주에 겉으로 드러난 여섯 글자만 요약함",
  };
}

function dayMasterFlow(self: ReturnType<typeof manseProfile>, favorite: ReturnType<typeof manseProfile>) {
  const a = self.day_master, b = favorite.day_master;
  if (a.element === b.element) return `{{USER}} 님의 ${a.label}과 {{FAVORITE}} 님의 ${b.label}은 같은 ${a.element} 기운이라 기본 결이 닮지만, 자기 방식이 굳으면 고집이 맞부딪힐 수 있어요.`;
  if (GENERATES[a.element] === b.element) return `{{USER}} 님의 ${a.label}이 {{FAVORITE}} 님의 ${b.label}을 북돋는 흐름이라, 한쪽의 표현이 다른 쪽의 매력을 살리는 관계로 풀 수 있어요.`;
  if (GENERATES[b.element] === a.element) return `{{FAVORITE}} 님의 ${b.label}이 {{USER}} 님의 ${a.label}을 북돋는 흐름이라, 한쪽의 차분한 반응이 다른 쪽의 몰입을 키우는 관계로 풀 수 있어요.`;
  if (CONTROLS[a.element] === b.element) return `{{USER}} 님의 ${a.label}이 {{FAVORITE}} 님의 ${b.label}을 다듬는 관계라, 매력은 선명하지만 기준을 강요하면 부담이 될 수 있어요.`;
  return `{{FAVORITE}} 님의 ${b.label}이 {{USER}} 님의 ${a.label}을 다듬는 관계라, 서로의 다른 기준을 존중할 때 장점이 살아나요.`;
}

function climateFlow(self: ReturnType<typeof manseProfile>, favorite: ReturnType<typeof manseProfile>) {
  const a = self.month_climate, b = favorite.month_climate;
  if (a.temperature >= 1 && b.temperature <= -1) return `{{USER}} 님 쪽 ${a.label}의 뜨거운 기운을 {{FAVORITE}} 님 쪽 ${b.label}의 서늘함이 식혀 주고, 반대로 차가운 결은 따뜻한 온기가 풀어 주는 보완으로 읽을 수 있어요.`;
  if (b.temperature >= 1 && a.temperature <= -1) return `{{FAVORITE}} 님 쪽 ${b.label}의 뜨거운 기운을 {{USER}} 님 쪽 ${a.label}의 서늘함이 식혀 주고, 반대로 차가운 결은 따뜻한 온기가 풀어 주는 보완으로 읽을 수 있어요.`;
  if (a.temperature >= 1 && b.temperature >= 1) return `두 월지 모두 온도가 높은 편이라 몰입은 빠르지만 열기가 한꺼번에 오르면 기대와 피로도 함께 커질 수 있어요.`;
  if (a.temperature <= -1 && b.temperature <= -1) return `두 월지 모두 서늘한 편이라 감상을 오래 지켜보기 좋지만, 표현을 아끼면 거리감으로 보일 수 있어요.`;
  return `두 월지의 온도 차가 크지 않아 편안하게 호흡을 맞추기 좋고, 건조함과 습도의 차이를 말과 휴식으로 조율하면 좋아요.`;
}
type Kind = "합" | "상생" | "비화" | "상극" | "육합" | "충" | "형" | "해" | "파";
type Rule = { meaning: string; delta: [number, number, number, number, number] };
const rules: Record<Kind, Rule> = {
  합: { meaning: "다른 표현 방식에서 관심을 느끼는 장면의 비유", delta: [20, 12, 8, 8, 15] },
  상생: { meaning: "서로 다른 역할을 이어 주는 장면의 비유", delta: [8, 12, 12, 20, 8] },
  비화: { meaning: "닮은 리듬에서 친숙함을 느끼는 장면의 비유", delta: [5, 15, 15, 5, 8] },
  상극: { meaning: "서로 다른 속도와 기대를 조절하는 장면의 비유", delta: [8, -12, -10, 12, 15] },
  육합: { meaning: "취향을 나란히 놓고 편안하게 감상하는 장면의 비유", delta: [15, 15, 18, 8, 10] },
  충: { meaning: "서로 다른 리듬에서 자극과 휴식의 균형을 찾는 비유", delta: [12, -15, -20, 12, 20] },
  형: { meaning: "기대가 굳어질 때 자기 기준을 점검하는 비유", delta: [0, -8, -10, 8, 5] },
  해: { meaning: "작은 기대 차이를 알아차리고 거리 조절하는 비유", delta: [0, -10, -8, 5, 5] },
  파: { meaning: "익숙한 감상 습관을 유연하게 바꾸는 비유", delta: [3, -5, -8, 10, 8] },
};
const branchPairs: Partial<Record<Kind, string[]>> = {
  육합: ["자축", "인해", "묘술", "진유", "사신", "오미"],
  충: ["자오", "축미", "인신", "묘유", "진술", "사해"],
  형: ["자묘", "진진", "오오", "유유", "해해"],
  해: ["자미", "축오", "인사", "묘진", "신해", "유술"],
  파: ["자유", "축진", "인해", "묘오", "사신", "미술"],
};
const matches = (pairs: string[], a: string, b: string) => pairs.includes(a + b) || pairs.includes(b + a);
export type Evidence = { id: string; label: string; participants: string; meaning: string; allowed_claims: string[] };
export function compatibility(pair: ChartPair) {
  const scores = [50, 50, 50, 50, 50];
  const evidence: Evidence[] = [];
  const add = (position: "year" | "month" | "day", kind: Kind, a: string, b: string, weight: number) => {
    const rule = rules[kind];
    const names = { year: "연주", month: "월주", day: "일주" };
    evidence.push({ id: `${position}-${kind}-${a}${b}`, label: `${a}·${b} ${kind}`,
      participants: `사용자 ${names[position]}와 최애 ${names[position]}`,
      meaning: rule.meaning, allowed_claims: [rule.meaning, "실제 성격·상호 감정·미래 사건을 뜻하지 않음"] });
    rule.delta.forEach((d, i) => scores[i] += d * weight);
  };
  for (const [position, weight] of [["year", .2], ["month", .3], ["day", .5]] as const) {
    const a = pair.self[position], b = pair.favorite[position];
    const ae = getHeavenlyStemElement(a[0] as HeavenlyStem), be = getHeavenlyStemElement(b[0] as HeavenlyStem);
    const cycle = ["목", "화", "토", "금", "수"];
    const distance = (cycle.indexOf(ae) - cycle.indexOf(be) + 5) % 5;
    add(position, ae === be ? "비화" : distance === 1 || distance === 4 ? "상생" : "상극", a[0], b[0], weight);
    if (matches(["갑기", "을경", "병신", "정임", "무계"], a[0], b[0])) add(position, "합", a[0], b[0], weight);
    for (const [kind, pairs] of Object.entries(branchPairs)) {
      if (matches(pairs, a[1], b[1])) add(position, kind as Kind, a[1], b[1], weight);
    }
  }
  const values = scores.map(v => Math.max(0, Math.min(100, Math.round(v))));
  const highest = AXES[values.indexOf(Math.max(...values))];
  const lowest = AXES[values.indexOf(Math.min(...values))];
  return { rules_version: RULES_VERSION, scores: Object.fromEntries(AXES.map((a, i) => [a, values[i]])) as Record<typeof AXES[number], number>,
    compatibility_type: `${highest} 중심 · ${lowest} 조율형`, evidence };
}

export function compatibilityScore(computed: ReturnType<typeof compatibility>) {
  return Math.round(AXES.reduce((sum, axis) => sum + computed.scores[axis], 0) / AXES.length);
}

export function readingInput(pair: ChartPair, today = new Date().toISOString().slice(0, 10), nameLengths: NameLengths = DEFAULT_NAME_LENGTHS) {
  const computed = compatibility(pair);
  const selfProfile = manseProfile(pair.self), favoriteProfile = manseProfile(pair.favorite);
  return { ...computed, axis_meanings: AXIS_MEANINGS,
    manse_profiles: { self: selfProfile, favorite: favoriteProfile },
    manse_pair: { day_master_flow: dayMasterFlow(selfProfile, favoriteProfile), climate_flow: climateFlow(selfProfile, favoriteProfile) },
    name_lengths: nameLengthsSchema.parse(nameLengths), today, coverage: { self: pair.self.hour ? "4주" : "3주", favorite: pair.favorite.hour ? "4주" : "3주", scoring: "연·월·일주만 사용", convention: "선택된 명식 · 시주는 점수 미반영" },
    yearly_flow: [], section_plan: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, evidence_ids: computed.evidence.map(e => e.id), flow_ids: [] })) };
}

export function toPair(self: Chart, favorite: Chart): ChartPair { return pairSchema.parse({ self, favorite }); }
