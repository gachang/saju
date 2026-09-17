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
  { key: "metal", glyph: "金", left: 50, top: 1.5 },
  { key: "water", glyph: "水", left: 90.5, top: 33.1 },
  { key: "wood", glyph: "木", left: 75.5, top: 76.7 },
  { key: "fire", glyph: "火", left: 25, top: 76.7 },
  { key: "earth", glyph: "土", left: 9.5, top: 33.1 },
];

const INTRO_ELEMENTS = new Set<ElementKey>(["metal", "earth", "water"]);

type Props = {
  showFigure?: boolean;
  elementSet?: "all" | "intro";
};

/**
 * The animated circular altar from the final 402 × 874 Figma frames.
 * `intro` keeps only 金·土·水; the full five-element assembly is reserved for
 * the loading page.
 */
export function ElementOrbit({
  showFigure = true,
  elementSet = "all",
}: Props) {
  const reduceMotion = useReducedMotion();
  const visibleElements = ELEMENTS.filter(
    (element) => elementSet === "all" || INTRO_ELEMENTS.has(element.key),
  );
  return (
    <div className="relative aspect-square w-full" aria-hidden="true">
      <motion.div
        className="absolute inset-0 mix-blend-lighten"
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.68, 1, 0.68], scale: [0.985, 1.025, 0.985] }
        }
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/figma-final/orbit-aura.png"
          alt=""
          fill
          sizes="326px"
          className="object-contain"
          priority
        />
      </motion.div>

      <motion.div
        className={`absolute inset-[11.5%] opacity-95 ${
          reduceMotion
            ? ""
            : elementSet === "intro"
              ? "saju-orbit-ring-intro"
              : "saju-orbit-ring-loading"
        }`}
      >
        <Image
          src="/rings.svg"
          alt=""
          fill
          sizes="260px"
          className="object-contain"
          priority
        />
      </motion.div>

      {showFigure && (
        <>
          {[16.9, 58.6].map((left, index) => (
            <motion.div
              key={left}
              className="absolute top-[15.9%] h-[37.5%] w-[24.85%] opacity-60"
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

          <motion.div
            className="absolute left-[25.5%] top-[16.25%] h-[61.35%] w-[49.1%]"
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
        </>
      )}

      <motion.div
        data-orbit-track={elementSet}
        className={`absolute inset-0 ${
          reduceMotion
            ? ""
            : elementSet === "intro"
              ? "saju-orbit-track-intro"
              : "saju-orbit-track-loading"
        }`}
      >
        {visibleElements.map((element, index) => (
          <div
            key={element.key}
            className="absolute size-[15.65%] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${element.left}%`, top: `${element.top + 7.8}%` }}
          >
            <motion.div
              className={`relative size-full ${
                reduceMotion
                  ? ""
                  : elementSet === "intro"
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
