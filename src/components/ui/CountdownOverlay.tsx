"use client";

import { memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { COLORS } from "@/lib/constants";
import { playOneShot } from "@/lib/audio";

export interface CountdownOverlayProps {
  count: number | null;
  onComplete?: () => void;
  className?: string;
}

export const CountdownOverlay = memo(({
  count,
  onComplete,
  className = "",
}: CountdownOverlayProps) => {
  const hasPlayedBeepRef = useRef(false);

  useEffect(() => {
    if (count !== null && count > 0) {
      hasPlayedBeepRef.current = false;
    }
  }, [count]);

  useEffect(() => {
    if (count !== null && count > 0 && !hasPlayedBeepRef.current) {
      try {
        playOneShot("countdownBeep", 0.8);
      } catch (error) {
        console.warn("Failed to play countdown beep:", error);
      }
      hasPlayedBeepRef.current = true;
    }
    if (count === 0) {
      try {
        playOneShot("raceStart", 1);
      } catch (error) {
        console.warn("Failed to play race start:", error);
      }
    }
  }, [count]);

  return (
    <AnimatePresence>
      {count !== null && count >= 0 && (
        <motion.div
          className={`
            fixed inset-0 z-[100]
            flex items-center justify-center
            ${className}
          `}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80" />

          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: COLORS.primary,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.5 + 0.3,
                  animation: `sparkle 2s infinite`,
                  animationDelay: `-${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {count > 0 ? (
            <motion.div
              key={count}
              className="relative z-10"
              initial={{ scale: 3, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -50 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
            >
              <div
                className="text-[200px] font-display font-black"
                style={{
                  color: COLORS.accent,
                  textShadow: `
                    0 0 30px ${COLORS.accent},
                    0 0 60px ${COLORS.accent}60,
                    0 0 90px ${COLORS.accent}30
                  `,
                }}
              >
                {count}
              </div>
            </motion.div>
          ) : count === 0 ? (
            <motion.div
              className="relative z-10"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 3, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.span
                className="text-[120px] font-display font-black"
                style={{
                  color: COLORS.primary,
                  textShadow: `
                    0 0 30px ${COLORS.primary},
                    0 0 60px ${COLORS.primary}60,
                    0 0 90px ${COLORS.primary}30
                  `,
                  letterSpacing: "0.3em",
                }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.5 }}
              >
                GO!
              </motion.span>
            </motion.div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CountdownOverlay.displayName = "CountdownOverlay";
export default CountdownOverlay;


