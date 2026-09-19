"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

type ElementKey = "metal" | "water" | "wood" | "fire" | "earth";

const ELEMENTS: Array<{
  key: ElementKey;
  glyph: string;
  left: number;
  top: number;
}> = [
  { key: "metal", glyph: "金", left: 50.15, top: 9.36 },
  { key: "water", glyph: "水", left: 90.64, top: 40.95 },
  { key: "wood", glyph: "木", left: 75.61, top: 84.51 },
  { key: "fire", glyph: "火", left: 25, top: 84.51 },
  { key: "earth", glyph: "土", left: 7.82, top: 40.95 },
];

type Props = {
  showFigure?: boolean;
  animationMode?: "intro" | "loading";
};

/**
 * The animated circular altar from the final 402 × 874 Figma frames.
 * Both screens use the complete five-element assembly; the mode only controls
 * their rotation speed.
 */
export function ElementOrbit({
  showFigure = true,
  animationMode = "loading",
}: Props) {
  const reduceMotion = useReducedMotion();
  const ringOffset = animationMode === "intro" ? -0.5 : 0.5;
  return (
    <div className="relative aspect-square w-full" aria-hidden="true">
      <motion.div
        className="absolute top-[3.37%] left-0 size-full mix-blend-lighten"
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.68, 1, 0.68], scale: [0.985, 1.025, 0.985] }
        }
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {Array.from({ length: animationMode === "intro" ? 2 : 3 }).map((_, index) => (
          <Image
            key={index}
            src="/figma-final/orbit-aura.png"
            alt=""
            fill
            sizes="326px"
            className="object-contain"
            priority
          />
        ))}
      </motion.div>

      <div
        data-orbit-rings={animationMode}
        className={`pointer-events-none absolute inset-y-0 z-10 ${
          reduceMotion
            ? ""
            : animationMode === "intro"
              ? "saju-orbit-track-intro"
              : "saju-orbit-track-loading"
        }`}
        style={{ left: `${ringOffset}px`, right: `${-ringOffset}px` }}
      >
        <Image
          src="/figma-final/loading-orbit-outer.svg"
          alt=""
          width={252}
          height={252}
          sizes="252px"
          className="absolute top-[12.88%] left-1/2 h-auto w-[77.3%] max-w-none -translate-x-1/2"
          style={{ height: "auto" }}
          priority
          unoptimized
        />
        <Image
          src="/figma-final/loading-orbit-inner.svg"
          alt=""
          width={234}
          height={234}
          sizes="234px"
          className="absolute top-[15.64%] left-1/2 h-auto w-[71.66%] max-w-none -translate-x-1/2"
          style={{ height: "auto" }}
          priority
          unoptimized
        />
        <Image
          src="/figma-final/intro-orbit-middle.svg"
          alt=""
          width={198}
          height={198}
          sizes="198px"
          className="absolute top-[21.17%] left-1/2 h-auto w-[60.78%] max-w-none -translate-x-1/2"
          style={{ height: "auto" }}
          priority
          unoptimized
        />
      </div>

      {showFigure && (
        <>
          {[16.9, 58.6].map((left, index) => (
            <motion.div
              key={left}
              className="absolute top-[15.95%] z-[11] h-[37.5%] w-[24.85%] opacity-[0.56]"
              style={{ left: `${left}%` }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, -4, 0],
                      rotate:
                        index === 0
                          ? [-0.7, 0.7, -0.7]
                          : [0.7, -0.7, 0.7],
                    }
              }
              transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/figma-final/banner.png"
                alt=""
                fill
                sizes="82px"
                className="object-contain"
              />
            </motion.div>
          ))}

          <div className="absolute top-[17.48%] left-[calc(50%+1px)] z-[12] h-[61.35%] w-[49.1%] -translate-x-1/2">
            <motion.div
              className="relative size-full"
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -5, 0], scale: [1, 1.012, 1] }
              }
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/figma-final/guinea-loading.png"
                alt="성덕기니"
                fill
                sizes="200px"
                className="object-contain drop-shadow-[0_0_18px_rgba(250,249,153,0.34)]"
                priority
              />
            </motion.div>
          </div>
        </>
      )}

      <motion.div
        data-orbit-track={animationMode}
        className={`absolute inset-0 z-20 ${
          reduceMotion
            ? ""
            : animationMode === "intro"
              ? "saju-orbit-track-intro"
              : "saju-orbit-track-loading"
        }`}
      >
        {ELEMENTS.map((element, index) => (
          <div
            key={element.key}
            className="absolute size-[15.65%] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${element.left}%`, top: `${element.top}%` }}
          >
            <motion.div
              className={`relative size-full ${
                reduceMotion
                  ? ""
                  : animationMode === "intro"
                    ? "saju-orbit-counter-intro"
                    : "saju-orbit-counter-loading"
              }`}
            >
              <motion.div
                className="relative size-full"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: [0.72, 1, 0.72],
                        scale: [0.96, 1.06, 0.96],
                      }
                }
                transition={{
                  duration: 2.8,
                  delay: index * 0.28,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={`/el-${element.key}.svg`}
                  alt={element.glyph}
                  fill
                  sizes="52px"
                  className="object-contain drop-shadow-[0_0_9px_rgba(250,249,153,0.54)]"
                />
              </motion.div>
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
