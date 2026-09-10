"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Backdrop } from "./Backdrop";
import { GoldButton } from "./ui/GoldButton";
import type { FormState } from "@/lib/saju";

// #TODO
const EXAMPLE_RESULT = {
  score: 78,
  verdict: "물이 나무를 살리는 사이기니",
  paragraphs: [
    "자네의 일간은 水, 그이의 일간은 木이기니. 물이 나무를 밀어 올리는 水生木의 자리라, 자네가 마음을 쓰는 만큼 그이가 자라나는 인연이기니.",
    "다만 자네의 사주에 물이 과하기니. 정을 한꺼번에 쏟으면 뿌리가 상하니, 덕질도 숨을 고르며 하는 것이 좋기니.",
    "올해는 火가 드는 해라 무대 위의 그이가 유난히 빛나겠기니. 자네의 응원이 그 불씨를 키워주겠기니.",
  ],
};

export function ResultScreen({
  form,
  onRestart,
}: {
  form: FormState;
  onRestart: () => void;
}) {
  const self = form.self.name || "자네";
  const partner = form.partner.name || "그이";

  return (
    <div className="relative h-full overflow-y-auto">
      <Backdrop dim />

      <div className="relative flex min-h-full flex-col px-6 pt-10 pb-8">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="font-hambak text-2xl leading-none text-gold">성덕기니</p>
          <motion.div
            className="relative mt-4 h-24 w-20"
            animate={{ y: ["0%", "-6%", "0%"] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/guinea.png"
              alt="성덕기니"
              fill
              sizes="120px"
              className="object-contain drop-shadow-[0_0_18px_rgba(250,249,153,0.4)]"
            />
          </motion.div>
        </motion.div>

        <motion.section
          className="mt-6 rounded-2xl border border-gold/25 bg-white/6 p-5 shadow-[0_0_28px_rgba(1,32,60,0.55),inset_0_1px_0_rgba(250,249,153,0.12)] backdrop-blur-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <p className="text-center font-gmarket text-xs tracking-wide text-white/55">
            {self} × {partner}
            {form.groupName && ` (${form.groupName})`}
          </p>

          <p className="mt-3 text-center font-hambak text-[1.625rem] leading-tight text-gold">
            {EXAMPLE_RESULT.verdict}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2.5">
            <span className="font-gmarket text-xs text-white/55">궁합</span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/12">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-gold-dim to-gold"
                initial={{ width: "0%" }}
                animate={{ width: `${EXAMPLE_RESULT.score}%` }}
                transition={{ duration: 1.1, delay: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="font-gmarket text-sm font-bold text-gold">
              {EXAMPLE_RESULT.score}점
            </span>
          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
            {EXAMPLE_RESULT.paragraphs.map((p) => (
              <p key={p} className="font-gmarket text-[0.8125rem] leading-relaxed text-white/80">
                {p}
              </p>
            ))}
          </div>
        </motion.section>

        <motion.div
          className="mt-7 space-y-2.5"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          {/* #TODO */}
          <GoldButton>공유하기</GoldButton>

          <button
            type="button"
            onClick={onRestart}
            className="h-12 w-full rounded-2xl border border-white/20 font-gmarket text-sm font-medium text-white/70 transition-colors hover:border-white/35 hover:text-white"
          >
            처음으로
          </button>
        </motion.div>
      </div>
    </div>
  );
}
