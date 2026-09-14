"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NeonText, AnimatedGradientText } from "@/components/ui";
import { COLORS } from "@/lib/constants";
import { CAR_CONFIGS } from "@/lib/constants";

interface LoadingScreenProps {
  onComplete?: () => void;
  progress?: number;
}

const LoadingScreen = ({ onComplete, progress: externalProgress }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
    } else {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setLoaded(true);
            return 100;
          }
          return prev + Math.random() * 5;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [externalProgress]);

  useEffect(() => {
    if (loaded && progress >= 100) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loaded, progress, onComplete]);

  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <motion.div
              className="mb-8"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <AnimatedGradientText
                gradientColors={[COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.primary]}
              >
                VELOCITY NEXUS
              </AnimatedGradientText>
            </motion.div>

            <motion.div
              className="w-64 h-2 mx-auto rounded-full overflow-hidden mb-4"
              style={{ background: COLORS.border }}
              initial={{ width: 0 }}
              animate={{ width: 256 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
                  width: `${progress}%`,
                }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>

            <motion.div
              className="text-sm text-secondary"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Loading... {Math.round(progress)}%
            </motion.div>

            <motion.div
              className="mt-8 flex justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {CAR_CONFIGS.slice(0, 6).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: i % 2 === 0 ? COLORS.primary : COLORS.secondary }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.1,
                    repeat: Infinity,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;


