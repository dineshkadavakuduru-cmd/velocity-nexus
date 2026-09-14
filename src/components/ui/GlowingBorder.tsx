"use client";

import { memo, useState, useRef, useEffect } from "react";
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
  animate = true,
  rounded = true,
  padding = "p-4",
}: GlowingBorderProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const intensityMap = {
    low: `0 0 10px ${color}40, 0 0 20px ${color}20`,
    medium: `0 0 15px ${color}50, 0 0 30px ${color}30`,
    high: `0 0 20px ${color}70, 0 0 40px ${color}40, 0 0 60px ${color}20`,
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

      {animate && (
        <motion.div
          className="absolute inset-0 rounded-xl -z-10"
          style={{
            background: `conic-gradient(45deg, ${color}40, transparent, ${color}40)`,
            filter: "blur(2px)",
          }}
          animate={{
            rotate: isHovered ? 360 : 0,
            opacity: isHovered ? 0.6 : 0.3,
          }}
          transition={{
            rotate: { duration: 8, ease: "linear" },
            opacity: { duration: 0.3 },
          }}
        />
      )}
    </motion.div>
  );
});

GlowingBorder.displayName = "GlowingBorder";
export default GlowingBorder;


