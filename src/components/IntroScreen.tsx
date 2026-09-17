"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { BrandMark } from "./BrandMark";
import { ElementOrbit } from "./ElementOrbit";
import { GoldButton } from "./ui/GoldButton";

export function IntroScreen({ onStart }: { onStart: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative h-full overflow-hidden bg-ink" aria-label="성덕기니 시작">
      <motion.div
        aria-hidden="true"
        className="absolute top-0 left-1/2 h-[84.5%] w-[122.4%] -translate-x-1/2 mix-blend-screen"
        animate={reduceMotion ? undefined : { opacity: [0.23, 0.38, 0.23] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
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

      <BrandMark className="absolute top-[6.86%] left-1/2 z-20 size-[72px] -translate-x-1/2" />

      <div className="absolute inset-x-4 top-[16.48%] z-20 text-center">
        <h1 className="font-hambak text-[24px] leading-[1.25] text-white drop-shadow-[0_2px_12px_rgba(0,12,23,0.75)]">
          성덕의 기운이 흐를지 보겠기니
        </h1>
        <p className="mt-3 font-[var(--font-report-serif)] text-[15px] font-black leading-[1.55] text-[#fcfcf4]/80">
          자네 마음에 품은 그 별…
          <br />
          사주팔자로 낱낱이 파헤쳐 주겠네
        </p>
      </div>

      <div className="pointer-events-none absolute top-[28.5%] left-1/2 z-0 w-[81.1%] -translate-x-1/2">
        <ElementOrbit showFigure={false} elementSet="intro" />
      </div>

      <div className="pointer-events-none absolute top-[35.6%] left-[22.9%] z-[2] h-[14%] w-[20.2%] opacity-70">
        <Image src="/figma-final/banner.png" alt="" fill sizes="82px" className="object-contain" />
      </div>
      <div className="pointer-events-none absolute top-[35.6%] left-[56.7%] z-[2] h-[14%] w-[20.2%] opacity-70">
        <Image src="/figma-final/banner.png" alt="" fill sizes="82px" className="object-contain" />
      </div>

      <motion.div
        className="pointer-events-none absolute top-[28.8%] left-1/2 z-[3] h-[65.9%] w-[104.2%] -translate-x-1/2 overflow-hidden"
        animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/figma-final/intro-scene.png"
          alt="성덕기니 앞에 모인 기니피그들"
          fill
          sizes="420px"
          className="scale-[1.095] object-contain object-top"
          priority
        />
      </motion.div>

      <div
        aria-hidden="true"
        className="absolute inset-x-[-6%] bottom-0 z-10 h-[54.2%] bg-linear-to-b from-transparent to-[#121212] to-[72%]"
      />

      <p
        aria-hidden="true"
        className="absolute top-[51.3%] left-[29.5%] z-10 -translate-x-1/2 font-[var(--font-report-chart)] text-[120px] leading-[0.68] text-white/10"
      >
        成
        <br />
        徳
      </p>
      <p
        aria-hidden="true"
        className="absolute top-[70.4%] left-[71%] z-10 -translate-x-1/2 font-[var(--font-report-chart)] text-[120px] leading-[0.68] text-white/10"
      >
        祈
        <br />
        靈
      </p>

      <motion.p
        className="absolute top-[67.4%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-hambak text-[48px] leading-none text-[#f3f04e] drop-shadow-[0_3px_18px_rgba(0,0,0,0.75)]"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.28, ease: "easeOut" }}
      >
        성덕기니
      </motion.p>

      <motion.div
        className="absolute inset-x-[13.7%] top-[80.9%] z-30"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.45, ease: "easeOut" }}
      >
        <GoldButton onClick={onStart}>시작하기</GoldButton>
      </motion.div>
    </section>
  );
}
