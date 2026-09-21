"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export function Backdrop({ dial = false }: { dial?: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      {dial && (
        <motion.div
          className="absolute top-[-8.92%] left-[-54.23%] aspect-square w-[242.8%] opacity-[0.59]"
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
        animate={reduceMotion ? { opacity: 0.146 } : { opacity: [0.12, 0.17, 0.12] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/figma-final/light-rays.png"
          alt=""
          fill
          sizes="492px"
          className="object-cover object-top"
          priority
        />
      </motion.div>

      <div
        className={`absolute right-[-24px] bottom-0 left-[-16px] bg-linear-to-b to-[72.226%] ${
          dial
            ? "h-[70.14%] from-[rgba(18,18,18,0)] to-[rgba(18,18,18,0.7)]"
            : "h-[47.83%] from-[rgba(0,30,59,0)] to-[#001e3b]"
        }`}
      />
    </div>
  );
}
