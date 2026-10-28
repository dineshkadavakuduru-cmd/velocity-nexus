"use client";

import { memo, useState, useEffect } from "react";
import { motion } from "motion/react";
import { COLORS } from "@/lib/constants";
import React from "react";
import type { JSX } from "react";

export interface NeonTextProps {
  children: React.ReactNode | string;
  className?: string;
  color?: string;
  glowIntensity?: "low" | "medium" | "high";
  flickering?: boolean;
  animateIn?: boolean;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  delay?: number;
}

const GlowMap = {
  low: (color: string) => `0 0 4px ${color}40`,
  medium: (color: string) => `0 0 6px ${color}55, 0 0 12px ${color}25`,
  high: (color: string) => `0 0 8px ${color}60, 0 0 16px ${color}30`,
};

export const NeonText = memo(({
  children,
  className = "",
  color = COLORS.primary,
  glowIntensity = "medium",
  flickering = false,
  animateIn = false,
  tag = "span",
  delay = 0,
}: NeonTextProps) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const childrenStr = typeof children === "string" ? children : String(children);
  const chars = childrenStr.split("");

  useEffect(() => {
    if (animateIn) {
      let i = 0;
      const interval = setInterval(() => {
        if (i < chars.length) {
          setVisibleChars(i + 1);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [animateIn, chars.length]);

  const baseStyle: React.CSSProperties = {
    color,
    textShadow: GlowMap[glowIntensity](color),
    letterSpacing: "0.08em",
  };

  return (
    <motion.div
      style={baseStyle}
      className={`inline-block font-display font-bold tracking-wide ${className}`}
      initial={animateIn ? { opacity: 0, y: 20 } : undefined}
      animate={animateIn ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: animateIn ? 0.4 : 0,
        delay: animateIn ? delay : undefined,
        ease: "easeOut",
      }}
    >
      {animateIn ? (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay }}
          style={{ display: "inline-block" }}
        >
          {children}
        </motion.span>
      ) : (
        children
      )}
    </motion.div>
  );
});

NeonText.displayName = "NeonText";
export default NeonText;


