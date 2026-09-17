"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  /** Plays a press-and-release flourish before `onClick` resolves. */
  pressed?: boolean;
};

/**
 * The 시작하기 button from the design: navy fill, brushed-gold edge.
 * Press feedback is a spring so a tap feels physical on touch devices.
 */
export function GoldButton({ children, onClick, disabled, pressed, type = "button" }: Props) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group relative h-[54px] w-full overflow-hidden rounded-2xl border-[1.5px] border-gold/80 bg-[#054787] font-hambak text-[18px] tracking-wide text-gold disabled:cursor-not-allowed disabled:opacity-40"
      initial={false}
      animate={
        pressed
          ? {
              // Springs only accept two keyframes, so the dip-and-overshoot
              // flourish rides an eased tween instead.
              scale: [1, 0.95, 1.04, 1],
              boxShadow: "0 0 46px 6px rgb(250 249 153 / 0.5)",
              transition: { duration: 0.42, ease: "easeInOut" },
            }
          : { scale: 1, boxShadow: "0 0 0 0 rgb(250 249 153 / 0)" }
      }
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
    >
      {/* Inner hairline echoes the double-stroked edge of the exported button. */}
      <span className="pointer-events-none absolute inset-[3px] rounded-[13px] border border-gold/15" />

      {/* Light sweeps across the gold on hover. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-full w-full bg-linear-to-r from-transparent via-gold/25 to-transparent group-hover:animate-none"
        initial={{ x: 0 }}
        animate={{ x: ["0%", "260%"] }}
        transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
      />

      <span className="relative">{children}</span>
    </motion.button>
  );
}
