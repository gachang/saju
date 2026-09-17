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
        animate={reduceMotion ? { opacity: 0.146 } : { opacity: [0.12, 0.17, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
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

      <BrandMark className="saju-intro-logo-enter absolute top-[6.86%] left-1/2 z-20 size-[72px] -translate-x-1/2" />

      <div
        data-intro-content="true"
        className="saju-intro-enter absolute inset-0"
      >
      <div className="absolute inset-x-4 top-[16.48%] z-20 text-center">
        <h1 className="font-hambak text-[24px] leading-[31px] text-white">
          성덕의 기운이 흐를지 보겠기니
        </h1>
      </div>
      <div className="absolute inset-x-4 top-[21.62%] z-20 text-center">
        <p className="[font-family:var(--font-report-serif)] text-[15px] font-black leading-[normal] text-[rgba(252,252,244,0.78)]">
          자네 마음에 품은 그 별…
          <br />
          사주팔자로 낱낱이 파헤쳐 주겠네
        </p>
      </div>

      <div className="pointer-events-none absolute top-[29.63%] left-1/2 w-[81.1%] -translate-x-1/2">
        <ElementOrbit showFigure={false} animationMode="intro" />
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
          width={2719}
          height={4095}
          sizes="100vw"
          className="absolute top-[-9.53%] left-[0.03%] h-[109.51%] w-[99.94%] max-w-none object-fill"
          priority
        />
      </motion.div>

      <div
        aria-hidden="true"
        className="absolute right-[-24px] bottom-0 left-[-16px] z-10 h-[54.23%] bg-linear-to-b from-transparent to-[#121212] to-[72.226%]"
      />

      <p
        aria-hidden="true"
        className="absolute top-[51.3%] left-[29.5%] z-10 -translate-x-1/2 [font-family:var(--font-onboarding-hanja)] text-[120px] leading-[0.68] text-white/10"
      >
        成
        <br />
        徳
      </p>
      <p
        aria-hidden="true"
        className="absolute top-[71.51%] left-[71%] z-10 -translate-x-1/2 [font-family:var(--font-onboarding-hanja)] text-[120px] leading-[0.682] text-white/10"
      >
        祈
        <br />
        靈
      </p>

      <motion.p
        className="absolute top-[67.39%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-hambak text-[48px] leading-[62px] text-[#f3f04e]"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.28, ease: "easeOut" }}
      >
        성덕기니
      </motion.p>

      <motion.div
        className="absolute inset-x-[13.93%] top-[80.89%] z-30"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.45, ease: "easeOut" }}
      >
        <GoldButton onClick={onStart} artwork="intro">시작하기</GoldButton>
      </motion.div>
      </div>
    </section>
  );
}
