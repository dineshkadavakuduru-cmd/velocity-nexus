"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { COLORS } from "@/lib/constants";
import React from "react";

export interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  gradientColors?: string[];
  animate?: boolean;
  intensity?: "low" | "medium" | "high";
  onClick?: () => void;
  as?: keyof React.JSX.IntrinsicElements;
}

export const AnimatedGradientText = memo(({
  children,
  className = "",
  gradientColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.primary],
  animate = true,
  intensity = "high",
  onClick,
  as = "span",
}: AnimatedGradientTextProps) => {
  const intensityMap = {
    low: "text-transparent bg-clip-text bg-gradient-to-r",
    medium: "text-transparent bg-clip-text bg-gradient-to-r drop-shadow-md",
    high: "text-transparent bg-clip-text bg-gradient-to-r drop-shadow-[0_0_15px_rgba(0,240,255,0.5)] drop-shadow-[0_0_30px_rgba(255,0,255,0.3)]",
  };

  const gradient = `from-[${gradientColors[0]}] via-[${gradientColors[1]}] to-[${gradientColors[2]}]`;

  const baseClasses = `${intensityMap[intensity]} font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight`;

  if (onClick) {
    return (
      <motion.span
        className={`${baseClasses} ${className} cursor-pointer`}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.span
          className="bg-clip-text text-transparent bg-gradient-to-r font-black"
          style={{
            background: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
            backgroundSize: animate ? "300% 300%" : "100% 100%",
          }}
          animate={
            animate
              ? {
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }
              : {}
          }
          transition={{
            duration: 3,
            repeat: animate ? Infinity : 1,
            ease: "linear",
          }}
        >
          {children}
        </motion.span>
      </motion.span>
    );
  }

  const initialProps = animate ? { opacity: 0, y: 50 } : {};
  const animateProps = animate ? { opacity: 1, y: 0 } : {};

  return (
    <motion.span
      className={`${baseClasses} ${className}`}
      initial={initialProps}
      animate={animateProps}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <motion.span
        className="bg-clip-text text-transparent bg-gradient-to-r font-black"
        style={{
          background: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
          backgroundSize: animate ? "400% 400%" : "100% 100%",
        }}
        animate={
          animate
            ? {
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }
            : {}
        }
        transition={{
          duration: 4,
          repeat: animate ? Infinity : 1,
          ease: "linear",
          delay: 0.2,
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
});

AnimatedGradientText.displayName = "AnimatedGradientText";
export default AnimatedGradientText;


