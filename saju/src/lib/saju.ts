export type Calendar = "solar" | "lunar";

export type Person = {
  name: string;
  gender: "" | "male" | "female";
  year: string;
  month: string;
  day: string;
  calendar: Calendar;
  birthTime: string;
  timeUnknown: boolean;
};

export type FormState = {
  self: Person;
  partner: Person;
  /** Idol group of the 상대방, used to sharpen the reading. */
  groupName: string;
};

export const emptyPerson: Person = {
  name: "",
  gender: "",
  year: "",
  month: "",
  day: "",
  calendar: "solar",
  birthTime: "",
  timeUnknown: false,
};

export const emptyForm: FormState = {
  self: { ...emptyPerson },
  partner: { ...emptyPerson },
  groupName: "",
};

export const GENDERS = [
  { value: "male", label: "남자" },
  { value: "female", label: "여자" },
] as const;

const CURRENT_YEAR = new Date().getFullYear();

export const YEARS = Array.from(
  { length: CURRENT_YEAR - 1930 + 1 },
  (_, i) => String(CURRENT_YEAR - i),
);

export const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));

/** Days in the selected month, falling back to 31 until a month is picked. */
export function daysInMonth(year: string, month: string): string[] {
  const y = Number(year);
  const m = Number(month);
  const count = y && m ? new Date(y, m, 0).getDate() : 31;
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

/**
 * The twelve traditional 시진 that saju readings are keyed on. Labels stay
 * short because the select sits in a ~180px column.
 */
export const BIRTH_TIMES = [
  { value: "子", label: "자시 23–01시" },
  { value: "丑", label: "축시 01–03시" },
  { value: "寅", label: "인시 03–05시" },
  { value: "卯", label: "묘시 05–07시" },
  { value: "辰", label: "진시 07–09시" },
  { value: "巳", label: "사시 09–11시" },
  { value: "午", label: "오시 11–13시" },
  { value: "未", label: "미시 13–15시" },
  { value: "申", label: "신시 15–17시" },
  { value: "酉", label: "유시 17–19시" },
  { value: "戌", label: "술시 19–21시" },
  { value: "亥", label: "해시 21–23시" },
] as const;

/** Bottom-of-screen decoration from the design: the 오행 생극 cycles. */
export const SANGSAENG = ["金生水", "水生木", "木生火", "火生土", "土生金"];
export const SANGGEUK = ["金克木", "木克土", "土克水", "水克火", "火克金"];

export function isPersonComplete(p: Person): boolean {
  return Boolean(
    p.name.trim() &&
      p.gender &&
      p.year &&
      p.month &&
      p.day &&
      (p.timeUnknown || p.birthTime),
  );
}
