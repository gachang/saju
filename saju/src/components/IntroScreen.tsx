"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { GoldButton } from "./ui/GoldButton";

export function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Throne scene, gold ring and congregation, flattened from the export. */}
      <Image
        src="/bg-intro.png"
        alt=""
        fill
        priority
        sizes="440px"
        className="object-cover object-top"
      />

      {/* Light breathing over the whole scene so it never feels static. */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-3/5 bg-[radial-gradient(ellipse_at_50%_18%,rgba(41,106,146,0.55),transparent_70%)]"
        animate={{ opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex h-full flex-col items-center px-7 pt-14 pb-10">
        <motion.h1
          className="text-center font-hambak text-[2rem] leading-tight text-white drop-shadow-[0_2px_14px_rgba(1,32,60,0.9)]"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          어떤게 궁금한가 자네,
        </motion.h1>

        <div className="flex-1" />

        <motion.p
          className="font-hambak text-[2.75rem] leading-none text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
        >
          성덕기니
        </motion.p>

        <motion.div
          className="mt-9 w-full"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
        >
          <GoldButton onClick={onStart}>시작하기</GoldButton>
        </motion.div>
      </div>
    </div>
  );
}
