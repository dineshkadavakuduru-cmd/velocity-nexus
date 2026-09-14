"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { SpotlightCard, NeonText, GlassmorphicPanel } from "@/components/ui";
import { TRACK_CONFIGS } from "@/lib/constants";
import { COLORS } from "@/lib/constants";
import { useGameStore } from "@/stores/gameStore";

const TrackPreview = () => {
  const router = useRouter();
  const setSelectedTrack = useGameStore((s) => s.setSelectedTrack);
  const setSelectedCar = useGameStore((s) => s.setSelectedCar);

  const handleTrackSelect = (trackId: string) => {
    setSelectedTrack(trackId);
    router.push("/race?mode=single");
  };

  const difficultyColors = {
    Easy: COLORS.secondary,
    Medium: COLORS.primary,
    Hard: COLORS.accent,
    Expert: COLORS.accent,
  };

  return (
    <div className="min-h-screen w-full bg-background py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <NeonText color={COLORS.primary} glowIntensity="high" className="text-4xl sm:text-5xl mb-4">
            SELECT TRACK
          </NeonText>
          <motion.p
            className="text-secondary max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Choose your battleground. Each track presents unique challenges with different weather, time of day, and surface conditions.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TRACK_CONFIGS.map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <SpotlightCard
                title={track.name}
                subtitle={`${track.difficulty} â€¢ ${track.length / 1000}km â€¢ ${track.laps} laps`}
                image={`/tracks/${track.thumbnail}`}
                spotlightColor={difficultyColors[track.difficulty]}
                onSelect={() => handleTrackSelect(track.id)}
              >
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Weather</span>
                    <span style={{ color: difficultyColors[track.difficulty] }}>{track.weather}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Time</span>
                    <span style={{ color: COLORS.textSecondary }}>{track.timeOfDay}</span>
                  </div>
                  <p className="text-xs text-secondary mt-2 leading-relaxed">
                    {track.description}
                  </p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassmorphicPanel className="inline-block" padding="px-6 py-3">
            <span className="text-sm text-secondary">
              {TRACK_CONFIGS.length} tracks available. Select one to begin.
            </span>
          </GlassmorphicPanel>
        </motion.div>
      </div>
    </div>
  );
};

export default TrackPreview;


