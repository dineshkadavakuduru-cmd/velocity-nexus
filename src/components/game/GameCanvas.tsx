"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { Environment, Stats } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";
import * as THREE from "three";

import { Vehicle, Track, CameraController, PostProcessing, OpponentVehicle, AIVehicle, ParticleEffects, WeatherSystem, SpeedLines, TrailEffect } from "@/components/game";
import {
  SpeedGauge,
  PositionIndicator,
  LapCounter,
  NitroBar,
  DamageIndicator,
  CountdownOverlay,
  Minimap,
  NeonText,
} from "@/components/ui";
import { useGameStore } from "@/stores/gameStore";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { useGameLoop, useCountdown } from "@/hooks/useGameLoop";
import { CAR_CONFIGS, TRACK_CONFIGS, COLORS } from "@/lib/constants";
import { PlayerState, QualityPreset } from "@/types";

const GameScene = ({
  mode,
  quality,
}: {
  mode: "single" | "multiplayer";
  quality: QualityPreset;
}) => {
  const { gl } = useThree();
  const vehicleRef = useRef<THREE.Group>(null!);
  const { localPlayerId, selectedCarId, selectedTrackId } = useGameStore();
  const multiplayer = useMultiplayer();

  const trackConfig = TRACK_CONFIGS.find((t) => t.id === selectedTrackId) || TRACK_CONFIGS[0];

  const aiCount = mode === "single" ? 5 : Math.max(0, 5 - Object.keys(multiplayer.players).length);
  const showAIAmount = Math.min(5, aiCount);

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
  }, [gl]);

  useEffect(() => {
    if (mode === "single") {
      const status = useGameStore.getState().raceStatus;
      if (status === "lobby") {
        useGameStore.getState().setRaceStatus("countdown");
      }
    }
  }, [mode]);

  return (
    <>
      <WeatherSystem weather={trackConfig.weather} timeOfDay={trackConfig.timeOfDay} />

      <ambientLight intensity={trackConfig.timeOfDay === "night" ? 0.2 : 0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={trackConfig.timeOfDay === "night" ? 0.8 : 1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <Environment
        preset={trackConfig.timeOfDay === "night" ? "night" : "apartment"}
        environmentIntensity={0.5}
      />

      <Physics gravity={[0, -9.81, 0]}>
        <Track trackId={trackConfig.id} />

        <group ref={vehicleRef}>
          <Vehicle
            carId={selectedCarId}
            isLocal={true}
            playerId={localPlayerId}
            networked={mode === "multiplayer"}
          />

          {mode === "single" &&
            Array.from({ length: showAIAmount }).map((_, i) => (
              <AIVehicle
                key={`ai-${i}`}
                carId={CAR_CONFIGS[i % CAR_CONFIGS.length].id}
                track={trackConfig}
                initialPosition={[-10 + i * 6, 1, 0]}
                difficulty={i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard"}
              />
            ))}

          {mode === "multiplayer" &&
            multiplayer.remotePlayers?.map((player: PlayerState) => (
              <OpponentVehicle
                key={player.id}
                player={player}
                interpolationBuffer={true}
              />
            ))}
        </group>
      </Physics>

      <CameraController playerRef={vehicleRef} cameraMode="chase" />

      <ParticleEffects playerRef={vehicleRef} quality={quality} />
      <SpeedLines speed={useGameStore.getState().speedKmh} quality={quality} />
      <TrailEffect playerRef={vehicleRef} enabled={quality !== "Low"} />

      <PostProcessing enabled={quality !== "Low"} quality={quality} />

      {quality === "Ultra" && <Stats />}
    </>
  );
};

export interface GameCanvasProps {
  mode?: "single" | "multiplayer";
  quality?: QualityPreset;
}

export const GameCanvas = ({
  mode = "single",
  quality = "High",
}: GameCanvasProps) => {
  const speedKmh = useGameStore((s) => s.speedKmh);
  const rpm = useGameStore((s) => s.rpm);
  const gear = useGameStore((s) => s.gear);
  const nitroLevel = useGameStore((s) => s.nitroLevel);
  const nitro = useGameStore((s) => s.nitro);
  const damage = useGameStore((s) => s.damage);
  const position = useGameStore((s) => s.position);
  const raceTime = useGameStore((s) => s.raceTime);
  const raceStatus = useGameStore((s) => s.raceStatus);
  const countdown = useGameStore((s) => s.countdown);
  const totalLaps = useGameStore((s) => s.totalLaps);
  const currentLap = useGameStore((s) => s.currentLap);
  const checkpoint = useGameStore((s) => s.checkpoint);
  const totalCheckpoints = useGameStore((s) => s.totalCheckpoints);
  const raceResults = useGameStore((s) => s.raceResults);
  const localPlayerId = useGameStore((s) => s.localPlayerId);
  const players = useGameStore((s) => s.players);

  const multiplayer = useMultiplayer();
  const { subscribeFixed } = useGameLoop({ enabled: mode === "multiplayer" });
  useCountdown();

  useEffect(() => {
    if (mode === "multiplayer") {
      return subscribeFixed(() => {
        const state = useGameStore.getState();
        if (state.raceStatus === "racing") {
          const player = state.players[state.localPlayerId];
          if (player) {
            multiplayer.sendPlayerUpdate({
              position: player.position,
              rotation: player.rotation,
              velocity: player.velocity,
              steering: state.steering,
              throttle: state.throttle,
              brake: state.brake,
              nitro: state.nitro,
              currentLap,
              checkpoint,
            });
          }
        }
      });
    }
  }, [subscribeFixed, mode, multiplayer, currentLap, checkpoint]);

  const totalPlayers = mode === "single" ? 6 : (multiplayer.players ? Object.keys(multiplayer.players).length : 1);

  const trackBounds = {
    minX: -80,
    maxX: 80,
    minZ: -80,
    maxZ: 80,
  };

  const minimapPlayers = Object.entries(players).map(([id, p]) => ({
    id,
    name: p.name || id,
    position: p.position || { x: 0, y: 0, z: 0 },
    color: p.color,
    isLocal: id === localPlayerId,
    finished: p.finished,
  }));

  return (
    <div className="relative w-full h-screen">
      <Canvas
        camera={{ position: [0, 5, 15], fov: 70 }}
        gl={{ antialias: quality !== "Low", preserveDrawingBuffer: true }}
        onCreated={(state) => {
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <GameScene mode={mode} quality={quality} />
        </Suspense>
      </Canvas>

      <CountdownOverlay count={countdown} />

      <SpeedGauge
        speed={speedKmh}
        maxSpeed={400}
        rpm={rpm}
        maxRpm={8500}
        gear={gear}
        className="top-6 left-6"
      />

      <PositionIndicator position={position} total={totalPlayers} className="top-6 left-6 mt-20" />

      <LapCounter
        currentLap={currentLap}
        totalLaps={totalLaps}
        checkpoint={checkpoint}
        totalCheckpoints={totalCheckpoints}
        className="top-6 right-6"
      />

      <NitroBar level={nitroLevel} active={nitro} />

      <DamageIndicator damage={damage} />

      <Minimap players={minimapPlayers} trackBounds={trackBounds} size={160} className="top-6 right-6 mt-20" />

      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div
          className="px-6 py-2 rounded-xl font-display font-bold"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textPrimary,
          }}
        >
          RACE TIME: {Math.floor(raceTime / 60)}:{Math.floor(raceTime % 60).toString().padStart(2, "0")}.{Math.floor((raceTime % 1) * 1000).toString().padStart(3, "0")}
        </div>
      </motion.div>

      <AnimatePresence>
        {raceStatus === "finished" && raceResults && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="p-8 rounded-2xl text-center"
              style={{
                background: COLORS.cardBg,
                border: `2px solid ${COLORS.primary}`,
              }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <NeonText color={COLORS.accent} className="text-5xl mb-6">
                RACE FINISHED
              </NeonText>

              <div className="space-y-3 mt-6">
                {raceResults
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((result, i) => (
                    <motion.div
                      key={result.id}
                      className="flex items-center justify-center gap-4 px-6 py-2 rounded-lg"
                      style={{
                        background: i === 0 ? `${COLORS.accent}15` : "rgba(30, 30, 30, 0.5)",
                        border: `1px solid ${i === 0 ? COLORS.accent : COLORS.border}`,
                      }}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                    >
                      <span
                        className="text-2xl font-display font-bold"
                        style={{ color: i === 0 ? COLORS.accent : COLORS.textSecondary }}
                      >
                        #{result.position}
                      </span>
                      <span className="text-lg font-medium">{result.name}</span>
                      <span className="text-secondary">
                        {Math.floor(result.finishTime / 60)}:{Math.floor(result.finishTime % 60).toString().padStart(2, "0")}.{Math.floor((result.finishTime % 1) * 1000).toString().padStart(3, "0")}
                      </span>
                    </motion.div>
                  ))}
              </div>

              <motion.button
                className="mt-8 px-8 py-3 rounded-xl font-display font-bold text-lg"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary}40, ${COLORS.secondary}40)`,
                  border: `1px solid ${COLORS.primary}`,
                  color: COLORS.textPrimary,
                }}
                whileHover={{ scale: 1.05, boxShadow: `${COLORS.primary}30 0 0 20px` }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
              >
                RACE AGAIN
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameCanvas;
