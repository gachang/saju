export type Calendar = "solar" | "lunar";

export type Meridiem = "AM" | "PM";

export type Person = {
  name: string;
  gender: "" | "male" | "female";
  year: string;
  month: string;
  day: string;
  /** What the birth-date field shows; `year`/`month`/`day` hold the parsed result. */
  birthDateText: string;
  calendar: Calendar;
  /** 24-hour `HH:MM`, derived from the 12-hour fields below. Empty until they resolve. */
  birthTime: string;
  birthHour: string;
  birthMinute: string;
  meridiem: Meridiem;
  timeUnknown: boolean;
  isLeapMonth: boolean;
};

export type FormState = {
  self: Person;
  partner: Person;
  /** Idol group of the 상대방, used to sharpen the reading. */
  groupName: string;
};

export const emptyPerson: Person = {
  name: "",
  gender: "female",
  year: "",
  month: "",
  day: "",
  birthDateText: "",
  calendar: "solar",
  birthTime: "",
  birthHour: "",
  birthMinute: "",
  meridiem: "AM",
  timeUnknown: false,
  isLeapMonth: false,
};

export const emptyForm: FormState = {
  self: { ...emptyPerson },
  partner: { ...emptyPerson },
  groupName: "",
};

export function createInitialForm(): FormState {
  return {
    self: { ...emptyPerson },
    partner: { ...emptyPerson },
    groupName: "",
  };
}

export const GENDERS = [
  { value: "male", label: "남자" },
  { value: "female", label: "여자" },
] as const;

const CURRENT_YEAR = new Date().getFullYear();

export const YEARS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 },
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

/**
 * `YYYYMMDD` or `YYMMDD`, with any mix of the separators people actually type
 * (`2001.01.11`, `01-01-11`, `2001 01 11`) tolerated between the groups.
 */
const BIRTH_DATE_PATTERN = /^(\d{4}|\d{2})[\s/.,-]*(\d{2})[\s/.,-]*(\d{2})$/;

/** Anything outside this set means the person typed something that is not a number. */
const BIRTH_DATE_ALLOWED_CHARS = /^[\d\s/.,-]*$/;

export type BirthDateParts = { year: string; month: string; day: string };

export function hasOnlyBirthDateChars(raw: string): boolean {
  return BIRTH_DATE_ALLOWED_CHARS.test(raw);
}

export function birthDateDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

/**
 * Two-digit years land in the hundred-year window ending today, so at 2026 a
 * `20` reads as 2020 rather than 1920 while a `30` still reads as 1930.
 */
export function resolveTwoDigitYear(shortYear: number, today = new Date()): number {
  const earliest = today.getFullYear() - 100;
  const candidate = 1900 + shortYear;
  return candidate <= earliest ? candidate + 100 : candidate;
}

export function parseBirthDateInput(raw: string, today = new Date()): BirthDateParts | null {
  const match = BIRTH_DATE_PATTERN.exec(raw.trim());
  if (!match) return null;

  const [, rawYear, rawMonth, rawDay] = match;
  const year = rawYear.length === 4 ? Number(rawYear) : resolveTwoDigitYear(Number(rawYear), today);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year: String(year), month: String(month), day: String(day) };
}

export function formatBirthDate({ year, month, day }: BirthDateParts): string {
  return `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`;
}

/** Folds the 시/분/AM·PM fields into the 24-hour string the engine reads. */
export function to24HourTime(hour: string, minute: string, meridiem: Meridiem): string {
  if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute)) return "";

  const h = Number(hour);
  const m = Number(minute);
  if (h < 1 || h > 12 || m > 59) return "";

  const h24 = meridiem === "AM" ? h % 12 : (h % 12) + 12;
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isBirthDateValid(p: Person): boolean {
  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return false;

  const now = new Date();
  const today = Number(
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`,
  );
  const birthDate = Number(`${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`);
  return birthDate <= today;
}

export function isPersonComplete(p: Person): boolean {
  return Boolean(p.name.trim()) && isBirthDateValid(p) && Boolean(p.timeUnknown || p.birthTime);
}
