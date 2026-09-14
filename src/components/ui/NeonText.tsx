"use client";

import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  low: (color: string) => `0 0 5px ${color}, 0 0 10px ${color}40`,
  medium: (color: string) => `0 0 10px ${color}, 0 0 20px ${color}60, 0 0 30px ${color}30`,
  high: (color: string) => `0 0 15px ${color}, 0 0 30px ${color}70, 0 0 45px ${color}40, 0 0 60px ${color}20`,
};

export const NeonText = memo(({
  children,
  className = "",
  color = COLORS.primary,
  glowIntensity = "high",
  flickering = true,
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

  const flickerAnimation = flickering
    ? {
        opacity: [1, 0.8, 1, 0.9, 1],
        filter: [
          `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 15px ${color})`,
          `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 10px ${color}60)`,
          `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 15px ${color})`,
          `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 12px ${color}50)`,
          `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 15px ${color})`,
        ],
      }
    : {};

  const animation = flickering ? flickerAnimation : undefined;

  const MotionTag = motion(tag as string);
  const visibleText = animateIn ? chars.slice(0, visibleChars).join("") : children;

  const baseStyle: React.CSSProperties = {
    color,
    textShadow: GlowMap[glowIntensity](color),
    letterSpacing: "0.1em",
  };

  return (
    <motion.div
      style={baseStyle}
      className={`inline-block font-display font-black tracking-wider ${className}`}
      initial={animateIn ? { opacity: 0, x: -50 } : undefined}
      animate={animation ?? (animateIn ? { opacity: 1, x: 0 } : undefined)}
      transition={{
        duration: animateIn ? 0.5 : 2 + Math.random(),
        delay: animateIn ? delay : undefined,
        repeat: flickering && !animateIn ? Infinity : undefined,
        repeatType: "loop",
        ease: "easeInOut",
      }}
    >
      {animateIn ? (
        <AnimatePresence>
          {chars.slice(0, visibleChars).map((char: string, i: number) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 + delay }}
              style={{ display: "inline-block" }}
            >
              {char}
            </motion.span>
          ))}
        </AnimatePresence>
      ) : (
        children
      )}
    </motion.div>
  );
});

NeonText.displayName = "NeonText";
export default NeonText;


