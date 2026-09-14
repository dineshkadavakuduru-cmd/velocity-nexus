"use client";

import { memo, useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface LapCounterProps {
  currentLap: number;
  totalLaps: number;
  checkpoint: number;
  totalCheckpoints: number;
  className?: string;
}

export const LapCounter = memo(({
  currentLap = 1,
  totalLaps = 3,
  checkpoint = 0,
  totalCheckpoints = 10,
  className = "",
}: LapCounterProps) => {
  const prevLapRef = useRef(currentLap);
  const [lapJustCompleted, setLapJustCompleted] = useState(false);

  useEffect(() => {
    if (currentLap > prevLapRef.current) {
      prevLapRef.current = currentLap;
      setLapJustCompleted(true);
      const timer = setTimeout(() => setLapJustCompleted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentLap]);

  const checkpointRatio = totalCheckpoints > 0 ? checkpoint / totalCheckpoints : 0;
  const progress = ((currentLap - 1 + checkpointRatio) / totalLaps) * 100;

  return (
    <motion.div
      className={`
        fixed top-6 right-6 z-50
        flex items-center gap-4
        px-6 py-3
        rounded-2xl
        font-display
        ${className}
      `}
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${COLORS.border}`,
        boxShadow: `${COLORS.primary}20 0 0 2px`,
      }}
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex flex-col items-center">
        <motion.span
          className="text-sm text-secondary"
          key={`lap-label-${currentLap}`}
        >
          LAP
        </motion.span>
        <div className="flex items-center gap-1">
          <motion.span
            className="text-3xl font-black"
            style={{ color: COLORS.primary }}
            key={`lap-${currentLap}`}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            {currentLap}
          </motion.span>
          <span className="text-xl text-secondary font-bold">/</span>
          <motion.span
            className="text-2xl font-bold"
            style={{ color: COLORS.textSecondary }}
          >
            {totalLaps}
          </motion.span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <motion.span
          className="text-sm text-secondary mb-1"
          key={`cp-label-${checkpoint}`}
        >
          CHECKPOINT {checkpoint}/{totalCheckpoints}
        </motion.span>
        <div className="w-24 h-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
              width: `${checkpointRatio * 100}%`,
            }}
            animate={{ width: `${checkpointRatio * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <motion.span
          className="text-xs text-secondary"
        >
          RACE PROGRESS
        </motion.span>
        <div className="w-20 h-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.primary})`,
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {lapJustCompleted && (
        <motion.div
          className="absolute -inset-4 rounded-2xl"
          style={{
            background: `radial-gradient(circle, ${COLORS.primary}40, transparent 70%)`,
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
});

LapCounter.displayName = "LapCounter";
export default LapCounter;


