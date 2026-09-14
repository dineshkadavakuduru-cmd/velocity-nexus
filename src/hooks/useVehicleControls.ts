"use client";

import { useState, useEffect, useCallback } from "react";
import { getInputState, initControls, resetControls } from "@/lib/controls";
import { Controls } from "@/types";

interface VehicleControls {
  throttle: number;
  brake: boolean;
  steering: number;
  handbrake: boolean;
  nitro: boolean;
  pause: boolean;
}

const SMOOTHING = 0.15;

export const useVehicleControls = (): VehicleControls => {
  const [controls, setControls] = useState<VehicleControls>({
    throttle: 0,
    brake: false,
    steering: 0,
    handbrake: false,
    nitro: false,
    pause: false,
  });

  const updateControls = useCallback(() => {
    const input = getInputState();

    setControls((prev) => {
      const throttle = input.forward ? 1 : 0;
      const brake = input.backward;
      const handbrake = input.handbrake;
      const nitro = input.nitro;
      const pause = input.pause;

      const steeringRaw = input.steering !== 0 ? input.steering : Number(input.left) - Number(input.right);
      const steering = prev.steering + (steeringRaw - prev.steering) * SMOOTHING;

      return {
        throttle,
        brake: brake || handbrake,
        steering: Math.max(-1, Math.min(1, steering)),
        handbrake,
        nitro,
        pause,
      };
    });
  }, []);

  useEffect(() => {
    initControls();

    const interval = setInterval(updateControls, 16);
    return () => {
      clearInterval(interval);
      resetControls();
    };
  }, [updateControls]);

  return controls;
};

export const useGamepadControls = (): VehicleControls => {
  const controls = useVehicleControls();
  return controls;
};

export const useKeyboardControls = (controls?: Controls) => {
  const [keys, setKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const down = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.code]: true }));
    };
    const up = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.code]: false }));
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keys;
};

export type { VehicleControls };


