import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { PlayerState, RaceStatus, Vector3, Quaternion, QualityPreset, DamageState } from "@/types";
import { CAR_CONFIGS, DEFAULT_CONTROLS, CAMERA_MODES } from "@/lib/constants";
import type { CameraMode } from "@/lib/constants";

interface GameState {
  players: Record<string, PlayerState>;
  localPlayerId: string;
  raceStatus: RaceStatus;
  raceTime: number;
  countdown: number;
  currentLap: number;
  totalLaps: number;
  checkpoint: number;
  totalCheckpoints: number;
  position: number;
  speedKmh: number;
  rpm: number;
  gear: number;
  throttle: number;
  steering: number;
  brake: boolean;
  handbrake: boolean;
  nitro: boolean;
  nitroLevel: number;
  damage: DamageState;
  cameraMode: CameraMode;
  selectedCarId: string;
  selectedTrackId: string;
  isPaused: boolean;
  isMuted: boolean;
  driftPoints: number;
  driftCombo: number;
  raceFinished: boolean;
  raceResults: Array<{ id: string; name: string; finishTime: number; position: number }> | null;

  setPlayerState: (id: string, state: Partial<PlayerState>) => void;
  setLocalPlayerId: (id: string) => void;
  setRaceStatus: (status: RaceStatus) => void;
  setRaceTime: (time: number) => void;
  setCountdown: (count: number) => void;
  setLapData: (lap: number, checkpoint: number, totalCheckpoints: number) => void;
  setPosition: (pos: number) => void;
  setVehicleState: (speed: number, rpm: number, gear: number, throttle: number, steering: number, brake: boolean, handbrake: boolean, nitro: boolean) => void;
  setNitroLevel: (level: number) => void;
  setDamage: (damage: Partial<DamageState>) => void;
  setCameraMode: (mode: CameraMode) => void;
  setSelectedCar: (carId: string) => void;
  setSelectedTrack: (trackId: string) => void;
  setPaused: (paused: boolean) => void;
  setMuted: (muted: boolean) => void;
  setDriftPoints: (points: number) => void;
  setDriftCombo: (combo: number) => void;
  setRaceResults: (results: Array<{ id: string; name: string; finishTime: number; position: number }> | null) => void;
  resetRace: () => void;
  addPlayer: (player: PlayerState) => void;
  removePlayer: (id: string) => void;
}

const initialDamage: DamageState = { front: 0, rear: 0, left: 0, right: 0 };

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        players: {},
        localPlayerId: "",
        raceStatus: "lobby",
        raceTime: 0,
        countdown: 3,
        currentLap: 1,
        totalLaps: 3,
        checkpoint: 0,
        totalCheckpoints: 10,
        position: 1,
        speedKmh: 0,
        rpm: 800,
        gear: 1,
        throttle: 0,
        steering: 0,
        brake: false,
        handbrake: false,
        nitro: false,
        nitroLevel: 100,
        damage: { ...initialDamage },
        cameraMode: CAMERA_MODES[0] as CameraMode,
        selectedCarId: "phantom-gt",
        selectedTrackId: "neon-tokyo",
        isPaused: false,
        isMuted: false,
        driftPoints: 0,
        driftCombo: 0,
        raceFinished: false,
        raceResults: null,

        setPlayerState: (id, state) =>
          set((prev) => ({
            players: {
              ...prev.players,
              [id]: { ...prev.players[id], ...state } as PlayerState,
            },
          })),

        setLocalPlayerId: (id) => set({ localPlayerId: id }),

        setRaceStatus: (status) => set({ raceStatus: status }),

        setRaceTime: (time) => set({ raceTime: time }),

        setCountdown: (count) => set({ countdown: count }),

        setLapData: (lap, checkpoint, total) =>
          set({
            currentLap: lap,
            checkpoint,
            totalCheckpoints: total,
          }),

        setPosition: (pos) => set({ position: pos }),

        setVehicleState: (speed, rpm, gear, throttle, steering, brake, handbrake, nitro) =>
          set({
            speedKmh: speed,
            rpm,
            gear,
            throttle,
            steering,
            brake,
            handbrake,
            nitro,
          }),

        setNitroLevel: (level) => set({ nitroLevel: level }),

        setDamage: (damage) =>
          set((prev) => ({
            damage: { ...prev.damage, ...damage },
          })),

        setCameraMode: (mode) => set({ cameraMode: mode }),

        setSelectedCar: (carId) => set({ selectedCarId: carId }),

        setSelectedTrack: (trackId) => set({ selectedTrackId: trackId }),

        setPaused: (paused) => set({ isPaused: paused }),

        setMuted: (muted) => set({ isMuted: muted }),

        setDriftPoints: (points) => set({ driftPoints: points }),

        setDriftCombo: (combo) => set({ driftCombo: combo }),

        setRaceResults: (results) => set({ raceResults: results, raceFinished: results !== null }),

        resetRace: () =>
          set({
            players: {},
            raceStatus: "lobby",
            raceTime: 0,
            countdown: 3,
            currentLap: 1,
            checkpoint: 0,
            position: 1,
            speedKmh: 0,
            rpm: 800,
            gear: 1,
            throttle: 0,
            steering: 0,
            brake: false,
            handbrake: false,
            nitro: false,
            nitroLevel: 100,
            damage: { ...initialDamage },
            driftPoints: 0,
            driftCombo: 0,
            raceFinished: false,
            raceResults: null,
          }),

        addPlayer: (player) =>
          set((prev) => ({
            players: { ...prev.players, [player.id]: player },
          })),

        removePlayer: (id) =>
          set((prev) => {
            const newPlayers = { ...prev.players };
            delete newPlayers[id];
            return { players: newPlayers };
          }),
      }),
      { name: "velocity-nexus-game" }
    )
  )
);

export const useSelectedCar = (): typeof CAR_CONFIGS[0] => {
  const selectedCarId = useGameStore((s) => s.selectedCarId);
  return CAR_CONFIGS.find((c) => c.id === selectedCarId) || CAR_CONFIGS[0];
};
