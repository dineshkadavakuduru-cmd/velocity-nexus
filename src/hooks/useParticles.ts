"use client";

import { useCallback, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";

export interface ParticleConfig {
  type: "smoke" | "sparks" | "nitro" | "dust" | "rain" | "confetti";
  position: [number, number, number];
  count: number;
  life: number;
  size: number;
  color: string | string[];
  velocity?: { x: number; y: number; z: number };
  opacity?: number;
  emit: boolean;
}

interface ParticleEmitter {
  id: string;
  config: ParticleConfig;
  active: boolean;
}

const emitters: Map<string, ParticleEmitter> = new Map();
let nextId = 0;

export const useParticles = () => {
  const speedKmh = useGameStore((s) => s.speedKmh);
  const handbrake = useGameStore((s) => s.handbrake);
  const nitro = useGameStore((s) => s.nitro);
  const throttle = useGameStore((s) => s.throttle);

  const createEmitter = useCallback((config: Omit<ParticleConfig, "emit">): string => {
    const id = `particle_${nextId++}`;
    emitters.set(id, {
      id,
      config: { ...config, emit: true },
      active: true,
    });
    return id;
  }, []);

  const updateEmitter = useCallback((id: string, config: Partial<ParticleConfig>) => {
    const emitter = emitters.get(id);
    if (emitter) {
      emitter.config = { ...emitter.config, ...config };
    }
  }, []);

  const destroyEmitter = useCallback((id: string) => {
    emitters.delete(id);
  }, []);

  const triggerTireSmoke = useCallback(
    (position: [number, number, number], slipAngle: number) => {
      if (slipAngle > 0.3) {
        return createEmitter({
          type: "smoke",
          position,
          count: Math.floor(slipAngle * 20),
          life: 1.5,
          size: 0.5,
          color: ["#888888", "#aaaaaa", "#cccccc"],
          velocity: { x: 0, y: 0.5, z: 0 },
          opacity: 0.6,
        });
      }
      return null;
    },
    [createEmitter]
  );

  const triggerNitroFlame = useCallback(
    (position: [number, number, number]) => {
      return createEmitter({
        type: "nitro",
        position,
        count: 30,
        life: 0.5,
        size: 0.3,
        color: ["#00f0ff", "#ff00ff", "#ff9100"],
        velocity: { x: 0, y: 0, z: -5 },
        opacity: 0.9,
      });
    },
    [createEmitter]
  );

  const triggerSparks = useCallback(
    (position: [number, number, number]) => {
      return createEmitter({
        type: "sparks",
        position,
        count: 20,
        life: 0.8,
        size: 0.1,
        color: ["#ff9100", "#ffeb3b"],
        velocity: { x: 0, y: 2, z: 0 },
        opacity: 1,
      });
    },
    [createEmitter]
  );

  const triggerConfetti = useCallback(
    (position: [number, number, number]) => {
      return createEmitter({
        type: "confetti",
        position,
        count: 100,
        life: 3,
        size: 0.2,
        color: ["#00f0ff", "#ff00ff", "#ff9100", "#00e676"],
        velocity: { x: 0, y: 3, z: 0 },
        opacity: 0.9,
      });
    },
    [createEmitter]
  );

  const getEmitters = useCallback(() => {
    return Array.from(emitters.values());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      emitters.forEach((emitter) => {
        if (emitter.config.type === "smoke" && !handbrake && speedKmh < 20) {
          emitter.active = false;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handbrake, speedKmh]);

  return {
    createEmitter,
    updateEmitter,
    destroyEmitter,
    triggerTireSmoke,
    triggerNitroFlame,
    triggerSparks,
    triggerConfetti,
    getEmitters,
  };
};

export type { ParticleEmitter };


