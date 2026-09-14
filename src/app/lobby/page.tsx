"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NeonText, GlassmorphicPanel, SparklesBackground } from "@/components/ui";
import { RoomCreator, PlayerList, ChatBox, ReadyButton } from "@/components/lobby";
import { COLORS } from "@/lib/constants";
import { useLobbyStore } from "@/stores/lobbyStore";
import { useMultiplayer } from "@/hooks/useMultiplayer";

const LobbyPage = () => {
  const [mode, setMode] = useState<"create" | "join">("create");
  const { roomCode, isHost, players, settings, isReady, isLoading, error: lobbyError } = useLobbyStore();
  const { createRoom, joinRoom, disconnect } = useMultiplayer();
  const [playerName, setPlayerName] = useState("Racer");
  const [joinCode, setJoinCode] = useState("");

  const handleCreateRoom = useCallback(() => {
    createRoom(playerName, settings);
  }, [createRoom, playerName, settings]);

  const handleJoinRoom = useCallback(() => {
    joinRoom(joinCode.toUpperCase(), playerName);
  }, [joinCode, playerName, joinRoom]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setJoinCode(value);
  };

  if (!roomCode) {
    return (
      <div className="min-h-screen w-full bg-background relative overflow-hidden">
        <SparklesBackground className="absolute inset-0" density={1.5} />

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <NeonText color={COLORS.primary} glowIntensity="high" className="text-4xl sm:text-6xl mb-4">
              MULTIPLAYER LOBBY
            </NeonText>

            <p className="text-secondary max-w-2xl mx-auto text-lg">
              Create a room to race friends, or join an existing room with a 6-character code.
            </p>
          </motion.div>

          <div className="flex gap-4 mb-8">
            <motion.button
              onClick={() => setMode("create")}
              className={`px-6 py-2 rounded-full font-display font-bold transition-all`}
              style={{
                background: mode === "create"
                  ? `linear-gradient(135deg, ${COLORS.primary}30, ${COLORS.secondary}30)`
                  : "rgba(30, 30, 30, 0.6)",
                color: mode === "create" ? COLORS.primary : COLORS.textSecondary,
                border: `1px solid ${mode === "create" ? COLORS.primary : COLORS.border}`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              CREATE ROOM
            </motion.button>
            <motion.button
              onClick={() => setMode("join")}
              className={`px-6 py-2 rounded-full font-display font-bold transition-all`}
              style={{
                background: mode === "join"
                  ? `linear-gradient(135deg, ${COLORS.secondary}30, ${COLORS.accent}30)`
                  : "rgba(30, 30, 30, 0.6)",
                color: mode === "join" ? COLORS.secondary : COLORS.textSecondary,
                border: `1px solid ${mode === "join" ? COLORS.secondary : COLORS.border}`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              JOIN ROOM
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {mode === "create" ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
              >
                <GlassmorphicPanel className="p-6" hover>
                  <NeonText color={COLORS.secondary} className="text-xl mb-4">
                    CREATE ROOM
                  </NeonText>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-secondary mb-2">Your Name</label>
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
                        placeholder="Enter your name"
                      />
                    </div>

                    <RoomCreator />
                  </div>

                  <div className="mt-4">
                    <motion.button
                      onClick={handleCreateRoom}
                      className="w-full px-6 py-3 rounded-xl font-display font-bold text-lg"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.primary}40, ${COLORS.secondary}40)`,
                        border: `1px solid ${COLORS.primary}`,
                        color: COLORS.textPrimary,
                      }}
                      whileHover={{ boxShadow: `${COLORS.primary}30 0 0 20px, ${COLORS.secondary}20 0 0 30px` }}
                      whileTap={{ scale: 0.95 }}
                    >
                      CREATE AND START
                    </motion.button>
                  </div>
                </GlassmorphicPanel>
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
              >
                <GlassmorphicPanel className="p-6" hover>
                  <NeonText color={COLORS.accent} className="text-xl mb-4">
                    JOIN ROOM
                  </NeonText>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-secondary mb-2">Your Name</label>
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
                        value={joinCode}
                        onChange={handleCodeChange}
                        className="w-full px-4 py-3 rounded-lg bg-input border-2 border-primary text-foreground text-center text-3xl font-display font-bold tracking-widest focus:outline-none focus:border-secondary transition-all"
                        placeholder="______"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <motion.button
                    onClick={handleJoinRoom}
                    disabled={joinCode.length !== 6}
                    className="mt-4 w-full px-6 py-3 rounded-xl font-display font-bold text-lg transition-all"
                    style={{
                      background: joinCode.length === 6
                        ? `linear-gradient(135deg, ${COLORS.secondary}40, ${COLORS.accent}40)`
                        : "rgba(40, 40, 40, 0.4)",
                      border: `1px solid ${COLORS.secondary}`,
                      color: COLORS.textPrimary,
                    }}
                    whileHover={joinCode.length === 6 ? { boxShadow: `${COLORS.secondary}30 0 0 20px` } : {}}
                    whileTap={joinCode.length === 6 ? { scale: 0.95 } : {}}
                  >
                    JOIN RACE
                  </motion.button>
                </GlassmorphicPanel>
              </motion.div>
            )}
          </AnimatePresence>

          {lobbyError && (
            <motion.div
              className="mt-4 px-4 py-2 rounded-lg text-center"
              style={{
                background: "rgba(255, 0, 120, 0.2)",
                border: `1px solid ${COLORS.accent}`,
                color: COLORS.accent,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {lobbyError}
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      <SparklesBackground className="absolute inset-0" density={1.5} />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-12">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <NeonText color={COLORS.primary} glowIntensity="high" className="text-2xl">
            ROOM {roomCode}
          </NeonText>
        </motion.div>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PlayerList />
            <ChatBox />
          </div>

          <div className="space-y-6">
            <ReadyButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;


