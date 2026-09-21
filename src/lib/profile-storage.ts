import { z } from "zod";
import { emptyPerson, type Person } from "./saju";

const STORAGE_KEY = "saju:self-profile:v1";

const storedPersonSchema = z.object({
  name: z.string().max(12),
  gender: z.enum(["", "male", "female"]),
  year: z.string(),
  month: z.string(),
  day: z.string(),
  birthDateText: z.string(),
  calendar: z.enum(["solar", "lunar"]),
  birthTime: z.string(),
  birthHour: z.string(),
  birthMinute: z.string(),
  meridiem: z.enum(["AM", "PM"]),
  timeUnknown: z.boolean(),
  isLeapMonth: z.boolean(),
});

/** Remembers the 본인 side so a repeat visit does not retype the same birth data. */
export function saveSelfProfile(person: Person): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(person));
  } catch {
    // Private-mode or a full quota just means no autofill next time.
  }
}

export function loadSelfProfile(): Person | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = storedPersonSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { ...emptyPerson, ...parsed.data };
  } catch {
    return null;
  }
}

export function clearSelfProfile(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to recover from; the stale entry is overwritten on the next save.
  }
}
