import { getHeavenlyStemElement, type HeavenlyStem } from "manseryeok";
import { z } from "zod";
import { chartSchema, type Chart } from "./engine";

export const AXES = ["끌림", "소통", "안정", "성장", "덕질 텐션"] as const;
export const RULES_VERSION = "compat-v1.0-core";
export const pairSchema = z.object({ self: chartSchema, favorite: chartSchema }).strict();
export type ChartPair = z.infer<typeof pairSchema>;
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

export function readingInput(pair: ChartPair, today = new Date().toISOString().slice(0, 10)) {
  const computed = compatibility(pair);
  return { ...computed, today, coverage: { self: pair.self.hour ? "4주" : "3주", favorite: pair.favorite.hour ? "4주" : "3주", scoring: "연·월·일주만 사용", convention: "선택된 명식 · 시주는 점수 미반영" },
    yearly_flow: [], section_plan: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, evidence_ids: computed.evidence.map(e => e.id), flow_ids: [] })) };
}

export function toPair(self: Chart, favorite: Chart): ChartPair { return pairSchema.parse({ self, favorite }); }
