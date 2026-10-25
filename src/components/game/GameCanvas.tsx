"use client";

import { Suspense, useRef, useEffect, useCallback, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { Environment, Stats, useProgress } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";
import * as THREE from "three";

import { Vehicle, Track, CameraController, PostProcessing, OpponentVehicle, AIVehicle, ParticleEffects, WeatherSystem, SpeedLines, TrailEffect, TouchControls, QualityPanel } from "@/components/game";
import { useSettingsStore } from "@/stores/settingsStore";
import { isWebGLAvailable, WEBGL_FALLBACK_MESSAGE } from "@/lib/webgl";
import LoadingScreen from "@/components/screens/LoadingScreen";
import {
  SpeedGauge,
  PositionIndicator,
  LapCounter,
  NitroBar,
  DamageIndicator,
  CountdownOverlay,
  Minimap,
  NeonText,
  MultiplayerStatusBanner,
  LatencyIndicator,
} from "@/components/ui";
import { useGameStore } from "@/stores/gameStore";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { initAudio, setAudioPaused, disposeAudio, unlockAudioOnGesture } from "@/lib/audio";
import { useGameLoop, useCountdown, useRaceTimer } from "@/hooks/useGameLoop";
import { CAR_CONFIGS, TRACK_CONFIGS, COLORS } from "@/lib/constants";
import { PlayerState, QualityPreset } from "@/types";

const GameScene = ({
  mode,
  quality,
  shadowsEnabled,
  bloomEnabled,
  postEnabled,
}: {
  mode: "single" | "multiplayer";
  quality: QualityPreset;
  shadowsEnabled: boolean;
  bloomEnabled: boolean;
  postEnabled: boolean;
}) => {
  const { gl } = useThree();
  const vehicleRef = useRef<THREE.Object3D | null>(null);
  const { localPlayerId, selectedCarId, selectedTrackId, cameraMode } = useGameStore();
  const multiplayer = useMultiplayer();
  const onCheckpoint = useCallback((index: number) => {
    const state = useGameStore.getState();
    const expected = state.checkpoint % state.totalCheckpoints;
    if (index !== expected || state.raceStatus !== "racing") return;

    const nextCheckpoint = state.checkpoint + 1;
    if (nextCheckpoint >= state.totalCheckpoints) {
      const nextLap = state.currentLap + 1;
      if (nextLap > state.totalLaps) {
        state.setRaceStatus("finished");
        state.setRaceResults([
          { id: state.localPlayerId || "local", name: "You", finishTime: state.raceTime, position: 1 },
        ]);
        return;
      }
      state.setLapData(nextLap, 0, state.totalCheckpoints);
    } else {
      state.setLapData(state.currentLap, nextCheckpoint, state.totalCheckpoints);
    }
  }, []);

  const trackConfig = TRACK_CONFIGS.find((t) => t.id === selectedTrackId) || TRACK_CONFIGS[0];

  const aiCount = mode === "single" ? 5 : Math.max(0, 5 - Object.keys(multiplayer.players).length);
  const showAIAmount = Math.min(5, aiCount);

  useEffect(() => {
    gl.shadowMap.enabled = shadowsEnabled && quality !== "Low";
    gl.shadowMap.type = THREE.PCFShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
  }, [gl, shadowsEnabled, quality]);

  useEffect(() => {
    if (mode === "single") {
      const status = useGameStore.getState().raceStatus;
      if (status === "lobby") {
        useGameStore.getState().setRaceStatus("countdown");
      }
    }
  }, [mode]);

  useEffect(() => {
    useGameStore.getState().setTotalLaps(trackConfig.laps);
  }, [trackConfig.laps]);

  return (
    <>
      <WeatherSystem weather={trackConfig.weather} timeOfDay={trackConfig.timeOfDay} />

      <ambientLight intensity={trackConfig.timeOfDay === "night" ? 0.2 : 0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={trackConfig.timeOfDay === "night" ? 0.8 : 1.5}
        castShadow={shadowsEnabled && quality !== "Low"}
        shadow-mapSize={[2048, 2048]}
      />

      <Environment
        preset={trackConfig.timeOfDay === "night" ? "night" : "apartment"}
        environmentIntensity={0.5}
      />

      <Physics gravity={[0, -9.81, 0]}>
         <Track trackId={trackConfig.id} playerRef={vehicleRef} onCheckpoint={onCheckpoint} />

            <Vehicle
             carId={selectedCarId}
            isLocal={true}
            playerId={localPlayerId}
              networked={mode === "multiplayer"}
              objectRef={vehicleRef}
              position={[0, 1, 33]}
              rotation={[0, Math.PI, 0]}
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
      </Physics>

      <CameraController playerRef={vehicleRef} cameraMode={cameraMode} />

      <ParticleEffects playerRef={vehicleRef} quality={quality} />
      <SpeedLines speed={useGameStore.getState().speedKmh} quality={quality} />
      <TrailEffect playerRef={vehicleRef} enabled={quality !== "Low"} />

      <PostProcessing enabled={postEnabled && quality !== "Low"} bloom={bloomEnabled} quality={quality} />

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
  quality: qualityProp = "High",
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
  const isPaused = useGameStore((s) => s.isPaused);
  const driftPoints = useGameStore((s) => s.driftPoints);

  // URL param wins on first load, then the persisted settings store owns it.
  const storedQuality = useSettingsStore((s) => s.quality);
  const postEnabled = useSettingsStore((s) => s.postProcessing);
  const bloomEnabled = useSettingsStore((s) => s.postProcessing);
  const shadowsEnabled = useSettingsStore((s) => s.shadows);
  const quality: QualityPreset = storedQuality ?? qualityProp;

  const [webGLok, setWebGLok] = useState<boolean | null>(null);
  const [glError, setGlError] = useState<string | null>(null);
  const [showQuality, setShowQuality] = useState(false);

  // Real asset-load progress (textures etc.) driven by three's loading manager,
  // instead of a synthetic bar. Overlay shows only while assets are in flight.
  const { progress: assetProgress, active: assetsLoading } = useProgress();

  const closeAudioRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // A remount (StrictMode / fast navigation) cancels the pending teardown.
    if (closeAudioRef.current) {
      clearTimeout(closeAudioRef.current);
      closeAudioRef.current = null;
    }
    setWebGLok(isWebGLAvailable());
    // Without this, Howler never loads any buffer and every playOneShot
    // (countdown beeps, race start, victory…) is a silent no-op.
    initAudio().catch((err) => console.warn("Audio init failed (non-fatal):", err));
    unlockAudioOnGesture();
    return () => {
      // Stop looping channels immediately; fully release the audio context on a
      // deferred tick so a StrictMode remount doesn't tear down a live system.
      setAudioPaused(false);
      closeAudioRef.current = setTimeout(() => {
        disposeAudio();
        closeAudioRef.current = null;
      }, 250);
    };
  }, []);

  // Pausing the race must also silence it — Vehicle stops driving the engine
  // mixer while paused, which would otherwise leave the loop at its last volume.
  useEffect(() => {
    setAudioPaused(isPaused);
    return () => setAudioPaused(false);
  }, [isPaused]);

  // Camera: C cycles chase -> cockpit -> cinematic. Pause: Escape toggles.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyC") {
        const gs = useGameStore.getState();
        const order = ["chase", "cockpit", "cinematic"] as const;
        const next = order[(order.indexOf(gs.cameraMode as (typeof order)[number]) + 1) % order.length];
        gs.setCameraMode(next);
      }
      if (e.code === "Escape") {
        const gs = useGameStore.getState();
        if (gs.raceStatus === "racing" || gs.raceStatus === "countdown") {
          gs.setPaused(!gs.isPaused);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const multiplayer = useMultiplayer();
  const { subscribeFixed } = useGameLoop({ enabled: mode === "multiplayer" });
  useCountdown();
  useRaceTimer();

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

  if (webGLok === false || glError) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-lg text-center rounded-2xl p-8" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.cardBg }}>
          <h1 className="text-2xl font-display font-bold mb-3" style={{ color: COLORS.accent }}>
            {WEBGL_FALLBACK_MESSAGE}
          </h1>
          <p className="text-secondary text-sm mb-2">
            {glError ?? "WebGL is unavailable on this browser or device."}
          </p>
          <ul className="text-secondary text-sm text-left list-disc pl-6 mb-6 space-y-1">
            <li>Use a recent version of Chrome, Edge, Firefox, or Safari.</li>
            <li>Enable hardware acceleration in your browser settings.</li>
            <li>Update your GPU drivers.</li>
            <li>Disable aggressive privacy / WebGL-blocking extensions for this site.</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-xl font-display font-bold"
            style={{ border: `1px solid ${COLORS.primary}`, color: COLORS.primary }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  if (webGLok === null) {
    return <LoadingScreen progress={20} label="Checking graphics support" />;
  }

  const dpr: [number, number] =
    quality === "Low" ? [0.5, 1] : quality === "Medium" ? [0.75, 1.5] : [1, 2];

  return (
    <div className="relative w-full h-screen">
      <Canvas
        key={`${quality}-${shadowsEnabled}-${postEnabled}`}
        camera={{ position: [0, 5, 15], fov: 70 }}
        dpr={dpr}
        gl={{ antialias: quality === "High" || quality === "Ultra", preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        onCreated={(state) => {
          try {
            state.gl.shadowMap.enabled = shadowsEnabled && quality !== "Low";
            state.gl.shadowMap.type = THREE.PCFShadowMap;
          } catch (err) {
            setGlError(err instanceof Error ? err.message : "Failed to initialize WebGL.");
          }
        }}
        onError={(err) => setGlError(err instanceof Error ? err.message : String(err))}
      >
        <Suspense fallback={null}>
          <GameScene
            mode={mode}
            quality={quality}
            shadowsEnabled={shadowsEnabled}
            bloomEnabled={bloomEnabled}
            postEnabled={postEnabled}
          />
        </Suspense>
      </Canvas>

      <CountdownOverlay count={countdown} />

      {/* Real asset-loading screen while textures stream in. */}
      {assetsLoading && <LoadingScreen progress={Math.max(5, assetProgress)} label="Loading track assets" />}

      {/* Clear in-game signal when the multiplayer server drops or wakes up. */}
      <MultiplayerStatusBanner visible={mode === "multiplayer"} />

      {/* Realtime round-trip indicator (multiplayer only). */}
      {mode === "multiplayer" && <LatencyIndicator className="fixed bottom-4 right-4 z-[80]" />}

      {/* Quality + pause controls */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] flex gap-2">
        <button
          onClick={() => setShowQuality((v) => !v)}
          className="px-4 py-1 rounded-full text-xs font-display font-bold"
          style={{ background: "rgba(0,0,0,0.65)", border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
        >
          QUALITY: {quality.toUpperCase()}
        </button>
        {(raceStatus === "racing" || raceStatus === "countdown") && (
          <button
            onClick={() => useGameStore.getState().setPaused(!isPaused)}
            className="px-4 py-1 rounded-full text-xs font-display font-bold"
            style={{ background: "rgba(0,0,0,0.65)", border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
          >
            {isPaused ? "RESUME" : "PAUSE"}
          </button>
        )}
      </div>
      {showQuality && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[80] w-64">
          <QualityPanel />
        </div>
      )}

      {driftPoints > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80]">
          <div
            className="px-5 py-1 rounded-xl font-display font-bold"
            style={{ background: "rgba(0,0,0,0.65)", border: `1px solid ${COLORS.secondary}`, color: COLORS.secondary }}
          >
            DRIFT +{driftPoints}
          </div>
        </div>
      )}

      <TouchControls onPause={() => useGameStore.getState().setPaused(true)} />

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
        {isPaused && (raceStatus === "racing" || raceStatus === "countdown") && (
          <motion.div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="p-8 rounded-2xl text-center" style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
              <NeonText color={COLORS.primary} className="text-4xl mb-6">PAUSED</NeonText>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => useGameStore.getState().setPaused(false)}
                  className="px-8 py-3 rounded-xl font-display font-bold"
                  style={{ border: `1px solid ${COLORS.primary}`, color: COLORS.textPrimary }}
                >
                  RESUME
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 rounded-xl font-display font-bold"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}
                >
                  RESTART RACE
                </button>
                <a
                  href="/"
                  className="px-8 py-3 rounded-xl font-display font-bold text-center"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}
                >
                  QUIT TO MENU
                </a>
              </div>
              <p className="mt-4 text-xs text-secondary">Press Escape to resume</p>
            </div>
          </motion.div>
        )}
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
