"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface NitroBarProps {
  level: number;
  maxLevel?: number;
  active?: boolean;
  className?: string;
  onPress?: () => void;
}

export const NitroBar = memo(({
  level = 100,
  maxLevel = 100,
  active = false,
  className = "",
  onPress,
}: NitroBarProps) => {
  const controls = useAnimation();
  const prevLevelRef = useRef(level);
  const [key, setKey] = useState(0);

  const ratio = level / maxLevel;
  const width = Math.max(0, Math.min(100, ratio * 100));

  const isRefilling = level < maxLevel && !active;
  const isDepleting = level > 0 && active;

  useEffect(() => {
    if (prevLevelRef.current > level) {
      controls.start({
        boxShadow: [
          `0 0 10px ${COLORS.accent}, 0 0 20px ${COLORS.accent}40`,
          `0 0 20px ${COLORS.accent}, 0 0 40px ${COLORS.accent}60`,
          `0 0 10px ${COLORS.accent}, 0 0 20px ${COLORS.accent}40`,
        ],
      });
    }
    prevLevelRef.current = level;
  }, [level, controls]);

  useEffect(() => {
    if (active) {
      controls.start({
        boxShadow: [
          `0 0 30px ${COLORS.accent}, 0 0 60px ${COLORS.accent}60, inset 0 0 40px ${COLORS.accent}40`,
        ],
      });
    } else if (!isRefilling) {
      controls.start({ boxShadow: "none" });
    }
  }, [active, isRefilling, controls]);

  const getNitroColor = () => {
    if (active) return COLORS.accent;
    if (ratio > 0.5) return COLORS.accent;
    if (ratio > 0.2) return COLORS.secondary;
    return COLORS.textMuted;
  };

  return (
    <motion.div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3
        px-4 py-2
        rounded-xl
        font-display
        ${className}
      `}
      style={{
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${COLORS.border}`,
        minWidth: "240px",
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <motion.span
        className="text-xs font-bold"
        style={{ color: COLORS.textSecondary }}
      >
        NITRO
      </motion.span>

      <div className="relative w-full h-6">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${COLORS.border}`,
          }}
        />

        <motion.div
          className="absolute top-1 bottom-1 left-1 rounded-full overflow-hidden"
          style={{
            width: `${width - 2}%`,
          }}
          animate={{ width: `${Math.max(1, width - 2)}%` }}
          transition={{ duration: 0.2, ease: "linear" }}
        >
          <div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.accent}, ${COLORS.primary})`,
            }}
          >
            {active && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: COLORS.accent }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              />
            )}

            <motion.div
              className="absolute top-0 bottom-0 right-0 w-2 rounded-full"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                boxShadow: "0 0 5px rgba(255, 255, 255, 0.8)",
              }}
            />
          </div>
        </motion.div>

        {active && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`flame-${i}`}
                className="absolute bottom-[-2px] w-2 h-4 rounded-full"
                style={{
                  background: COLORS.accent,
                  left: `${20 + i * 30}%`,
                  boxShadow: `0 0 10px ${COLORS.accent}`,
                }}
                initial={{ scale: 0.5, opacity: 0, y: 0 }}
                animate={{
                  scale: [0.5, 1.2, 0.5],
                  opacity: [0, 0.8, 0],
                  y: [-5, -15, -5],
                }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                }}
              />
            ))}
          </>
        )}
      </div>

      <motion.span
        className="text-sm font-bold"
        style={{ color: getNitroColor() }}
        animate={{ opacity: active ? 1 : 0.7 }}
      >
        {Math.round(level)}
      </motion.span>
    </motion.div>
  );
});

NitroBar.displayName = "NitroBar";
export default NitroBar;


