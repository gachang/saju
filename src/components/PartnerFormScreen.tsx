"use client";

import { useState } from "react";
import { FormShell } from "./form/FormShell";
import { FieldLabel, controlClass } from "./form/controls";
import { PersonFields } from "./form/PersonFields";
import { isPersonComplete, type FormState, type Person } from "@/lib/saju";

type Props = {
  value: FormState;
  onChange: (next: FormState) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
};

export function PartnerFormScreen({ value, onChange, onBack, onSubmit, submitting }: Props) {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const person = value.partner;

  return (
    <FormShell
      ariaLabel="좋아하는 사람 정보 입력"
      title="좋아하는 사람 알려주기니"
      titleGap="mt-[47px]"
      submitLabel="분석하기"
      submitting={submitting}
      onBack={onBack}
      onSubmit={() => {
        if (isPersonComplete(person)) {
          onSubmit();
        } else {
          setSubmitAttempted(true);
        }
      }}
    >
      <PersonFields
        idPrefix="partner"
        subject="좋아하는 사람"
        person={person}
        onChange={(patch: Partial<Person>) => onChange({ ...value, partner: { ...person, ...patch } })}
        showErrors={submitAttempted}
      />

      <label>
        <FieldLabel hint="더 정확한 분석을 위해 그룹명을 알려주세요">그룹명</FieldLabel>
        <input
          className={`${controlClass} mt-2`}
          value={value.groupName}
          onChange={(event) => onChange({ ...value, groupName: event.target.value })}
          placeholder="ex. 리센느"
          maxLength={24}
          autoComplete="off"
        />
      </label>
    </FormShell>
  );
}
