"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { FormScreen } from "./FormScreen";
import { IntroScreen } from "./IntroScreen";
import { ResultScreen } from "./ResultScreen";
import { emptyForm, type FormState } from "@/lib/saju";

type Step = "intro" | "form" | "analyzing" | "result";

/** Lets the button's press-and-release flourish land before the screen swaps. */
const PRESS_MS = 420;

const fade = {
  initial: { opacity: 0, scale: 1.02 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.985 },
};

export function Stage() {
  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pressed, setPressed] = useState(false);

  const advance = useCallback((to: Step) => {
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      setStep(to);
    }, PRESS_MS);
  }, []);

  const restart = useCallback(() => {
    setForm(emptyForm);
    setStep("intro");
  }, []);

  return (
    <main className="flex min-h-dvh justify-center bg-ink-deep">
      <div className="relative h-dvh w-full max-w-(--stage-width) overflow-hidden bg-ink shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="absolute inset-0"
            {...fade}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            {step === "intro" && <IntroScreen onStart={() => advance("form")} />}

            {step === "form" && (
              <FormScreen
                value={form}
                onChange={setForm}
                onSubmit={() => advance("analyzing")}
                submitting={pressed}
              />
            )}

            {step === "analyzing" && (
              <AnalyzingScreen onDone={() => setStep("result")} />
            )}

            {step === "result" && <ResultScreen form={form} onRestart={restart} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
