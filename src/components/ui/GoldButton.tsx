"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  /** Plays a press-and-release flourish before `onClick` resolves. */
  pressed?: boolean;
  artwork?: "intro" | "form";
};

/** The Figma CTA with its original irregular, brush-like gold edge. */
export function GoldButton({
  children,
  onClick,
  disabled,
  pressed,
  type = "button",
  artwork = "form",
}: Props) {
  const texture =
    artwork === "intro"
      ? "/figma-final/button-intro.png"
      : "/figma-final/button-form.png";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="relative h-[54px] w-full rounded-[16px] bg-[#054787] font-hambak text-[18px] leading-[normal] text-[#f3ef9c] disabled:cursor-not-allowed"
      initial={false}
      animate={
        pressed
          ? {
              scale: [1, 0.95, 1.04, 1],
              boxShadow: "0 0 46px 6px rgb(250 249 153 / 0.5)",
              transition: { duration: 0.42, ease: "easeInOut" },
            }
          : { scale: 1, boxShadow: "0 0 0 0 rgb(250 249 153 / 0)" }
      }
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
    >
      <span className="pointer-events-none absolute -inset-px overflow-hidden rounded-[17px]">
        <Image src={texture} alt="" fill sizes="356px" className="object-fill" />
      </span>
      <span className="pointer-events-none absolute inset-[2px] rounded-[14px] bg-[#054787]" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
