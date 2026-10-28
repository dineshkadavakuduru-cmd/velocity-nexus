"use client";

import { memo, useState, useRef } from "react";
import { motion } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface GlowingBorderProps {
  children?: React.ReactNode;
  className?: string;
  color?: string;
  intensity?: "low" | "medium" | "high";
  animate?: boolean;
  rounded?: boolean;
  padding?: string;
}

export const GlowingBorder = memo(({
  children,
  className = "",
  color = COLORS.primary,
  intensity = "medium",
  animate = false,
  rounded = true,
  padding = "p-4",
}: GlowingBorderProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const intensityMap = {
    low: `0 0 8px ${color}40, 0 0 16px ${color}20`,
    medium: `0 0 12px ${color}50, 0 0 24px ${color}30`,
    high: `0 0 16px ${color}70, 0 0 32px ${color}40`,
  };

  const boxShadow = isHovered
    ? intensityMap.high
    : intensityMap[intensity];

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${rounded ? "rounded-xl" : "rounded-none"} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div
        className={`relative ${rounded ? "rounded-xl" : ""} overflow-hidden ${padding}`}
        style={{
          background: "rgba(17, 17, 17, 0.7)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${color}40`,
          boxShadow: boxShadow,
        }}
      >
        {children}
      </div>
    </motion.div>
  );
});

GlowingBorder.displayName = "GlowingBorder";
export default GlowingBorder;


