import { calculateFourPillars, lunarToSolar, type BirthInfo } from "manseryeok";
import { z } from "zod";

export const pillarSchema = z.string().regex(/^[갑을병정무기경신임계][자축인묘진사오미신유술해]$/).refine(p => "갑을병정무기경신임계".indexOf(p[0]) % 2 === "자축인묘진사오미신유술해".indexOf(p[1]) % 2, "Invalid sexagenary pillar");
export const chartSchema = z.object({
  year: pillarSchema, month: pillarSchema, day: pillarSchema,
  hour: pillarSchema.nullable(),
}).strict();
export type Chart = z.infer<typeof chartSchema>;
export type BirthInput = Omit<BirthInfo, "hour" | "minute" | "gender"> & {
  hour?: number; minute?: number;
};
export type ChartResult = { variants: Chart[]; coverage: "4주" | "3주" | "복수 명식"; convention: string };

/** Computation runs in the browser; raw birth inputs never enter the copy API. */
export function calculateChart(input: BirthInput): ChartResult {
  if (input.year < 1900 || input.year > new Date().getFullYear()) throw new RangeError("지원하는 출생 연도를 확인해 주세요.");
  if (input.isLeapMonth && !input.isLunar) throw new RangeError("윤달은 음력에서만 선택해 주세요.");
  if (input.minute !== undefined && input.hour === undefined) throw new RangeError("출생 시와 분을 함께 입력해 주세요.");
  const solar = input.isLunar ? lunarToSolar(input.year, input.month, input.day, !!input.isLeapMonth) : input;
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const day = `${solar.year}-${String(solar.month).padStart(2, "0")}-${String(solar.day).padStart(2, "0")}`;
  if (day > today) throw new RangeError("미래의 출생일은 입력할 수 없어요.");
  const boundary = input.dayBoundary ?? "midnight";
  const make = (hour: number, minute: number): Chart => {
    const p = calculateFourPillars({ ...input, hour, minute, dayBoundary: boundary }).toObject();
    return { ...p, hour: input.hour === undefined ? null : p.hour };
  };
  // Examine every possible minute, including solar-time date changes and jasi boundaries.
  const variants = input.hour === undefined
    ? [...new Map(Array.from({ length: 1440 }, (_, n) => {
        const chart = make(Math.floor(n / 60), n % 60);
        return [JSON.stringify(chart), chart] as const;
      })).values()]
    : [make(input.hour, input.minute ?? 0)];
  return {
    variants,
    coverage: variants.length > 1 ? "복수 명식" : input.hour === undefined ? "3주" : "4주",
    convention: `${input.trueSolarTime ? "진태양시" : "보정 없는 KST"} · ${boundary}`,
  };
}
