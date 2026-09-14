"use client";

import { memo, useState, useRef } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { COLORS } from "@/lib/constants";

export interface SpotlightCardProps {
  children?: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
  image?: string;
  title?: string;
  subtitle?: string;
  active?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export const SpotlightCard = memo(({
  children,
  className = "",
  spotlightColor = COLORS.primary,
  onClick,
  image,
  title,
  subtitle,
  active = false,
  disabled = false,
  onSelect,
}: SpotlightCardProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMouseX(e.clientX - rect.left);
    setMouseY(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`
        relative
        rounded-2xl
        overflow-hidden
        cursor-${onClick ? "pointer" : "default"}
        ${disabled ? "opacity-50" : ""}
        ${active ? "ring-2 ring-offset-2 ring-offset-black" : ""}
        ${className}
      `}
      style={{
        background: "rgba(17, 17, 17, 0.7)",
        backdropFilter: "blur(20px)",
        borderColor: active ? spotlightColor : COLORS.border,
        borderWidth: active ? "2px" : "1px",
        borderStyle: "solid",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={disabled ? undefined : onClick ?? onSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={!disabled ? { scale: 1.03, y: -5 } : {}}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {isHovered && (
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${spotlightColor} 0%, transparent 70%)`,
              left: mouseX - 170,
              top: mouseY - 170,
              opacity: 0.3,
            }}
          />
        )}
      </div>

      <div className="absolute inset-0">
        {isHovered && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(
                circle at ${mouseX}px ${mouseY}px,
                ${spotlightColor}40 0%,
                transparent 70%
              )`,
            }}
          />
        )}
      </div>

      {image && (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={image}
            alt={title || ""}
            fill
            className="object-cover transition-transform duration-500"
            style={{ transform: isHovered ? "scale(1.1)" : "scale(1)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      )}

      <div className="relative p-6">
        {title && (
          <h3
            className="text-2xl font-display font-bold mb-1"
            style={{
              color: spotlightColor,
              textShadow: `0 0 10px ${spotlightColor}60, 0 0 20px ${spotlightColor}30`,
            }}
          >
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-secondary mb-4 opacity-80">{subtitle}</p>
        )}
        {children}
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: isHovered
            ? `inset 0 0 40px ${spotlightColor}20`
            : "none",
        }}
      />
    </motion.div>
  );
});

SpotlightCard.displayName = "SpotlightCard";
export default SpotlightCard;


