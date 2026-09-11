"use client";

import Image from "next/image";
import { motion } from "motion/react";

/**
 * The layered night-sky background shared by the form, analyzing and result
 * screens. Rebuilt from the separate layers of assets/loading_example.svg so
 * the zodiac dial can turn on its own.
 */
export function Backdrop({ dim = false }: { dim?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      {/* Zodiac dial, oversized and slowly turning. */}
      <motion.div
        className="absolute top-[-8%] left-1/2 aspect-square w-[243%] -translate-x-1/2 opacity-60"
        animate={{ rotate: 360 }}
        transition={{ duration: 420, repeat: Infinity, ease: "linear" }}
      >
        <Image src="/zodiac.png" alt="" fill sizes="1000px" className="object-contain" priority />
      </motion.div>

      {/* God-rays falling from above. */}
      <motion.div
        className="absolute top-0 left-[-11%] w-[122%]"
        style={{ height: "84%", mixBlendMode: "screen" }}
        animate={{ opacity: [0.1, 0.19, 0.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/rays.png"
          alt=""
          fill
          sizes="800px"
          className="object-cover object-top"
          priority
        />
      </motion.div>

      {/* Vignette that sinks the bottom of the frame into black. */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-linear-to-b from-transparent to-[#121212]" />

      {dim && <div className="absolute inset-0 bg-ink-deep/30" />}
    </div>
  );
}
