"use client";

import { memo, useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface MagneticButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "accent";
  glowColor?: string;
  disabled?: boolean;
}

export const MagneticButton = memo(({
  children,
  className = "",
  onClick,
  active = false,
  size = "md",
  variant = "primary",
  glowColor,
  disabled = false,
}: MagneticButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const spring = { type: "spring", stiffness: 300, damping: 30 };
  const springX = useSpring(x, spring);
  const springY = useSpring(y, spring);

  const variantColors: Record<string, string> = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    accent: COLORS.accent,
  };

  const color = glowColor || variantColors[variant];

  const sizeClasses: Record<string, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const maxDistance = Math.max(rect.width, rect.height) / 2;
    x.set((deltaX / maxDistance) * 10);
    y.set((deltaY / maxDistance) * 10);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const buttonStyle: React.CSSProperties = {
    background: disabled
      ? "rgba(40, 40, 40, 0.5)"
      : "linear-gradient(135deg, rgba(17, 17, 17, 0.8), rgba(10, 10, 10, 0.9))",
    boxShadow: isHovered && !disabled
      ? `${color}40 0 0 20px 2px, ${color}20 0 0 30px 4px`
      : `${color}20 0 0 0px`,
  };

  return (
    <motion.button
      ref={btnRef}
      className={`
        ${sizeClasses[size]}
        relative
        font-display font-bold
        rounded-full
        transition-all duration-300
        border-2
        flex items-center justify-center
        gap-2
        ${active ? "border-white" : `border-[${color}]40`}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      style={{ ...buttonStyle, x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={disabled ? undefined : onClick}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
    >
      {isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color}30, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {children}
    </motion.button>
  );
});

MagneticButton.displayName = "MagneticButton";
export default MagneticButton;


