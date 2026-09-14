"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface TextRevealProps {
  text: string;
  className?: string;
  duration?: number;
  stagger?: number;
  onComplete?: () => void;
}

export const TextReveal = memo(({
  text,
  className = "",
  duration = 0.8,
  stagger = 0.03,
}: TextRevealProps) => {
  const words = text.split(" ");

  return (
    <AnimatePresence>
      <motion.span
        className={`inline-block font-display font-bold ${className}`}
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: stagger,
              delayChildren: 0.1,
            },
          },
        }}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="display:inline"
            variants={{
              hidden: { opacity: 0, y: 20, filter: "blur(5px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  duration,
                  ease: "easeOut",
                },
              },
            }}
            style={{ color: COLORS.textPrimary }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
  );
});

TextReveal.displayName = "TextReveal";
export default TextReveal;


