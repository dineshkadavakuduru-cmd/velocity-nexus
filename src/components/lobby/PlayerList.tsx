"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassmorphicPanel, NeonText, MagneticButton } from "@/components/ui";
import { useLobbyStore } from "@/stores/lobbyStore";
import { COLORS } from "@/lib/constants";

type Player = {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  carId: string;
  isConnected: boolean;
};

export const PlayerList = () => {
  const { players, isHost, setReady } = useLobbyStore();
  const [localReady, setLocalReady] = useState(false);

  const handleReadyToggle = useCallback(() => {
    const newReady = !localReady;
    setLocalReady(newReady);
    setReady(newReady);
  }, [localReady, setReady]);

  const playerColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.primaryLight, COLORS.secondaryLight];

  return (
    <GlassmorphicPanel className="w-full" padding="p-6" hover>
      <NeonText color={COLORS.primary} className="text-xl mb-4">
        PLAYERS
      </NeonText>

      <div className="space-y-3">
        <AnimatePresence>
          {players.map((player, i) => (
            <motion.div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(20, 20, 20, 0.5)",
                border: `1px solid ${player.isReady ? COLORS.accent : COLORS.border}`,
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.1 }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg"
                style={{
                  background: `linear-gradient(135deg, ${playerColors[i % playerColors.length]}40, ${playerColors[i % playerColors.length]}20)`,
                  border: `2px solid ${playerColors[i % playerColors.length]}`,
                  color: playerColors[i % playerColors.length],
                }}
              >
                {player.name.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{player.name}</span>
                  {player.isHost && (
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                      HOST
                    </span>
                  )}
                </div>
                <span className="text-xs text-secondary">
                  {player.carId || "phantom-gt"}
                </span>
              </div>

              <AnimatePresence>
                {player.isReady && (
                  <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{ background: COLORS.accent }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6">
        <div className="flex gap-2 mb-2 text-xs text-secondary">
          <span>READY WHEN YOU ARE</span>
          <span>{players.filter(p => p.isReady).length}/{players.length}</span>
        </div>
        <MagneticButton
          onClick={handleReadyToggle}
          variant={localReady ? "secondary" : "primary"}
          size="lg"
          className="w-full"
          active={localReady}
        >
          {localReady ? "CANCEL READY" : "READY TO RACE"}
        </MagneticButton>
      </div>
    </GlassmorphicPanel>
  );
};


