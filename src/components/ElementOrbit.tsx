"use client";

import Image from "next/image";
import { motion } from "motion/react";

/**
 * All geometry below is expressed as a percentage of a 493x493 box, which is
 * the ring assembly's size in the Figma export (assets/round_thing.svg).
 * Sharing that one reference frame keeps the layers registered as they scale.
 */
const BADGE_RADIUS = (137 / 493) * 100; // gold glyph badges orbit at r=137
const BADGE_SIZE = (52 / 493) * 100;

/** Clockwise from the top in 相生 order: 金 → 水 → 木 → 火 → 土. */
const ELEMENTS = [
  { key: "metal", glyph: "金", angle: 0 },
  { key: "water", glyph: "水", angle: 72 },
  { key: "wood", glyph: "木", angle: 144 },
  { key: "fire", glyph: "火", angle: 216 },
  { key: "earth", glyph: "土", angle: 288 },
];

const ORBIT_SECONDS = 44;

/** `showFigure` off leaves just the turning rings, for use as background art. */
export function ElementOrbit({ showFigure = true }: { showFigure?: boolean }) {
  return (
    <div className="relative aspect-square w-full">
      {/* Diffused blue core, matching the blurred #296A92 circle in the export. */}
      {showFigure && (
        <motion.div
          aria-hidden
          className="absolute inset-[12%] rounded-full bg-glow blur-[42px]"
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.94, 1.04, 0.94] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Gold aura: the brightening / dimming pulse. */}
      {showFigure && (
        <motion.div
          aria-hidden
          className="absolute"
          style={{
            left: `${(83.5 / 493) * 100}%`,
            top: `${(83.5 / 493) * 100}%`,
            width: `${(326 / 493) * 100}%`,
            height: `${(326 / 493) * 100}%`,
          }}
          animate={{
            opacity: [0.72, 1, 0.72],
            scale: [0.97, 1.05, 0.97],
            filter: [
              "brightness(0.85) saturate(1)",
              "brightness(1.45) saturate(1.15)",
              "brightness(0.85) saturate(1)",
            ],
          }}
          transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/aura.png" alt="" fill sizes="420px" className="object-contain" priority />
        </motion.div>
      )}

      {/* Concentric brush circles, drifting slowly against the orbit. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 opacity-80"
        animate={{ rotate: -360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
      >
        <Image src="/rings.svg" alt="" fill sizes="520px" className="object-contain" priority />
      </motion.div>

      {/* Banners flanking the throne. */}
      {showFigure && [27.99, 55.58].map((left, i) => (
        <motion.div
          key={left}
          aria-hidden
          className="absolute opacity-56"
          style={{
            left: `${left}%`,
            top: `${(131 / 493) * 100}%`,
            width: `${(81 / 493) * 100}%`,
            height: `${(122 / 493) * 100}%`,
          }}
          animate={{ y: ["0%", "-2.5%", "0%"], rotate: i === 0 ? [-0.6, 0.6, -0.6] : [0.6, -0.6, 0.6] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/banner.png" alt="" fill sizes="140px" className="object-contain" />
        </motion.div>
      ))}

      {/* The guinea pig, breathing. */}
      {showFigure && (
        <motion.div
          className="absolute"
          style={{
            left: `${(167 / 493) * 100}%`,
            top: `${(136 / 493) * 100}%`,
            width: `${(160 / 493) * 100}%`,
            height: `${(200 / 493) * 100}%`,
          }}
          animate={{ y: ["0%", "-2%", "0%"], scale: [1, 1.018, 1] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/guinea.png"
            alt="성덕기니"
            fill
            sizes="280px"
            className="object-contain drop-shadow-[0_0_18px_rgba(250,249,153,0.35)]"
            priority
          />
        </motion.div>
      )}

      {/* Orbiting 五行 badges. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: ORBIT_SECONDS, repeat: Infinity, ease: "linear" }}
      >
        {ELEMENTS.map((el, i) => (
          <div
            key={el.key}
            className="absolute top-1/2 left-1/2"
            style={{
              width: `${BADGE_SIZE}%`,
              height: `${BADGE_SIZE}%`,
              // Swing out to the pentagon vertex, then undo the swing so the
              // badge box itself stays axis-aligned.
              transform: `translate(-50%, -50%) rotate(${el.angle}deg) translateY(-${
                (BADGE_RADIUS / BADGE_SIZE) * 100
              }%) rotate(${-el.angle}deg)`,
            }}
          >
            {/* Counter-spin at the orbit's rate keeps each glyph upright. */}
            <motion.div
              className="relative size-full"
              animate={{ rotate: -360 }}
              transition={{ duration: ORBIT_SECONDS, repeat: Infinity, ease: "linear" }}
            >
              <motion.div
                className="relative size-full"
                animate={{ opacity: [0.65, 1, 0.65], scale: [0.94, 1.06, 0.94] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  // Stagger so the brightening chases around the 相生 cycle.
                  delay: (i * 2.4) / ELEMENTS.length,
                }}
              >
                <Image
                  src={`/el-${el.key}.svg`}
                  alt={el.glyph}
                  fill
                  sizes="56px"
                  className="object-contain drop-shadow-[0_0_10px_rgba(250,249,153,0.65)]"
                />
              </motion.div>
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
