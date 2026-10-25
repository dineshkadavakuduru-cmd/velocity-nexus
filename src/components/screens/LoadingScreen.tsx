"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedGradientText } from "@/components/ui";
import { COLORS } from "@/lib/constants";
import { CAR_CONFIGS } from "@/lib/constants";

interface LoadingScreenProps {
  onComplete?: () => void;
  progress?: number;
  error?: string | null;
  onRetry?: () => void;
  timeoutMs?: number;
  /** What is currently being prepared, shown next to the percentage. */
  label?: string;
}

const LoadingScreen = ({
  onComplete,
  progress: externalProgress,
  error: externalError,
  onRetry,
  timeoutMs = 30000,
  label = "Preparing the track",
}: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
      if (externalProgress >= 100) setLoaded(true);
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

  // No infinite loader: fail visibly if loading stalls.
  useEffect(() => {
    if (loaded || externalError) return;
    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [loaded, externalError, timeoutMs]);

  useEffect(() => {
    if (loaded && progress >= 100) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loaded, progress, onComplete]);

  const failed = Boolean(externalError || timedOut);
  const failureMessage = externalError ??
    "The track did not finish loading. It may be a slow connection or a blocked asset — retry, or head back and pick another track.";

  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="status"
          aria-live="polite"
          aria-busy={!failed}
        >
          <div className="w-full max-w-md text-center">
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
              className="w-full max-w-xs mx-auto h-2 rounded-full overflow-hidden mb-4"
              style={{ background: COLORS.border }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={failed ? undefined : pct}
              aria-valuetext={failed ? undefined : `${pct}%`}
              aria-label={label}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
                  width: `${pct}%`,
                }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>

            {failed ? (
              <div
                role="alert"
                className="mt-4 rounded-xl px-5 py-4"
                style={{ background: `${COLORS.accent}14`, border: `1px solid ${COLORS.accent}` }}
              >
                <p className="font-display font-bold text-sm tracking-widest mb-1" style={{ color: COLORS.accent }}>
                  TRACK PREPARATION FAILED
                </p>
                <p className="text-sm text-secondary">{failureMessage}</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => (onRetry ? onRetry() : window.location.reload())}
                    className="px-6 py-2 rounded-xl font-display font-bold"
                    style={{ border: `1px solid ${COLORS.primary}`, color: COLORS.primary }}
                  >
                    RETRY
                  </button>
                  <a
                    href="/"
                    className="px-6 py-2 rounded-xl font-display font-bold text-secondary underline underline-offset-4 hover:text-foreground"
                  >
                    Back to menu
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-sm text-secondary" aria-hidden="true">
                {label}… {pct}%
              </div>
            )}

            {!failed && (
              <motion.div
                className="mt-8 flex justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                aria-hidden="true"
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
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
