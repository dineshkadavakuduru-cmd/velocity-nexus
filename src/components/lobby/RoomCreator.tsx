"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassmorphicPanel, NeonText, MagneticButton } from "@/components/ui";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { COLORS, DEFAULT_RACE_SETTINGS } from "@/lib/constants";
import { TRACK_CONFIGS, CAR_CONFIGS } from "@/lib/constants";

export const RoomCreator = () => {
  const { settings, setSettings, setIsLoading } = useLobbyStore();
  const { createRoom } = useMultiplayer();
  const [playerName, setPlayerName] = useState("Racer");

  const handleCreateRoom = useCallback(() => {
    createRoom(playerName, settings);
  }, [createRoom, playerName, settings]);

  return (
    <GlassmorphicPanel className="w-full max-w-md mx-auto" padding="p-6" hover>
      <NeonText color={COLORS.primary} className="text-2xl mb-6">
        CREATE ROOM
      </NeonText>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-secondary mb-2">Pilot Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm text-secondary mb-2">Track</label>
          <select
            value={settings.trackId}
            onChange={(e) => setSettings({ trackId: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
          >
            {TRACK_CONFIGS.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name} â€” {track.difficulty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-secondary mb-2">Car</label>
          <select
            value={settings.carId}
            onChange={(e) => setSettings({ carId: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
          >
            {CAR_CONFIGS.map((car) => (
              <option key={car.id} value={car.id}>
                {car.name} â€” {car.topSpeed} km/h
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Laps</label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.laps}
              onChange={(e) => setSettings({ laps: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-2">AI Count</label>
            <input
              type="number"
              min={0}
              max={7}
              value={settings.aiCount}
              onChange={(e) => setSettings({ aiCount: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Weather</label>
            <select
              value={settings.weather}
              onChange={(e) => setSettings({ weather: e.target.value as typeof settings.weather })}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
            >
              <option value="clear">Clear</option>
              <option value="rain">Rain</option>
              <option value="fog">Fog</option>
              <option value="storm">Storm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-secondary mb-2">Time</label>
            <select
              value={settings.timeOfDay}
              onChange={(e) => setSettings({ timeOfDay: e.target.value as typeof settings.timeOfDay })}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary"
            >
              <option value="day">Day</option>
              <option value="night">Night</option>
              <option value="sunset">Sunset</option>
              <option value="dawn">Dawn</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <MagneticButton
          onClick={handleCreateRoom}
          variant="primary"
          size="lg"
          className="w-full"
        >
          CREATE RACE
        </MagneticButton>
      </div>
    </GlassmorphicPanel>
  );
};

export const RoomJoiner = () => {
  const { joinRoom } = useMultiplayer();
  const { setIsLoading, setError } = useLobbyStore();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("Racer");

  const handleJoinRoom = useCallback(() => {
    if (roomCode.length !== 6) {
      setError("Room code must be 6 characters");
      return;
    }
    joinRoom(roomCode.toUpperCase(), playerName);
  }, [roomCode, playerName, joinRoom, setError]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setRoomCode(value);
  };

  return (
    <GlassmorphicPanel className="w-full max-w-md mx-auto" padding="p-6" hover>
      <NeonText color={COLORS.secondary} className="text-2xl mb-6">
        JOIN ROOM
      </NeonText>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-secondary mb-2">Pilot Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm text-secondary mb-2">Room Code</label>
          <input
            type="text"
            value={roomCode}
            onChange={handleCodeChange}
            className="w-full px-4 py-3 rounded-lg bg-input border-2 border-primary text-foreground text-center text-3xl font-display font-bold tracking-widest focus:outline-none focus:border-secondary transition-all duration-300"
            placeholder="______"
            maxLength={6}
          />
          <div className="mt-2 text-center text-xs text-secondary">
            Enter the 6-character room code
          </div>
        </div>
      </div>

      <div className="mt-6">
        <MagneticButton
          onClick={handleJoinRoom}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          JOIN RACE
        </MagneticButton>
      </div>
    </GlassmorphicPanel>
  );
};


