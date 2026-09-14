"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface FloatingDockProps {
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
  }>;
  className?: string;
  position?: "bottom" | "left" | "top" | "right";
}

export const FloatingDock = memo(({
  items,
  className = "",
  position = "bottom",
}: FloatingDockProps) => {
  const positionClasses = {
    bottom: "fixed bottom-8 left-1/2 -translate-x-1/2 flex-row",
    left: "fixed left-8 top-1/2 -translate-y-1/2 flex-col",
    top: "fixed top-8 left-1/2 -translate-x-1/2 flex-row",
    right: "fixed right-8 top-1/2 -translate-y-1/2 flex-col",
  };

  return (
    <div
      className={`
        flex
        gap-3
        p-3
        rounded-full
        ${positionClasses[position]}
        ${className}
      `}
      style={{
        background: "rgba(17, 17, 17, 0.6)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${COLORS.border}`,
        boxShadow: `${COLORS.primary}20 0 0 2px, ${COLORS.secondary}10 0 0 4px`,
      }}
    >
      {items.map((item) => (
        <FloatingDockItem
          key={item.id}
          item={item}
        />
      ))}
    </div>
  );
});

interface FloatingDockItemProps {
  item: {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
  };
}

const FloatingDockItem = ({ item }: FloatingDockItemProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300"
      style={{
        background: item.active
          ? `linear-gradient(135deg, ${COLORS.primary}30, ${COLORS.secondary}30)`
          : "rgba(30, 30, 30, 0.6)",
        border: `1px solid ${item.active ? COLORS.primary : COLORS.border}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={item.onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          item.onClick();
        }
      }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      tabIndex={0}
      aria-label={item.label}
    >
      <motion.div
        style={{ color: item.active ? COLORS.primary : COLORS.textSecondary }}
        animate={{ scale: hovered ? 1.2 : 1 }}
      >
        {item.icon}
      </motion.div>

      <AnimatePresence>
        {hovered && (
          <motion.span
            className="absolute -bottom-12 px-2 py-1 text-xs font-medium rounded-md"
            style={{
              background: COLORS.cardBg,
              color: COLORS.textPrimary,
              border: `1px solid ${COLORS.border}`,
            }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

import { useState } from "react";
import { AnimatePresence } from "motion/react";

FloatingDock.displayName = "FloatingDock";
export default FloatingDock;


