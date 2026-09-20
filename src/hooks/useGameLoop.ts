"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";
import { GAME_CONSTANTS } from "@/lib/constants";
import { PlayerState } from "@/types";
import { lerp } from "@/lib/interpolation";

interface GameLoopOptions {
  enabled: boolean;
  tickRate?: number;
}

export const useGameLoop = (options: GameLoopOptions = { enabled: true }) => {
  const { enabled, tickRate = GAME_CONSTANTS.NETWORK_TICK_RATE } = options;
  const frameIdRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const callbacksRef = useRef<Array<(deltaTime: number, elapsedTime: number) => void>>([]);
  const fixedCallbacksRef = useRef<Array<(fixedDeltaTime: number) => void>>([]);

  const subscribe = useCallback((callback: (deltaTime: number, elapsedTime: number) => void) => {
    callbacksRef.current.push(callback);
    return () => {
      const idx = callbacksRef.current.indexOf(callback);
      if (idx > -1) callbacksRef.current.splice(idx, 1);
    };
  }, []);

  const subscribeFixed = useCallback((callback: (fixedDeltaTime: number) => void) => {
    fixedCallbacksRef.current.push(callback);
    return () => {
      const idx = fixedCallbacksRef.current.indexOf(callback);
      if (idx > -1) fixedCallbacksRef.current.splice(idx, 1);
    };
  }, []);

  const start = useCallback(() => {
    if (frameIdRef.current) return;

    const fixedDeltaTime = 1 / tickRate;
    lastFrameRef.current = performance.now();

    const loop = (time: number) => {
      if (!enabled) {
        frameIdRef.current = null;
        return;
      }

      const frameDelta = (time - lastFrameRef.current) / 1000;
      lastFrameRef.current = time;

      accumulatorRef.current += frameDelta;

      for (const cb of callbacksRef.current) {
        cb(frameDelta, time / 1000);
      }

      while (accumulatorRef.current >= fixedDeltaTime) {
        for (const cb of fixedCallbacksRef.current) {
          cb(fixedDeltaTime);
        }
        accumulatorRef.current -= fixedDeltaTime;
      }

      frameIdRef.current = requestAnimationFrame(loop);
    };

    frameIdRef.current = requestAnimationFrame(loop);
  }, [enabled, tickRate]);

  const stop = useCallback(() => {
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
      return () => stop();
    }
  }, [enabled, start, stop]);

  return { subscribe, subscribeFixed, start, stop };
};

export const useRaceTimer = () => {
  const raceTime = useGameStore((s) => s.raceTime);
  const raceStatus = useGameStore((s) => s.raceStatus);
  const setRaceTime = useGameStore((s) => s.setRaceTime);

  const { subscribeFixed } = useGameLoop({ enabled: raceStatus === "racing" });
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (raceStatus === "racing" && startTimeRef.current === 0) {
      startTimeRef.current = performance.now();
    } else if (raceStatus !== "racing") {
      startTimeRef.current = 0;
    }
  }, [raceStatus]);

  useEffect(() => {
    if (raceStatus !== "racing") return;

    return subscribeFixed((fixedDeltaTime) => {
      const newTime = (performance.now() - startTimeRef.current) / 1000;
      setRaceTime(newTime);
    });
  }, [raceStatus, subscribeFixed, setRaceTime]);

  return raceTime;
};

export const useCountdown = (onCountdownComplete?: () => void) => {
  const countdown = useGameStore((s) => s.countdown);
  const raceStatus = useGameStore((s) => s.raceStatus);
  const setCountdown = useGameStore((s) => s.setCountdown);
  const setRaceStatus = useGameStore((s) => s.setRaceStatus);

  useEffect(() => {
    if (raceStatus === "countdown") {
      if (countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (countdown === 0) {
        const timer = setTimeout(() => {
          setRaceStatus("racing");
          setCountdown(-1);
          onCountdownComplete?.();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [raceStatus, countdown, setCountdown, setRaceStatus, onCountdownComplete]);

  return countdown;
};

export type { GameLoopOptions };


