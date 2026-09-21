"use client";

import { useState } from "react";
import { FormShell } from "./form/FormShell";
import { PersonFields } from "./form/PersonFields";
import { isPersonComplete, type FormState, type Person } from "@/lib/saju";

type Props = {
  value: FormState;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
  submitting: boolean;
};

export function SelfFormScreen({ value, onChange, onSubmit, submitting }: Props) {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const person = value.self;

  return (
    <FormShell
      ariaLabel="본인 정보 입력"
      title={
        <>
          당신이 태어난
          <br />
          순간을 알려주기니
        </>
      }
      titleGap="mt-4"
      submitLabel="다음으로"
      submitting={submitting}
      onSubmit={() => {
        if (isPersonComplete(person)) {
          onSubmit();
        } else {
          setSubmitAttempted(true);
        }
      }}
    >
      <PersonFields
        idPrefix="self"
        subject="본인"
        person={person}
        onChange={(patch: Partial<Person>) => onChange({ ...value, self: { ...person, ...patch } })}
        showErrors={submitAttempted}
      />
    </FormShell>
  );
}
