"use client";

import { memo, useState, useRef } from "react";
import { motion } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface GlassmorphicPanelProps {
  children?: React.ReactNode;
  className?: string;
  opacity?: number;
  blur?: number;
  border?: boolean;
  borderColor?: string;
  rounded?: boolean;
  padding?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassmorphicPanel = memo(({
  children,
  className = "",
  opacity = 0.15,
  blur = 20,
  border = true,
  borderColor = COLORS.border,
  rounded = true,
  padding = "p-6",
  hover = false,
  onClick,
}: GlassmorphicPanelProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={panelRef}
      className={`
        relative
        ${rounded ? "rounded-2xl" : "rounded-none"}
        ${className}
      `}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        background: `rgba(17, 17, 17, ${opacity})`,
        backdropFilter: `blur(${blur}px)`,
        borderColor: border ? borderColor : "transparent",
        borderWidth: border ? "1px" : "0",
        borderStyle: "solid",
        boxShadow: isHovered
          ? `${COLORS.primary}20 0 0 2px inset, ${COLORS.primary}30 0 0 4px, ${COLORS.secondary}20 0 0 8px`
          : `${COLORS.primary}10 0 0 1px inset`,
      }}
    >
      {border && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: rounded ? "1rem" : "0",
            border: `1px solid transparent`,
            background: `linear-gradient(
              135deg,
              ${COLORS.primary}30,
              ${COLORS.secondary}30,
              ${COLORS.accent}30
            )`,
            backgroundClip: "border-box",
            mask: "linear-gradient(#fff 0 0 0 100%) content-box, linear-gradient(#fff 0 0 0 100%)",
            maskComposite: "exclude",
            opacity: isHovered ? 1 : 0.5,
          }}
          animate={{ opacity: isHovered ? 1 : 0.5 }}
        />
      )}

      {children}
    </motion.div>
  );
});

GlassmorphicPanel.displayName = "GlassmorphicPanel";
export default GlassmorphicPanel;


