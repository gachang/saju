"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { IntroScreen } from "./IntroScreen";
import { PartnerFormScreen } from "./PartnerFormScreen";
import { ResultScreen } from "./ResultScreen";
import { SelfFormScreen } from "./SelfFormScreen";
import { loadSelfProfile, saveSelfProfile } from "@/lib/profile-storage";
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

  /**
   * Autofill happens on the way into the 본인 form rather than on mount, so the
   * first render stays identical on the server and a 처음으로 restart picks the
   * saved profile back up on its next pass through the intro.
   */
  const openSelfForm = useCallback(() => {
    const saved = loadSelfProfile();
    if (saved) setForm((current) => ({ ...current, self: saved }));
    advance("self");
  }, [advance]);

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
    <main className="flex h-dvh w-dvw justify-center overflow-hidden bg-ink sm:items-center sm:bg-ink-deep">
      <div className="relative h-full w-full overflow-hidden bg-ink sm:max-h-[874px] sm:max-w-[402px] sm:shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="absolute inset-0"
            {...(showingReport ? reportFade : fade)}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            {step === "intro" && <IntroScreen onStart={openSelfForm} />}

            {step === "self" && (
              <SelfFormScreen
                value={form}
                onChange={setForm}
                onSubmit={() => advance("partner")}
                submitting={pressed}
              />
            )}

            {step === "partner" && (
              <PartnerFormScreen
                value={form}
                onChange={setForm}
                onBack={() => setStep("self")}
                onSubmit={() => {
                  saveSelfProfile(form.self);
                  advance("analyzing");
                }}
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
