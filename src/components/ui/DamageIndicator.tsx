"use client";

import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { COLORS } from "@/lib/constants";
import { DamageState } from "@/types";

export interface DamageIndicatorProps {
  damage: DamageState;
  className?: string;
}

export const DamageIndicator = memo(({
  damage = { front: 0, rear: 0, left: 0, right: 0 },
  className = "",
}: DamageIndicatorProps) => {
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const [lastDamage, setLastDamage] = useState(damage);

  useEffect(() => {
    const totalDamage = damage.front + damage.rear + damage.left + damage.right;
    const prevTotal = lastDamage.front + lastDamage.rear + lastDamage.left + lastDamage.right;
    if (totalDamage > prevTotal) {
      setShowDamageFlash(true);
      const timer = setTimeout(() => setShowDamageFlash(false), 500);
      return () => clearTimeout(timer);
    }
    setLastDamage(damage);
  }, [damage, lastDamage]);

  const maxZoneDamage = Math.max(damage.front, damage.rear, damage.left, damage.right);
  const overallDamage = (damage.front + damage.rear + damage.left + damage.right) / 4;

  const getDamageColor = (zoneDamage: number) => {
    if (zoneDamage > 0.7) return COLORS.accent;
    if (zoneDamage > 0.4) return COLORS.secondary;
    if (zoneDamage > 0.2) return COLORS.primary;
    return COLORS.textMuted;
  };

  return (
    <motion.div
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-2
        px-3 py-2
        rounded-lg
        font-display text-xs
        ${className}
      `}
      style={{
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${COLORS.border}`,
      }}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
        <rect x="10" y="10" width="100" height="40" rx="5" stroke={COLORS.border} strokeWidth="1" />

        <rect
          x="12"
          y="12"
          width={15}
          height={36}
          style={{
            fill: getDamageColor(damage.front),
            opacity: damage.front * 0.7 + 0.1,
          }}
        />

        <rect
          x="93"
          y="12"
          width={15}
          height={36}
          style={{
            fill: getDamageColor(damage.rear),
            opacity: damage.rear * 0.7 + 0.1,
          }}
        />

        <rect
          x="27"
          y="10"
          width={72}
          height={8}
          style={{
            fill: getDamageColor(damage.left),
            opacity: damage.left * 0.7 + 0.1,
          }}
        />

        <rect
          x="27"
          y="42"
          width={72}
          height={8}
          style={{
            fill: getDamageColor(damage.right),
            opacity: damage.right * 0.7 + 0.1,
          }}
        />

        {damage.front > 0 && (
          <text x="20" y="28" fontSize="8" fill={COLORS.textPrimary} textAnchor="middle">
            {Math.round(damage.front * 100)}%
          </text>
        )}
        {damage.rear > 0 && (
          <text x="100" y="28" fontSize="8" fill={COLORS.textPrimary} textAnchor="middle">
            {Math.round(damage.rear * 100)}%
          </text>
        )}
      </svg>

      <motion.span
        className="font-bold"
        style={{
          color: getDamageColor(overallDamage),
        }}
      >
        {Math.round(overallDamage * 100)}%
      </motion.span>

      <AnimatePresence>
        {showDamageFlash && (
          <motion.div
            className="absolute -inset-2 rounded-lg"
            style={{
              background: `radial-gradient(circle, ${COLORS.accent}40, transparent 70%)`,
            }}
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

DamageIndicator.displayName = "DamageIndicator";
export default DamageIndicator;


