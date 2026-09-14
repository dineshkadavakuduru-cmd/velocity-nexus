"use client";

import { memo, useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface SpeedGaugeProps {
  speed: number;
  maxSpeed: number;
  rpm: number;
  maxRpm: number;
  gear: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export const SpeedGauge = memo(({
  speed = 0,
  maxSpeed = 400,
  rpm = 0,
  maxRpm = 8500,
  gear = 1,
  className = "",
  size = "md",
  animated = true,
}: SpeedGaugeProps) => {
  const gaugeRef = useRef<HTMLDivElement>(null);
  const needleRotation = useMotionValue(0);
  const [isMounted, setIsMounted] = useState(false);

  const speedRatio = Math.min(1, speed / maxSpeed);
  const rpmRatio = Math.min(1, rpm / maxRpm);

  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
  };

  useEffect(() => {
    setIsMounted(true);
    if (animated) {
      animate(needleRotation, speedRatio * 270 - 135, {
        type: "spring",
        stiffness: 200,
        damping: 20,
      });
    } else {
      needleRotation.set(speedRatio * 270 - 135);
    }
  }, [speedRatio, needleRotation, animated]);

  const gaugeColor = rpmRatio > 0.8
    ? COLORS.accent
    : rpmRatio > 0.5
    ? COLORS.secondary
    : COLORS.primary;

  const needleTransform = useTransform(needleRotation, (v) => `${v}deg`);

  if (!isMounted) return null;

  return (
    <motion.div
      ref={gaugeRef}
      className={`relative ${sizeClasses[size]} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={COLORS.primary} />
              <stop offset="50%" stopColor={COLORS.secondary} />
              <stop offset="100%" stopColor={COLORS.accent} />
            </linearGradient>
            <linearGradient id="gaugeFill" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00e676" />
              <stop offset="100%" stopColor={gaugeColor} />
            </linearGradient>
          </defs>

          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke={COLORS.border}
            strokeWidth="4"
            strokeDasharray="534"
            strokeDashoffset={534 - (534 * speedRatio)}
            transform="rotate(-135 100 100)"
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />

          <path
            d="M100,25 A75,75 0 1,1 25,100 A75,75 0 0,1 100,25 Z"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="2"
            opacity="0.3"
          />

          <motion.line
            x1="100"
            y1="100"
            x2="100"
            y2="40"
            stroke={gaugeColor}
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              transformOrigin: "50% 50%",
              rotate: needleTransform,
            }}
          />

          <polygon
            points="95,100 105,95 110,105 100,110 90,105"
            fill={gaugeColor}
          />

          <text
            x="100"
            y="110"
            textAnchor="middle"
            className="font-display font-bold"
            fontSize="20"
            fill={COLORS.textPrimary}
          >
            {Math.round(speed)}
          </text>

          <text
            x="100"
            y="130"
            textAnchor="middle"
            className="font-display font-bold"
            fontSize="12"
            fill={COLORS.textSecondary}
          >
            KM/H
          </text>
        </svg>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <span
          className="text-xs font-display font-bold px-2 py-1 rounded"
          style={{
            color: COLORS.textPrimary,
            background: `rgba(0, 0, 0, 0.5)`,
          }}
        >
          GEAR {gear}
        </span>
      </div>

      <div className="absolute top-2 right-2">
        <div className="w-4 h-4 rounded-full" style={{ background: gaugeColor }} />
      </div>
    </motion.div>
  );
});

SpeedGauge.displayName = "SpeedGauge";
export default SpeedGauge;


