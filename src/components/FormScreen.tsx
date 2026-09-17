"use client";

import { BrandMark } from "./BrandMark";
import { Backdrop } from "./Backdrop";
import { GoldButton } from "./ui/GoldButton";
import { isPersonComplete, type FormState, type Person } from "@/lib/saju";

type Mode = "self" | "partner";

type Props = {
  mode: Mode;
  value: FormState;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
  submitting: boolean;
};

const controlClass =
  "h-[52px] w-full rounded-[13px] border border-[#faf999]/20 bg-[#001e3b] px-[14px] font-[var(--font-report-sans)] text-[16px] text-[#fcfcf4] outline-none transition-colors placeholder:text-[#fcfcf4]/60 focus:border-[#faf999]/60";

function Segment({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex h-[42px] min-w-0 flex-1 items-center justify-center rounded-[10px] font-[var(--font-report-sans)] text-[13px] font-bold transition-colors ${
        selected ? "bg-[#054787] text-[#f3ef9c]" : "text-[#fcfcf4]/60"
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-end gap-2 whitespace-nowrap">
      <span className="font-[var(--font-report-score)] text-[16px] leading-[23px] text-[#fcfcf4]">
        {children}
      </span>
      {hint && (
        <span className="pb-px font-[var(--font-report-score)] text-[12px] leading-[17px] text-[#fcfcf4]/60">
          {hint}
        </span>
      )}
    </div>
  );
}

function NativePickerField({
  type,
  label,
  value,
  displayValue,
  disabled,
  min,
  max,
  onChange,
}: {
  type: "date" | "time";
  label: string;
  value: string;
  displayValue: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={`relative mt-2 flex h-[52px] items-center overflow-hidden rounded-[13px] border border-[#faf999]/20 bg-[#001e3b] px-[14px] transition-colors focus-within:border-[#faf999]/60 ${
        disabled ? "opacity-45" : ""
      }`}
    >
      <span className="font-[var(--font-report-sans)] text-[16px] text-[#fcfcf4]/60">
        {displayValue}
      </span>
      <input
        type={type}
        aria-label={label}
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-default"
        value={value}
        disabled={disabled}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function personDate(person: Person) {
  if (!person.year || !person.month || !person.day) return "";
  return `${person.year}-${person.month.padStart(2, "0")}-${person.day.padStart(2, "0")}`;
}

export function FormScreen({
  mode,
  value,
  onChange,
  onSubmit,
  submitting,
}: Props) {
  const key = mode === "self" ? "self" : "partner";
  const person = value[key];
  const patchPerson = (patch: Partial<Person>) =>
    onChange({ ...value, [key]: { ...person, ...patch } });
  const ready = isPersonComplete(person);

  function updateDate(date: string) {
    if (!date) {
      patchPerson({ year: "", month: "", day: "" });
      return;
    }
    const [year, month, day] = date.split("-");
    patchPerson({
      year,
      month: String(Number(month)),
      day: String(Number(day)),
    });
  }

  return (
    <section className="relative h-full overflow-hidden bg-ink" aria-label={mode === "self" ? "본인 정보 입력" : "좋아하는 사람 정보 입력"}>
      <Backdrop />
      <BrandMark className="absolute top-[6.86%] left-1/2 z-10 size-[72px] -translate-x-1/2" />

      <h1 className="absolute inset-x-4 top-[16.48%] z-10 text-center font-hambak text-[24px] leading-[31px] text-white">
        {mode === "self" ? (
          <>
            당신이 태어난
            <br />
            순간을 알려주기니
          </>
        ) : (
          "좋아하는 사람 알려주기니"
        )}
      </h1>

      <form
        className="absolute inset-0 z-10"
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) onSubmit();
        }}
      >
        <div className="absolute inset-x-6 top-[25.4%] flex flex-col gap-5">
          <div className="flex items-end gap-2">
            <label className="min-w-0 flex-1">
              <FieldLabel>이름</FieldLabel>
              <input
                className={`${controlClass} mt-2`}
                value={person.name}
                onChange={(event) => patchPerson({ name: event.target.value })}
                placeholder="김기니"
                maxLength={12}
                autoComplete="off"
              />
            </label>
            <div
              role="radiogroup"
              aria-label="성별"
              className="flex h-[50px] w-[118px] shrink-0 gap-1 rounded-[14px] bg-[#001e3b] p-1"
            >
              <Segment
                selected={person.gender === "female"}
                onClick={() => patchPerson({ gender: "female" })}
              >
                여자
              </Segment>
              <Segment
                selected={person.gender === "male"}
                onClick={() => patchPerson({ gender: "male" })}
              >
                남자
              </Segment>
            </div>
          </div>

          <div>
            <FieldLabel>생년월일</FieldLabel>
            <div
              role="radiogroup"
              aria-label="양력 음력"
              className="mt-2 flex h-[50px] w-full gap-1 rounded-[14px] bg-[#001e3b] p-1"
            >
              <Segment
                selected={person.calendar === "solar"}
                onClick={() =>
                  patchPerson({ calendar: "solar", isLeapMonth: false })
                }
              >
                양력
              </Segment>
              <Segment
                selected={person.calendar === "lunar"}
                onClick={() => patchPerson({ calendar: "lunar" })}
              >
                음력
              </Segment>
            </div>
            <NativePickerField
              type="date"
              label={`${mode === "self" ? "본인" : "좋아하는 사람"} 생년월일`}
              value={personDate(person)}
              displayValue={
                personDate(person)
                  ? personDate(person).replaceAll("-", ".")
                  : "YYYY.MM.DD"
              }
              min="1900-01-01"
              max={`${new Date().getFullYear()}-12-31`}
              onChange={updateDate}
            />
            {person.calendar === "lunar" && (
              <button
                type="button"
                role="checkbox"
                aria-checked={person.isLeapMonth}
                onClick={() => patchPerson({ isLeapMonth: !person.isLeapMonth })}
                className="mt-2 flex items-center gap-2 font-[var(--font-report-score)] text-[12px] text-[#fcfcf4]/75"
              >
                <span className={`grid size-4 place-items-center rounded-[4px] border ${person.isLeapMonth ? "border-[#f3ef9c] bg-[#054787]" : "border-[#faf999]/25 bg-[#001e3b]"}`}>
                  {person.isLeapMonth ? "✓" : ""}
                </span>
                윤달이에요
              </button>
            )}
          </div>

          <div>
            <FieldLabel hint="정확할수록 좋아요">태어난 시각</FieldLabel>
            <NativePickerField
              type="time"
              label={`${mode === "self" ? "본인" : "좋아하는 사람"} 태어난 시각`}
              value={person.birthTime}
              displayValue={person.birthTime || "--:--"}
              disabled={person.timeUnknown}
              onChange={(birthTime) => patchPerson({ birthTime })}
            />
            <button
              type="button"
              role="checkbox"
              aria-checked={person.timeUnknown}
              onClick={() =>
                patchPerson({
                  timeUnknown: !person.timeUnknown,
                  birthTime: "",
                })
              }
              className="mt-3 flex items-start gap-2 text-left"
            >
              <span className={`mt-px grid size-5 shrink-0 place-items-center rounded-[5px] border text-[12px] ${person.timeUnknown ? "border-[#f3ef9c] bg-[#054787] text-[#f3ef9c]" : "border-[#faf999]/25 bg-[#001e3b] text-transparent"}`}>
                ✓
              </span>
              <span className="font-[var(--font-report-score)]">
                <span className="block text-[14px] leading-[20px] text-[#fcfcf4]">
                  태어난 시간을 몰라요
                </span>
                <span className="mt-1 block text-[10px] leading-[15px] text-[#fcfcf4]/60">
                  시주를 빼고 후보를 모두 비교해요.
                </span>
              </span>
            </button>
          </div>

          {mode === "partner" && (
            <label>
              <FieldLabel hint="더 정확한 분석을 위해 그룹명을 알려주세요">
                그룹명
              </FieldLabel>
              <input
                className={`${controlClass} mt-2`}
                value={value.groupName}
                onChange={(event) =>
                  onChange({ ...value, groupName: event.target.value })
                }
                placeholder="그룹명"
                maxLength={24}
                autoComplete="off"
              />
            </label>
          )}
        </div>

        <div className="absolute inset-x-6 bottom-[6.18%]">
          <GoldButton
            disabled={!ready}
            pressed={submitting}
            type="submit"
          >
            분석하기
          </GoldButton>
        </div>
      </form>
    </section>
  );
}
