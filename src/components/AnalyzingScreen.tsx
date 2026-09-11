"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { Backdrop } from "./Backdrop";
import { ElementOrbit } from "./ElementOrbit";

const ANALYZE_MS = 10_000;

/**
 * Positions are percentages of the 402 x 874 design frame taken from
 * assets/loading_example.svg, so the composition holds at any viewport height.
 */
const RING_CENTER_Y = (386.5 / 874) * 100;
const TITLE_Y = (137.8 / 874) * 100;
const HEADLINE_Y = (687.5 / 874) * 100;
const SUBLINE_Y = (727 / 874) * 100;

export function AnalyzingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    // #TODO
    const t = setTimeout(onDone, ANALYZE_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="relative h-full overflow-hidden">
      <Backdrop />

      {/* The ring assembly is 493px wide in a 402px frame, so it bleeds past
          both edges exactly as the export does. */}
      <div
        className="absolute left-1/2 w-[123%] -translate-x-1/2 -translate-y-1/2"
        style={{ top: `${RING_CENTER_Y}%` }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <ElementOrbit />
        </motion.div>
      </div>

      <div
        className="absolute inset-x-0 -translate-y-1/2 text-center"
        style={{ top: `${TITLE_Y}%` }}
      >
        <motion.p
          className="font-hambak text-[2.5rem] leading-none text-gold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          성덕기니
        </motion.p>
      </div>

      <div
        className="absolute inset-x-0 -translate-y-1/2 px-6 text-center"
        style={{ top: `${HEADLINE_Y}%` }}
      >
        <motion.h1
          className="font-hambak text-[2.5625rem] leading-none text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          분석중이기니
          <motion.span
            className="inline-block"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            ...
          </motion.span>
        </motion.h1>
      </div>

      <div
        className="absolute inset-x-0 -translate-y-1/2 px-6 text-center"
        style={{ top: `${SUBLINE_Y}%` }}
      >
        <motion.p
          className="font-hambak text-[1.3125rem] leading-none text-white/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          잠시만 기다리기니
        </motion.p>
      </div>

      {/* Thin gold meter so the ten second wait reads as progress. */}
      <div className="absolute bottom-[6%] left-1/2 h-px w-40 -translate-x-1/2 overflow-hidden bg-white/15">
        <motion.div
          className="h-full bg-gold"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: ANALYZE_MS / 1000, ease: "linear" }}
        />
      </div>
    </div>
  );
}
