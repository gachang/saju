"use client";

import { motion } from "motion/react";
import { Backdrop } from "./Backdrop";
import { ElementOrbit } from "./ElementOrbit";
import { CheckOption, Field, Select, TextInput } from "./ui/Field";
import { GoldButton } from "./ui/GoldButton";
import {
  MONTHS,
  SANGGEUK,
  SANGSAENG,
  YEARS,
  daysInMonth,
  isPersonComplete,
  type FormState,
  type Person,
} from "@/lib/saju";

type Props = {
  value: FormState;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
  submitting: boolean;
};

const asOptions = (values: string[], suffix: string) =>
  values.map((v) => ({ value: v, label: `${v}${suffix}` }));

function PersonPanel({
  title,
  person,
  onChange,
  children,
  delay,
}: {
  title: string;
  person: Person;
  onChange: (patch: Partial<Person>) => void;
  children?: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.section
      className="flex-1 rounded-2xl border border-gold/25 bg-white/6 p-3 shadow-[0_0_28px_rgba(1,32,60,0.55),inset_0_1px_0_rgba(250,249,153,0.12)] backdrop-blur-md"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
    >
      <h2 className="mb-3.5 text-center font-gmarket text-base font-bold text-gold">{title}</h2>

      <div className="space-y-3">
        <Field label="호칭 (선택)">
          <TextInput
            value={person.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="닉네임"
            maxLength={12}
            autoComplete="off"
          />
        </Field>

        <Field label="생년월일">
          <div className="space-y-1.5">
            <Select
              placeholder="년"
              options={asOptions(YEARS, "년")}
              value={person.year}
              onChange={(e) => onChange({ year: e.target.value, day: "" })}
            />
            <div className="flex gap-1.5">
              <Select
                placeholder="월"
                options={asOptions(MONTHS, "월")}
                value={person.month}
                onChange={(e) => onChange({ month: e.target.value, day: "" })}
              />
              <Select
                placeholder="일"
                options={asOptions(person.calendar === "lunar" ? Array.from({ length: 30 }, (_, i) => String(i + 1)) : daysInMonth(person.year, person.month), "일")}
                value={person.day}
                onChange={(e) => onChange({ day: e.target.value })}
              />
            </div>
            <div role="radiogroup" aria-label="양력 음력" className="flex gap-3 pt-0.5">
              <CheckOption
                exclusive
                label="양력"
                checked={person.calendar === "solar"}
                onChange={() => onChange({ calendar: "solar", isLeapMonth: false, day: "" })}
              />
              <CheckOption
                exclusive
                label="음력"
                checked={person.calendar === "lunar"}
                onChange={() => onChange({ calendar: "lunar", day: "" })}
              />
            </div>
            {person.calendar === "lunar" && <CheckOption label="윤달" checked={person.isLeapMonth} onChange={() => onChange({ isLeapMonth: !person.isLeapMonth })} />}
          </div>
        </Field>

        <Field label="태어난 시각">
          <div className="space-y-1.5">
            <TextInput
              type="time"
              aria-label={`${title} 태어난 시각`}
              value={person.birthTime}
              disabled={person.timeUnknown}
              onChange={(e) => onChange({ birthTime: e.target.value })}
            />
            <CheckOption
              label="모름"
              checked={person.timeUnknown}
              onChange={() => onChange({ timeUnknown: !person.timeUnknown, birthTime: "" })}
            />
          </div>
        </Field>

        {children}
      </div>
    </motion.section>
  );
}

export function FormScreen({ value, onChange, onSubmit, submitting }: Props) {
  const patch = (who: "self" | "partner") => (p: Partial<Person>) =>
    onChange({ ...value, [who]: { ...value[who], ...p } });

  const ready = isPersonComplete(value.self) && isPersonComplete(value.partner);

  return (
    <div className="relative h-full overflow-y-auto">
      <Backdrop dim />

      {/* Ring assembly drifting behind the panels, with 金 clearing the top
          edge of the panels the way the mockup frames it. */}
      <div className="pointer-events-none absolute top-[-2.5%] left-1/2 w-[92%] -translate-x-1/2 opacity-40">
        <ElementOrbit showFigure={false} />
      </div>

      <div className="relative flex min-h-full flex-col px-4 pt-20 pb-5">
        <div className="flex items-stretch gap-2.5">
          <PersonPanel
            title="본인"
            person={value.self}
            onChange={patch("self")}
            delay={0.05}
          />
          <PersonPanel
            title="상대방 (=연예인)"
            person={value.partner}
            onChange={patch("partner")}
            delay={0.15}
          >
            <Field label="그룹명" hint="화면 표시용이며 계산에는 사용하지 않아요.">
              <TextInput
                value={value.groupName}
                onChange={(e) => onChange({ ...value, groupName: e.target.value })}
                placeholder="그룹명 (선택)"
                autoComplete="off"
              />
            </Field>
          </PersonPanel>
        </div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GoldButton onClick={onSubmit} disabled={!ready} pressed={submitting}>
            분석 시작하기
          </GoldButton>
          <p className="mt-3 text-center text-xs leading-relaxed text-white/60">보정 없는 한국 표준시 · 자정 일 경계 기준이에요.<br />생일은 브라우저에서 계산하며, 풀이는 재미로 즐겨주세요.</p>
          {!ready && (
            <p className="mt-2.5 text-center font-gmarket text-[0.6875rem] text-white/40">
              두 사람의 정보를 모두 채워주게.
            </p>
          )}
        </motion.div>

        <div className="mt-auto space-y-1.5 pt-6 text-center font-gmarket text-[0.625rem] tracking-wide text-gold/70">
          <p>相生: {SANGSAENG.join(" | ")}</p>
          <p>相克: {SANGGEUK.join(" | ")}</p>
        </div>
      </div>
    </div>
  );
}
