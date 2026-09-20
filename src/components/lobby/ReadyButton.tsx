"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { GlassmorphicPanel, MagneticButton, NeonText } from "@/components/ui";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { COLORS, TRACK_CONFIGS } from "@/lib/constants";

export const ReadyButton = () => {
  const { isHost, isReady, setReady, settings, players, roomCode } = useLobbyStore();
  const { startRace, setPlayerReady } = useMultiplayer();
  const [allReady, setAllReady] = useState(false);

  useEffect(() => {
    if (players.length > 0) {
      setAllReady(players.every((p) => p.isReady));
    }
  }, [players]);

  const handleStartRace = useCallback(() => {
    if (!isHost) return;
    startRace();
  }, [isHost, startRace]);

  const handleReadyToggle = useCallback(() => {
    const newReady = !isReady;
    setPlayerReady(newReady);
    setReady(newReady);
  }, [isReady, setReady, setPlayerReady]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <NeonText color={COLORS.secondary} className="text-lg">
          ROOM: {roomCode}
        </NeonText>

          {isHost && (
            <motion.button
              onClick={() => {
                if (roomCode) {
                  navigator.clipboard.writeText(roomCode);
                }
              }}
              className="p-2 rounded-lg text-xs font-display"
              style={{
                background: "rgba(30, 30, 30, 0.6)",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textSecondary,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              COPY CODE
            </motion.button>
          )}
      </div>

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassmorphicPanel className="text-center" padding="p-6">
          <div className="mb-4">
            <span className="text-sm text-secondary">
              {isHost ? "All players ready? Start the race!" : "Waiting for host to start..."}
            </span>
          </div>

          {isHost ? (
            <motion.div
              animate={{
                boxShadow: allReady && players.length >= 2
                  ? `${COLORS.accent}60 0 0 20px, ${COLORS.primary}40 0 0 30px`
                  : `${COLORS.primary}20 0 0 10px`,
              }}
            >
              <MagneticButton
                onClick={handleStartRace}
                variant="accent"
                size="lg"
                className="w-full font-display text-2xl tracking-widest"
                disabled={!allReady || players.length < 2}
              >
                START RACE
              </MagneticButton>
            </motion.div>
          ) : (
            <MagneticButton
              onClick={handleReadyToggle}
              variant={isReady ? "secondary" : "primary"}
              size="lg"
              className="w-full"
              active={isReady}
            >
              {isReady ? "CANCEL READY" : "READY TO RACE"}
            </MagneticButton>
          )}

          <div className="mt-4 flex justify-center gap-2">
            {players.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: players[i]?.isReady ? COLORS.accent : COLORS.textMuted,
                }}
              />
            ))}
          </div>
        </GlassmorphicPanel>
      </motion.div>
    </div>
  );
};

export const RaceSettingsPanel = () => {
  const { settings, setSettings, isHost } = useLobbyStore();

  if (!isHost) return null;

  return (
    <GlassmorphicPanel className="w-full max-w-md" padding="p-6" hover>
      <NeonText color={COLORS.secondary} className="text-xl mb-4">
        RACE SETTINGS
      </NeonText>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-secondary mb-2">Track</label>
          <select
            value={settings.trackId}
            onChange={(e) => setSettings({ trackId: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
            disabled={!isHost}
          >
            {TRACK_CONFIGS.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-secondary mb-2">Weather</label>
          <select
            value={settings.weather}
            onChange={(e) => setSettings({ weather: e.target.value as typeof settings.weather })}
            className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
            disabled={!isHost}
          >
            <option value="clear">Clear</option>
            <option value="rain">Rain</option>
            <option value="fog">Fog</option>
            <option value="storm">Storm</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-secondary mb-2">Laps</label>
          <input
            type="number"
            min={1}
            max={10}
            value={settings.laps}
            onChange={(e) => setSettings({ laps: parseInt(e.target.value) || 3 })}
            className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </GlassmorphicPanel>
  );
};


