"use client";

import type { ReactNode } from "react";

const CONTROL =
  "h-9 w-full rounded-lg border border-white/15 bg-ink-deep/55 px-2.5 font-gmarket text-[0.8125rem] text-white transition-colors placeholder:text-white/30 focus:border-gold/70 focus:outline-none";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-gmarket text-[0.8125rem] font-medium text-white/90">
        {label}
      </span>
      {hint && (
        <span className="mb-1.5 block font-gmarket text-[0.6875rem] leading-snug text-white/45">
          {hint}
        </span>
      )}
      {children}
    </label>
  );
}

export function TextInput(props: React.ComponentProps<"input">) {
  return <input type="text" {...props} className={CONTROL} />;
}

export function Select({
  placeholder,
  options,
  ...props
}: React.ComponentProps<"select"> & {
  placeholder: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select {...props} className={`${CONTROL} pr-7 ${props.value ? "" : "text-white/40"}`}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink text-white">
            {o.label}
          </option>
        ))}
      </select>
      {/* Native arrow is suppressed in globals.css so the caret matches the theme. */}
      <svg
        aria-hidden
        viewBox="0 0 10 6"
        className="pointer-events-none absolute top-1/2 right-2.5 w-2.5 -translate-y-1/2 fill-none stroke-gold/70"
      >
        <path d="M1 1l4 4 4-4" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function CheckOption({
  label,
  checked,
  onChange,
  /** Set for mutually exclusive pairs like 양력 / 음력. */
  exclusive = false,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  exclusive?: boolean;
}) {
  return (
    <button
      type="button"
      role={exclusive ? "radio" : "checkbox"}
      aria-checked={checked}
      onClick={onChange}
      className="flex cursor-pointer items-center gap-1.5 font-gmarket text-[0.75rem] text-white/75 transition-colors hover:text-white"
    >
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
          checked ? "border-gold bg-gold/90" : "border-white/25 bg-transparent"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="w-2.5 stroke-ink">
            <path
              d="M2 6.5l2.6 2.6L10 3.5"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}
