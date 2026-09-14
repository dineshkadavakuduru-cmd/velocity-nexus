"use client";

import { memo, useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface PositionIndicatorProps {
  position: number;
  total: number;
  className?: string;
}

export const PositionIndicator = memo(({
  position = 1,
  total = 4,
  className = "",
}: PositionIndicatorProps) => {
  const prevPositionRef = useRef(position);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (position !== prevPositionRef.current) {
      prevPositionRef.current = position;
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [position]);

  const positionColors = [
    COLORS.accent,
    COLORS.secondary,
    COLORS.primary,
    COLORS.textSecondary,
  ];

  const color = positionColors[Math.min(position - 1, positionColors.length - 1)];

  return (
    <motion.div
      className={`
        fixed top-6 left-6 z-50
        flex items-center gap-3
        px-4 py-2
        rounded-xl
        font-display font-bold text-xl
        ${className}
      `}
      style={{
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(10px)",
        border: `2px solid ${color}`,
        boxShadow: `${color}40 0 0 10px`,
      }}
      animate={{
        borderColor: flash ? COLORS.accent : color,
        scale: flash ? [1, 1.1, 1] : 1,
        boxShadow: flash
          ? `${COLORS.accent}60 0 0 20px`
          : `${color}40 0 0 10px`,
      }}
      transition={{ duration: flash ? 1 : 0.3 }}
      initial={{ opacity: 0, x: -50 }}
      animate-in={{ opacity: 1, x: 0 }}
    >
      <motion.span
        className="text-3xl font-display font-black"
        style={{ color }}
        key={position}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
      >
        P{position}
      </motion.span>
      <span className="text-sm text-secondary">
        / {total}
      </span>
    </motion.div>
  );
});

PositionIndicator.displayName = "PositionIndicator";
export default PositionIndicator;


