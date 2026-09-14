"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  initAudio,
  playOneShot,
  playLoop,
  stopSound,
  updateEngineSound,
  setSoundVolume,
  setMasterVolume,
  type SoundName,
} from "@/lib/audio";
import { useSettingsStore } from "@/stores/settingsStore";

export const useAudio = () => {
  const settings = useSettingsStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initAudio().catch((error) => {
        console.warn("Audio initialization failed (non-fatal):", error);
      });
      initializedRef.current = true;
    }
  }, []);

  const playSound = useCallback(
    (name: SoundName, volume: number = 1) => {
      try {
        const vol = volume * settings.sfxVolume * (settings.isMuted ? 0 : 1);
        return playOneShot(name, vol);
      } catch (error) {
        console.warn("Failed to play sound:", error);
        return null;
      }
    },
    [settings.sfxVolume, settings.isMuted]
  );

  const playMusic = useCallback(
    (name: SoundName) => {
      try {
        const vol = settings.musicVolume * (settings.isMuted ? 0 : 1);
        playLoop(name, vol);
      } catch (error) {
        console.warn("Failed to play music:", error);
      }
    },
    [settings.musicVolume, settings.isMuted]
  );

  const stopEngineSound = useCallback(() => {
    try {
      stopSound("engineIdle");
      stopSound("engineLow");
      stopSound("engineMid");
      stopSound("engineHigh");
    } catch {
      // non-fatal
    }
  }, []);

  const updateEngine = useCallback(
    (rpm: number, gear: number, throttle: number) => {
      try {
        updateEngineSound(rpm, gear, throttle);
      } catch {
        // non-fatal
      }
    },
    []
  );

  return {
    playSound,
    playMusic,
    stopSound,
    stopEngineSound,
    updateEngine,
    setVolume: setSoundVolume,
    setMasterVolume,
  };
};

export const useSFX = () => {
  const play = useCallback(
    (name: SoundName, volume: number = 1) => {
      return playOneShot(name, volume);
    },
    []
  );

  return { play };
};

export type { SoundName };
