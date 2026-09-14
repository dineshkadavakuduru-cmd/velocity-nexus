"use client";

import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NeonText, SparklesBackground, GlassmorphicPanel, MagneticButton } from "@/components/ui";
import { COLORS, CAR_CONFIGS, TRACK_CONFIGS } from "@/lib/constants";
import { useGameStore } from "@/stores/gameStore";
import { useRouter } from "next/navigation";

const ResultsPage = () => {
  const router = useRouter();
  const { raceResults, selectedCarId, selectedTrackId, raceTime } = useGameStore();
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (raceResults) {
      const timer = setTimeout(() => setShowResults(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [raceResults]);

  const selectedCar = CAR_CONFIGS.find((c) => c.id === selectedCarId) || CAR_CONFIGS[0];
  const selectedTrack = TRACK_CONFIGS.find((t) => t.id === selectedTrackId) || TRACK_CONFIGS[0];

  const defaultResults = raceResults || [
    { id: "1", name: "You", finishTime: raceTime || 65.43, position: 1 },
  ];

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      <SparklesBackground className="absolute inset-0" density={1.5} />

      <div className="relative z-10 min-h-screen flex flex-col items-center py-16 px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <NeonText color={COLORS.accent} glowIntensity="high" className="text-4xl sm:text-6xl mb-4">
            RACE COMPLETE
          </NeonText>
        </motion.div>

        <AnimatePresence>
          {showResults && (
            <motion.div
              className="w-full max-w-4xl"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <NeonText color={COLORS.primary} className="text-2xl">
                    {selectedCar.name}
                  </NeonText>
                  <p className="text-sm text-secondary mt-1">Selected Car</p>
                </motion.div>

                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <NeonText color={COLORS.secondary} className="text-2xl">
                    {selectedTrack.name}
                  </NeonText>
                  <p className="text-sm text-secondary mt-1">Track</p>
                </motion.div>

                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <NeonText color={COLORS.accent} className="text-2xl">
                    {Math.floor(raceTime / 60)}:{Math.floor((raceTime || 0) % 60).toString().padStart(2, "0")}
                  </NeonText>
                  <p className="text-sm text-secondary mt-1">Race Time</p>
                </motion.div>
              </div>

              <GlassmorphicPanel className="mb-8" padding="p-8" hover>
                <NeonText color={COLORS.primary} className="text-2xl mb-6 text-center">
                  LEADERBOARD
                </NeonText>

                <div className="space-y-3">
                  {defaultResults
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((result, i) => (
                      <motion.div
                        key={result.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                          background: i === 0
                            ? `${COLORS.accent}15`
                            : "rgba(30, 30, 30, 0.5)",
                          border: `1px solid ${i === 0 ? COLORS.accent : COLORS.border}`,
                        }}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.span
                            className="text-2xl font-display font-black"
                            style={{
                              color: i === 0
                                ? COLORS.accent
                                : i === 1
                                ? COLORS.secondary
                                : i === 2
                                ? COLORS.primary
                                : COLORS.textSecondary,
                            }}
                          >
                            #{result.position}
                          </motion.span>
                          <span className="font-medium">{result.name}</span>
                        </div>

                        <motion.span
                          className="font-display font-bold"
                          style={{ color: COLORS.primary }}
                        >
                          {Math.floor(result.finishTime / 60)}:{Math.floor(result.finishTime % 60).toString().padStart(2, "0")}.{Math.floor((result.finishTime % 1) * 1000).toString().padStart(3, "0")}
                        </motion.span>
                      </motion.div>
                    ))}
                </div>
              </GlassmorphicPanel>

              <div className="flex justify-center gap-4">
                <MagneticButton
                  onClick={() => router.push("/race?mode=single")}
                  variant="primary"
                  size="lg"
                >
                  RACE AGAIN
                </MagneticButton>

                <MagneticButton
                  onClick={() => router.push("/")}
                  variant="secondary"
                  size="lg"
                >
                  BACK TO MENU
                </MagneticButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResultsPage;


