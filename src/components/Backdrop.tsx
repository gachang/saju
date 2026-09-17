"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export function Backdrop({ dial = false }: { dial?: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      {dial && (
        <motion.div
          className="absolute top-[-7.8%] left-[-54.7%] aspect-square w-[242.8%] opacity-60"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 420, repeat: Infinity, ease: "linear" }}
        >
          <Image
            src="/figma-final/zodiac-loading.png"
            alt=""
            fill
            sizes="976px"
            className="object-contain"
            priority
          />
        </motion.div>
      )}

      <motion.div
        className="absolute top-0 left-1/2 h-[84.5%] w-[122.4%] -translate-x-1/2 mix-blend-screen"
        animate={reduceMotion ? undefined : { opacity: [0.2, 0.36, 0.2] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/figma-final/light-rays.png"
          alt=""
          fill
          sizes="492px"
          className="object-cover object-top opacity-90"
          priority
        />
      </motion.div>

      <div className="absolute inset-x-[-6%] bottom-0 h-[70.1%] bg-linear-to-b from-transparent to-[rgba(18,18,18,0.7)] to-[72%]" />
    </div>
  );
}
