"use client";

import { useState } from "react";
import { FieldError, FieldLabel, Segment, controlClass, invalidControlClass } from "./controls";
import {
  birthDateDigits,
  formatBirthDate,
  hasOnlyBirthDateChars,
  isBirthDateValid,
  parseBirthDateInput,
  to24HourTime,
  type Meridiem,
  type Person,
} from "@/lib/saju";

type Props = {
  /** Namespaces the error ids so both forms can coexist in the DOM. */
  idPrefix: string;
  /** Who the fields describe, used for the screen-reader labels. */
  subject: string;
  person: Person;
  onChange: (patch: Partial<Person>) => void;
  showErrors: boolean;
};

const clearedDate = { year: "", month: "", day: "" };

export function PersonFields({ idPrefix, subject, person, onChange, showErrors }: Props) {
  const [nonNumericDate, setNonNumericDate] = useState(false);

  const nameInvalid = showErrors && !person.name.trim();
  const dateInvalid = showErrors && !isBirthDateValid(person);
  const timeInvalid = showErrors && !person.timeUnknown && !person.birthTime;

  function editBirthDate(raw: string) {
    setNonNumericDate(!hasOnlyBirthDateChars(raw));
    const digits = birthDateDigits(raw);
    onChange({ birthDateText: digits, ...(parseBirthDateInput(digits) ?? clearedDate) });
  }

  /** Once the field loses focus the accepted digits settle into `YYYY.MM.DD`. */
  function normalizeBirthDate() {
    const parts = parseBirthDateInput(person.birthDateText);
    if (parts) onChange({ birthDateText: formatBirthDate(parts), ...parts });
  }

  function editTime(patch: { birthHour?: string; birthMinute?: string; meridiem?: Meridiem }) {
    const next = {
      birthHour: person.birthHour,
      birthMinute: person.birthMinute,
      meridiem: person.meridiem,
      ...patch,
    };
    onChange({ ...next, birthTime: to24HourTime(next.birthHour, next.birthMinute, next.meridiem) });
  }

  const timeFieldClass = `${controlClass} ${person.timeUnknown ? "opacity-45" : ""} ${
    timeInvalid ? invalidControlClass : ""
  }`;

  return (
    <>
      <div>
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <FieldLabel invalid={nameInvalid}>이름</FieldLabel>
            <input
              className={`${controlClass} mt-2 ${nameInvalid ? invalidControlClass : ""}`}
              value={person.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="김기니"
              maxLength={12}
              autoComplete="off"
              required
              aria-invalid={nameInvalid || undefined}
              aria-describedby={nameInvalid ? `${idPrefix}-name-error` : undefined}
            />
          </label>
          <div
            role="radiogroup"
            aria-label="성별"
            className="flex h-[50px] w-[118px] shrink-0 gap-1 rounded-[14px] bg-[#001e3b] p-1"
          >
            <Segment selected={person.gender === "female"} onClick={() => onChange({ gender: "female" })}>
              여자
            </Segment>
            <Segment selected={person.gender === "male"} onClick={() => onChange({ gender: "male" })}>
              남자
            </Segment>
          </div>
        </div>
        {nameInvalid && <FieldError id={`${idPrefix}-name-error`}>이름을 입력해 주세요.</FieldError>}
      </div>

      <div>
        <FieldLabel hint="숫자 8글자를 적어주세요" invalid={dateInvalid || nonNumericDate}>
          생년월일
        </FieldLabel>
        <div
          role="radiogroup"
          aria-label="양력 음력"
          className="mt-2 flex h-[50px] w-full gap-1 rounded-[14px] bg-[#001e3b] p-1"
        >
          <Segment
            selected={person.calendar === "solar"}
            onClick={() => onChange({ calendar: "solar", isLeapMonth: false })}
          >
            양력
          </Segment>
          <Segment selected={person.calendar === "lunar"} onClick={() => onChange({ calendar: "lunar" })}>
            음력
          </Segment>
        </div>
        <input
          className={`${controlClass} mt-2 ${dateInvalid || nonNumericDate ? invalidControlClass : ""}`}
          aria-label={`${subject} 생년월일`}
          value={person.birthDateText}
          onChange={(event) => editBirthDate(event.target.value)}
          onBlur={normalizeBirthDate}
          placeholder="2001.01.11"
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={dateInvalid || nonNumericDate || undefined}
          aria-describedby={
            nonNumericDate
              ? `${idPrefix}-birth-date-numeric-error`
              : dateInvalid
                ? `${idPrefix}-birth-date-error`
                : undefined
          }
        />
        {nonNumericDate ? (
          <FieldError id={`${idPrefix}-birth-date-numeric-error`}>숫자만 입력해주세요.</FieldError>
        ) : (
          dateInvalid && (
            <FieldError id={`${idPrefix}-birth-date-error`}>
              오늘보다 이전의 올바른 생년월일을 적어주세요.
            </FieldError>
          )
        )}
        {person.calendar === "lunar" && (
          <button
            type="button"
            role="checkbox"
            aria-checked={person.isLeapMonth}
            onClick={() => onChange({ isLeapMonth: !person.isLeapMonth })}
            className="mt-2 flex items-center gap-2 [font-family:var(--font-diphylleia)] text-[12px] text-[#fcfcf4]/75"
          >
            <span
              className={`grid size-4 place-items-center rounded-[4px] border ${person.isLeapMonth ? "border-[#f3ef9c] bg-[#054787]" : "border-[#faf999]/25 bg-[#001e3b]"}`}
            >
              {person.isLeapMonth ? "✓" : ""}
            </span>
            윤달이에요
          </button>
        )}
      </div>

      <div>
        <FieldLabel hint="정확할수록 좋아요" invalid={timeInvalid}>
          태어난 시각
        </FieldLabel>
        <div className="mt-2 flex gap-2">
          <input
            className={timeFieldClass}
            aria-label={`${subject} 태어난 시`}
            value={person.birthHour}
            onChange={(event) => editTime({ birthHour: event.target.value.replace(/\D/g, "").slice(0, 2) })}
            placeholder="시"
            inputMode="numeric"
            autoComplete="off"
            maxLength={2}
            disabled={person.timeUnknown}
            aria-invalid={timeInvalid || undefined}
            aria-describedby={timeInvalid ? `${idPrefix}-birth-time-error` : undefined}
          />
          <input
            className={timeFieldClass}
            aria-label={`${subject} 태어난 분`}
            value={person.birthMinute}
            onChange={(event) => editTime({ birthMinute: event.target.value.replace(/\D/g, "").slice(0, 2) })}
            placeholder="분"
            inputMode="numeric"
            autoComplete="off"
            maxLength={2}
            disabled={person.timeUnknown}
            aria-invalid={timeInvalid || undefined}
            aria-describedby={timeInvalid ? `${idPrefix}-birth-time-error` : undefined}
          />
          <div
            role="radiogroup"
            aria-label="오전 오후"
            className={`flex h-[52px] w-[118px] shrink-0 gap-1 rounded-[14px] bg-[#001e3b] p-1 ${person.timeUnknown ? "opacity-45" : ""}`}
          >
            <Segment
              selected={person.meridiem === "AM"}
              disabled={person.timeUnknown}
              onClick={() => editTime({ meridiem: "AM" })}
            >
              AM
            </Segment>
            <Segment
              selected={person.meridiem === "PM"}
              disabled={person.timeUnknown}
              onClick={() => editTime({ meridiem: "PM" })}
            >
              PM
            </Segment>
          </div>
        </div>
        {timeInvalid && (
          <FieldError id={`${idPrefix}-birth-time-error`}>
            태어난 시간을 설정하거나 아래의 ‘태어난 시간을 몰라요’를 체크해 주세요.
          </FieldError>
        )}
        <button
          type="button"
          role="checkbox"
          aria-checked={person.timeUnknown}
          onClick={() =>
            onChange({
              timeUnknown: !person.timeUnknown,
              birthTime: "",
              birthHour: "",
              birthMinute: "",
            })
          }
          className={`mt-3 flex items-start gap-2 text-left ${timeInvalid ? "rounded-[10px] bg-[#ff6b6b]/8 px-2 py-1.5" : ""}`}
        >
          <span
            className={`mt-px grid size-5 shrink-0 place-items-center rounded-[5px] border text-[12px] ${person.timeUnknown ? "border-[#f3ef9c] bg-[#054787] text-[#f3ef9c]" : "border-[#faf999]/25 bg-[#001e3b] text-transparent"}`}
          >
            ✓
          </span>
          <span className="[font-family:var(--font-diphylleia)]">
            <span className="block text-[14px] leading-[normal] text-[#fcfcf4]">태어난 시간을 몰라요</span>
            <span className="mt-1 block text-[10px] leading-[1.55] text-[#fcfcf4]/60">
              시주를 빼고 후보를 모두 비교해요.
            </span>
          </span>
        </button>
      </div>
    </>
  );
}
