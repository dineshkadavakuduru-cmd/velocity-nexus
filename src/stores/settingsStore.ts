import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { QualityPreset, Controls } from "@/types";
import { DEFAULT_CONTROLS, CAMERA_MODES } from "@/lib/constants";
import type { CameraMode } from "@/lib/constants";

interface SettingsState {
  quality: QualityPreset;
  controls: Controls;
  cameraMode: CameraMode;
  volume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  showFPS: boolean;
  showHUD: boolean;
  vsync: boolean;
  motionBlur: boolean;
  postProcessing: boolean;
  shadows: boolean;

  setQuality: (quality: QualityPreset) => void;
  setControls: (controls: Controls) => void;
  setCameraMode: (mode: CameraMode) => void;
  setVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setShowFPS: (show: boolean) => void;
  setShowHUD: (show: boolean) => void;
  setVsyn: (vsync: boolean) => void;
  setMotionBlur: (enabled: boolean) => void;
  setPostProcessing: (enabled: boolean) => void;
  setShadows: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        quality: "High",
        controls: { ...DEFAULT_CONTROLS },
        cameraMode: CAMERA_MODES[0] as CameraMode,
        volume: 0.8,
        musicVolume: 0.5,
        sfxVolume: 0.8,
        isMuted: false,
        showFPS: false,
        showHUD: true,
        vsync: true,
        motionBlur: true,
        postProcessing: true,
        shadows: true,

        setQuality: (quality) => set({ quality }),
        setControls: (controls) => set({ controls }),
        setCameraMode: (mode) => set({ cameraMode: mode }),
        setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: volume === 0 }),
        setMusicVolume: (volume) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),
        setSfxVolume: (volume) => set({ sfxVolume: Math.max(0, Math.min(1, volume)) }),
        setMuted: (muted) => set({ isMuted: muted }),
        setShowFPS: (show) => set({ showFPS: show }),
        setShowHUD: (show) => set({ showHUD: show }),
        setVsyn: (vsync) => set({ vsync }),
        setMotionBlur: (enabled) => set({ motionBlur: enabled }),
        setPostProcessing: (enabled) => set({ postProcessing: enabled }),
        setShadows: (enabled) => set({ shadows: enabled }),
      }),
      { name: "velocity-nexus-settings" }
    )
  )
);
