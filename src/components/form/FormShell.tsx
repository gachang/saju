"use client";

import type { ReactNode } from "react";
import { Backdrop } from "../Backdrop";
import { BrandMark } from "../BrandMark";
import { GoldButton } from "../ui/GoldButton";

type Props = {
  ariaLabel: string;
  title: ReactNode;
  /** Figma spacing below the title differs per screen because the titles wrap differently. */
  titleGap: string;
  onBack?: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitting: boolean;
  children: ReactNode;
};

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="이전 단계로 돌아가기"
      className="absolute top-4 left-4 z-20 grid size-9 place-items-center rounded-full border border-[#faf999]/25 bg-[#001e3b]/70 text-[#f3ef9c] transition-colors hover:border-[#faf999]/60"
    >
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
        <path d="M7 1 1 7l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function FormShell({
  ariaLabel,
  title,
  titleGap,
  onBack,
  onSubmit,
  submitLabel,
  submitting,
  children,
}: Props) {
  return (
    <section className="relative h-full overflow-hidden bg-ink" aria-label={ariaLabel}>
      <Backdrop />

      {onBack && <BackButton onClick={onBack} />}

      <form
        className="saju-form-scroll absolute inset-0 z-10 overflow-y-auto overscroll-y-contain [font-family:var(--font-diphylleia)]"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="saju-form-page flex min-h-full flex-col px-6">
          <BrandMark className="mx-auto size-[72px] shrink-0" />

          <h1 className="mt-3 text-center font-hambak text-[24px] leading-[31px] text-white">{title}</h1>

          <div className={`${titleGap} flex flex-col gap-5`}>{children}</div>

          <div className="mt-auto pt-8">
            <GoldButton disabled={submitting} pressed={submitting} type="submit">
              {submitLabel}
            </GoldButton>
          </div>
        </div>
      </form>
    </section>
  );
}
