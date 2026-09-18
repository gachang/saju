"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { FormScreen } from "./FormScreen";
import { IntroScreen } from "./IntroScreen";
import { ResultScreen } from "./ResultScreen";
import type { Report } from "@/lib/reading-schema";
import { createInitialForm, type FormState } from "@/lib/saju";

type Step = "intro" | "self" | "partner" | "analyzing" | "result";

/** Lets the button's press-and-release flourish land before the screen swaps. */
const PRESS_MS = 420;

const fade = {
  initial: { opacity: 0, scale: 1.02 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.985 },
};

const reportFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export function Stage() {
  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState<FormState>(createInitialForm);
  const [report, setReport] = useState<Report | null>(null);
  const [pressed, setPressed] = useState(false);

  const advance = useCallback((to: Step) => {
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      setStep(to);
    }, PRESS_MS);
  }, []);

  const restart = useCallback(() => {
    setForm(createInitialForm());
    setReport(null);
    setStep("intro");
  }, []);

  const finishAnalysis = useCallback((completedReport: Report) => {
    setReport(completedReport);
    setStep("result");
  }, []);

  const showingReport = step === "result" && Boolean(report);

  return (
    <main className={`flex h-dvh w-dvw justify-center overflow-hidden ${step === "intro" ? "bg-ink sm:items-center sm:bg-ink-deep" : "bg-ink"}`}>
      <div className={`relative h-full w-full overflow-hidden bg-ink ${step === "intro" ? "sm:max-h-[874px] sm:max-w-[402px] sm:shadow-[0_0_80px_rgba(0,0,0,0.6)]" : ""}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="absolute inset-0"
            {...(showingReport ? reportFade : fade)}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            {step === "intro" && <IntroScreen onStart={() => advance("self")} />}

            {step === "self" && (
              <FormScreen
                mode="self"
                value={form}
                onChange={setForm}
                onSubmit={() => advance("partner")}
                submitting={pressed}
              />
            )}

            {step === "partner" && (
              <FormScreen
                mode="partner"
                value={form}
                onChange={setForm}
                onSubmit={() => advance("analyzing")}
                submitting={pressed}
              />
            )}

            {step === "analyzing" && (
              <AnalyzingScreen form={form} onDone={finishAnalysis} onBack={setStep} />
            )}

            {step === "result" && report && <ResultScreen form={form} report={report} onRestart={restart} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
