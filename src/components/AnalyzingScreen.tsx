"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Backdrop } from "./Backdrop";
import { ElementOrbit } from "./ElementOrbit";
import type { FormState } from "@/lib/saju";

const ANALYZE_MS = 9_200;
const PROGRESS_STEPS = [
  { at: 0, value: 8 },
  { at: 700, value: 30 },
  { at: 2_500, value: 52 },
  { at: 4_600, value: 74 },
  { at: 6_700, value: 91 },
  { at: 8_400, value: 100 },
] as const;

export function AnalyzingScreen({
  form,
  onDone,
}: {
  form: FormState;
  onDone: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(reduceMotion ? 100 : 8);

  useEffect(() => {
    if (reduceMotion) {
      const done = window.setTimeout(onDone, 350);
      return () => window.clearTimeout(done);
    }

    const timers = PROGRESS_STEPS.slice(1).map((step) =>
      window.setTimeout(() => setProgress(step.value), step.at),
    );
    const done = window.setTimeout(onDone, ANALYZE_MS);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
  }, [onDone, reduceMotion]);

  const selfName = form.self.name.trim() || "김기니";
  const partnerName = form.partner.name.trim() || "김기니";
  const headline =
    progress >= 74
      ? "거의 다 됐기니...."
      : progress >= 30
        ? "기운을 맞춰보는 중이기니"
        : "사주를 펼쳐보는 중이기니";

  return (
    <section className="relative h-full overflow-hidden bg-ink" aria-label="궁합 분석 중">
      <Backdrop dial />

      <div className="absolute inset-x-5 top-[14.2%] z-20 text-center">
        <motion.h1
          key={headline}
          className="font-hambak text-[40px] leading-[1.12] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {headline}
        </motion.h1>
        <p className="mt-3 font-hambak text-[20px] leading-[1.25] text-[#f8f2e6]">
          나가면 힘이 빠지니 기다리겠기니?
        </p>
      </div>

      <motion.div
        className="absolute top-[31.2%] left-1/2 z-10 w-[81.1%] -translate-x-1/2"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <ElementOrbit />
      </motion.div>

      <div className="absolute inset-x-[10.7%] top-[73.55%] z-20">
        <div className="flex items-center">
          {[selfName, partnerName].map((name, index) => (
            <div key={`${index}-${name}`} className="contents">
              {index === 1 && (
                <div className="relative h-[46px] w-[51px] shrink-0">
                  <Image
                    src="/figma-final/name-connector.png"
                    alt="좋아하는 사이"
                    fill
                    sizes="51px"
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex min-h-[64px] min-w-0 flex-1 rounded-[66px] border border-[#f3ef9c]/80 p-0.5">
                <div className="flex min-h-[58px] w-full items-center justify-center rounded-[32px] border border-[#f3ef9c]/80 px-3 py-1 text-center font-hambak text-[18px] leading-[1.15] text-[#f3ef9c]">
                  <span className="line-clamp-2 [overflow-wrap:anywhere]">{name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center font-[var(--font-report-serif)] text-[16px] leading-normal text-[#f8f2e6]">
          성덕기니가 둘의 궁합을 살펴보는 중이에요
        </p>
      </div>

      <div
        className="absolute top-[89.25%] left-1/2 z-20 h-1 w-[170px] -translate-x-1/2 overflow-hidden rounded-[14px] bg-[#000c17]"
        role="progressbar"
        aria-label="보고서 준비 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <motion.div
          className="h-full bg-[#f3f04e]"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </div>
    </section>
  );
}
