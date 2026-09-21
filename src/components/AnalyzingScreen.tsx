"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Backdrop } from "./Backdrop";
import { ElementOrbit } from "./ElementOrbit";
import { calculateChart } from "@/lib/engine";
import { countText, reportSchema, type Report } from "@/lib/reading-schema";
import type { FormState, Person } from "@/lib/saju";

const PROGRESS_STEPS = [
  { at: 0, value: 8 },
  { at: 2_000, value: 22 },
  { at: 8_000, value: 40 },
  { at: 18_000, value: 60 },
  { at: 32_000, value: 78 },
  { at: 48_000, value: 92 },
] as const;

function chartFor(person: Person) {
  const [hour, minute] = person.birthTime.split(":").map(Number);
  return calculateChart({
    year: Number(person.year),
    month: Number(person.month),
    day: Number(person.day),
    isLunar: person.calendar === "lunar",
    isLeapMonth: person.isLeapMonth,
    ...(person.timeUnknown ? {} : { hour, minute }),
    dayBoundary: "midnight",
  });
}

type InputStep = "self" | "partner";

export function AnalyzingScreen({
  form,
  onDone,
  onBack,
}: {
  form: FormState;
  onDone: (report: Report) => void;
  onBack: (step: InputStep) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(8);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const resumeTokenRef = useRef<string | undefined>(undefined);
  const charts = useMemo(() => {
    let self;
    try {
      self = chartFor(form.self);
    } catch {
      return { self: null, favorite: null, error: "본인 출생 정보를 다시 확인해 주세요.", invalidStep: "self" as InputStep };
    }
    try {
      const favorite = chartFor(form.partner);
      return { self, favorite, error: "", invalidStep: null };
    } catch {
      return { self, favorite: null, error: "좋아하는 사람의 출생 정보를 다시 확인해 주세요.", invalidStep: "partner" as InputStep };
    }
  }, [form]);

  useEffect(() => {
    if (!charts.self || !charts.favorite) {
      return;
    }

    const controller = new AbortController();
    const timers = PROGRESS_STEPS.slice(1).map((step) =>
      window.setTimeout(() => setProgress((current) => Math.max(current, step.value)), step.at),
    );
    let completionTimer: number | undefined;

    async function generateReport() {
      setError("");
      setProgress(8);
      let resumeToken = resumeTokenRef.current;
      const pair = { self: charts.self!.variants[0], favorite: charts.favorite!.variants[0] };
      const name_lengths = {
        self: countText(form.self.name.trim() || "사용자"),
        favorite: countText(form.partner.name.trim() || "최애"),
      };

      try {
        for (let step = 0; step < 3; step += 1) {
          const timeout = window.setTimeout(() => controller.abort(), 58_000);
          let response: Response;
          let body: unknown;
          try {
            response = await fetch("/api/reading-copy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...pair, name_lengths, resumeToken }),
              signal: controller.signal,
            });
            body = await response.json();
          } finally {
            window.clearTimeout(timeout);
          }

          const payload = body as { report?: unknown; resumeToken?: string; code?: string; error?: string };
          resumeToken = payload.resumeToken ?? resumeToken;
          resumeTokenRef.current = resumeToken;
          if (payload.resumeToken && (response.status === 202 || payload.code === "READING_TIMEOUT")) {
            setProgress(Math.min(96, 90 + (step + 1) * 2));
            continue;
          }
          if (!response.ok || !payload.report) {
            if (response.status === 400 || payload.code === "READING_ATTEMPTS") resumeTokenRef.current = undefined;
            throw new Error(payload.error || "보고서를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
          }

          const report = reportSchema.parse(payload.report);
          resumeTokenRef.current = undefined;
          setProgress(100);
          completionTimer = window.setTimeout(() => onDone(report), reduceMotion ? 100 : 650);
          return;
        }
        throw new Error("보고서 검수가 오래 걸리고 있어요. 다시 시도하면 이어서 만들 수 있어요.");
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "보고서를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    }

    void generateReport();
    return () => {
      controller.abort();
      timers.forEach(window.clearTimeout);
      if (completionTimer !== undefined) window.clearTimeout(completionTimer);
    };
  }, [charts, form, onDone, reduceMotion, retryKey]);

  const selfName = form.self.name.trim() || "김기니";
  const partnerName = form.partner.name.trim() || "김기니";
  const visibleError = charts.error || error;
  const headline = visibleError
    ? "별빛이 잠깐 흐려졌기니"
    : progress >= 92
      ? "마지막 글을 다듬는 중이기니"
      : progress >= 68
        ? "이야기를 쓰는 중이기니"
        : progress >= 35
          ? "기운을 맞추는 중이기니"
          : "사주를 펼치는 중이기니";

  return (
    <section className="relative h-full overflow-hidden bg-ink" aria-label="궁합 보고서 생성 중">
      <Backdrop dial />

      <div
        data-loading-stack="true"
        className="absolute top-[15.33%] bottom-[13.96%] left-1/2 z-20 flex w-[81.1%] max-w-[326px] -translate-x-1/2 flex-col items-center gap-[min(60px,6.86dvh)]"
      >
        <div className="relative z-20 flex h-[57px] w-[90.18%] max-w-[294px] shrink-0 flex-col items-center justify-center gap-1 text-center">
          <motion.h1
            key={headline}
            className="w-full font-hambak text-[24px] font-extrabold leading-[normal] text-white"
            style={{ fontFeatureSettings: "'liga' off, 'clig' off" }}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {headline}
          </motion.h1>
          <p
            className="w-full [font-family:var(--font-report-serif)] text-[15px] font-medium leading-[normal] text-[rgba(252,252,244,0.78)]"
            style={{ fontFeatureSettings: "'liga' off, 'clig' off" }}
          >
            {visibleError ? "잠시 숨을 고르고 다시 불러보겠기니" : "나가면 힘이 빠지니 기다리겠기니?"}
          </p>
        </div>

        <motion.div
          data-loading-orbit="true"
          className="relative z-10 h-[306px] w-full shrink-0"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <Image
            src="/figma-final/loading-glow.svg"
            alt=""
            width={493}
            height={493}
            sizes="493px"
            className="pointer-events-none absolute top-[calc(50%+14.5px)] left-[calc(50%+0.5px)] h-auto w-[151.23%] max-w-none -translate-x-1/2 -translate-y-1/2"
          />
          <ElementOrbit />
        </motion.div>

        <div
          data-loading-summary="true"
          className="relative z-20 flex w-[97.24%] max-w-[317px] shrink-0 flex-col items-center gap-6"
        >
          <div className="flex w-full items-center">
            {[selfName, partnerName].map((name, index) => (
              <div key={`${index}-${name}`} className="contents">
                {index === 1 && (
                  <div className="relative flex h-[46px] w-[51px] shrink-0 items-center justify-center">
                    <Image src="/figma-final/name-line.svg" alt="" width={51} height={1} className="absolute left-0 top-1/2 h-auto w-full -translate-y-1/2" />
                    <Image src="/figma-final/name-heart.svg" alt="좋아하는 사이" width={24} height={24} className="relative size-6" />
                  </div>
                )}
                <div className="flex h-[60px] min-w-0 flex-1 rounded-[66px] border-[0.5px] border-[#f3ef9c] p-0.5">
                  <div className="flex h-full w-full items-center justify-center rounded-[32px] border-[0.5px] border-[#f3ef9c] px-3 py-1 text-center font-hambak text-[18.536px] leading-[normal] text-[#f3ef9c]">
                    <span className="line-clamp-2 [overflow-wrap:anywhere]">{name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="w-full text-center [font-family:var(--font-report-serif)] text-[16px] font-normal leading-[normal] text-[#f8f2e6]">
            {visibleError || "성덕기니가 둘의 궁합을 살펴보는 중이에요"}
          </p>
          {charts.error && charts.invalidStep && (
            <button
              type="button"
              onClick={() => onBack(charts.invalidStep!)}
              className="mx-auto flex h-11 items-center justify-center rounded-[14px] border border-[#ff8f8f] bg-[#012e58] px-7 font-hambak text-[17px] text-[#ffb1b1]"
            >
              입력 다시 확인하기
            </button>
          )}
          {visibleError && !charts.error && (
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="mx-auto flex h-11 items-center justify-center rounded-[14px] border border-[#f3ef9c] bg-[#012e58] px-8 font-hambak text-[17px] text-[#f3ef9c]"
            >
              다시 만들기
            </button>
          )}
          {!charts.error && (
            <div
              className="h-1 w-[170px] overflow-hidden rounded-[14px] bg-[#000c17]"
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
                transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
