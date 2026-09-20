"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/stores/gameStore";
import { COLORS } from "@/lib/constants";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

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

const MAX_PARTICLES = 2000;

export const ParticleEffects = ({
  playerRef,
  quality = "High",
}: {
  playerRef?: React.RefObject<THREE.Object3D | null>;
  quality?: "Ultra" | "High" | "Medium" | "Low";
}) => {
  const { speedKmh, handbrake, nitro, throttle } = useGameStore();

  const smokeTexture = useTexture("/textures/particles/smoke.png");
  const sparkTexture = useTexture("/textures/particles/spark.png");
  const nitroTexture = useTexture("/textures/particles/nitro-flame.png");

  const particleCount = useMemo(() => {
    const multiplier = { Ultra: 1, High: 0.7, Medium: 0.4, Low: 0.2 };
    return Math.floor(MAX_PARTICLES * (multiplier[quality] || 0.5));
  }, [quality]);

  return (
    <>
      <SmokeParticles
        playerRef={playerRef}
        speedKmh={speedKmh}
        handbrake={handbrake}
        texture={smokeTexture}
        maxParticles={particleCount}
      />

      <SparkParticles
        playerRef={playerRef}
        speedKmh={speedKmh}
        texture={sparkTexture}
        maxParticles={Math.floor(particleCount / 2)}
      />

      <NitroFlames
        playerRef={playerRef}
        isNitro={nitro}
        texture={nitroTexture}
        maxParticles={Math.floor(particleCount / 2)}
      />
    </>
  );
};

const SmokeParticles = ({
  playerRef,
  speedKmh,
  handbrake,
  texture,
  maxParticles,
}: {
  playerRef?: React.RefObject<THREE.Object3D | null>;
  speedKmh: number;
  handbrake: boolean;
  texture: THREE.Texture;
  maxParticles: number;
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const positionsRef = useRef<Float32Array>(new Float32Array(maxParticles * 3));
  const velocitiesRef = useRef<Float32Array>(new Float32Array(maxParticles * 3));
  const alphasRef = useRef<Float32Array>(new Float32Array(maxParticles));
  const sizesRef = useRef<Float32Array>(new Float32Array(maxParticles));
  const activeCountRef = useRef(0);
  const geometryRef = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());

  useFrame((_, delta) => {
    if (!groupRef.current || !playerRef?.current) return;

    const points = groupRef.current.children[0] as THREE.Points;
    if (!points) return;

    const positions = points.geometry.attributes.position.array as Float32Array;
    const alphas = alphasRef.current;
    const sizes = sizesRef.current;
    let count = activeCountRef.current;

    if (handbrake && speedKmh > 30) {
      const slip = Math.abs(speedKmh / 200);
      const newCount = Math.min(maxParticles, count + Math.floor(slip * 5));
      for (let i = count; i < newCount; i++) {
        if (!playerRef.current) break;
        const pos = playerRef.current.position;
        positions[i * 3] = pos.x + (Math.random() - 0.5) * 2;
        positions[i * 3 + 1] = pos.y - 0.5;
        positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 2;
        velocitiesRef.current[i * 3] = (Math.random() - 0.5) * 2;
        velocitiesRef.current[i * 3 + 1] = Math.random() * 2 + 1;
        velocitiesRef.current[i * 3 + 2] = (Math.random() - 0.5) * 2;
        alphas[i] = Math.random() * 0.4 + 0.3;
        sizes[i] = Math.random() * 0.5 + 0.5;
      }
      count = newCount;
      activeCountRef.current = count;
    }

    for (let i = 0; i < count; i++) {
      velocitiesRef.current[i * 3 + 1] -= delta * 0.5;
      positions[i * 3] += velocitiesRef.current[i * 3];
      positions[i * 3 + 1] += velocitiesRef.current[i * 3 + 1];
      positions[i * 3 + 2] += velocitiesRef.current[i * 3 + 2];

      alphas[i] -= delta * 0.5;
      if (alphas[i] <= 0) {
        positions[i * 3] = 99999;
        positions[i * 3 + 1] = 99999;
        positions[i * 3 + 2] = 99999;
      }
    }

    points.geometry.attributes.position.needsUpdate = true;
  });

  const pc = Math.min(maxParticles, 500);

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position" args={[positionsRef.current, 3]} />
          <bufferAttribute attach="attributes-alpha" args={[alphasRef.current, 1]} />
          <bufferAttribute attach="attributes-size" args={[sizesRef.current, 1]} />
        </bufferGeometry>
        <pointsMaterial
          attach="material"
          map={texture}
          size={0.5}
          sizeAttenuation={true}
          transparent={true}
          alphaTest={0.01}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

const SparkParticles = ({
  playerRef,
  speedKmh,
  texture,
  maxParticles,
}: {
  playerRef?: React.RefObject<THREE.Object3D | null>;
  speedKmh: number;
  texture: THREE.Texture;
  maxParticles: number;
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const positionsRef = useRef<Float32Array>(new Float32Array(maxParticles * 3));
  const activeCountRef = useRef(0);

  useFrame(() => {
    if (!groupRef.current || !playerRef?.current) return;
    const points = groupRef.current.children[0] as THREE.Points;
    if (!points) return;

    const positions = points.geometry.attributes.position.array as Float32Array;
    let count = activeCountRef.current;

    if (Math.random() < 0.1 && speedKmh > 50) {
      const newCount = Math.min(maxParticles, count + 5);
      for (let i = count; i < newCount; i++) {
        if (!playerRef.current) break;
        const pos = playerRef.current.position;
        positions[i * 3] = pos.x + (Math.random() - 0.5) * 4;
        positions[i * 3 + 1] = Math.max(0.1, pos.y - 0.3);
        positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 4;
      }
      count = newCount;
      activeCountRef.current = count;
    }

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= 0.1;
      if (positions[i * 3 + 1] < 0.1) {
        positions[i * 3] = 99999;
        positions[i * 3 + 1] = 99999;
        positions[i * 3 + 2] = 99999;
      }
    }

    points.geometry.attributes.position.needsUpdate = true;
  });

  const pc = Math.min(maxParticles, 200);

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position" args={[positionsRef.current, 3]} />
        </bufferGeometry>
        <pointsMaterial
          attach="material"
          map={texture}
          size={0.3}
          sizeAttenuation={true}
          transparent
          opacity={1}
          color={COLORS.accent}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

const NitroFlames = ({
  playerRef,
  isNitro,
  texture,
  maxParticles,
}: {
  playerRef?: React.RefObject<THREE.Object3D | null>;
  isNitro: boolean;
  texture: THREE.Texture;
  maxParticles: number;
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const positionsRef = useRef<Float32Array>(new Float32Array(maxParticles * 3));
  const alphasRef = useRef<Float32Array>(new Float32Array(maxParticles));
  const sizesRef = useRef<Float32Array>(new Float32Array(maxParticles));
  const activeCountRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current || !playerRef?.current) return;
    const points = groupRef.current.children[0] as THREE.Points;
    if (!points) return;

    const positions = points.geometry.attributes.position.array as Float32Array;
    const alphas = alphasRef.current;
    const sizes = sizesRef.current;
    let count = activeCountRef.current;

    if (isNitro) {
      const newCount = Math.min(maxParticles, count + 20);
      for (let i = count; i < newCount; i++) {
        if (!playerRef.current) break;
        const pos = playerRef.current.position;
        positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = pos.y - 0.8;
        positions[i * 3 + 2] = pos.z - 2.5;
        alphas[i] = Math.random() * 0.5 + 0.5;
        sizes[i] = Math.random() * 0.4 + 0.2;
      }
      count = newCount;
      activeCountRef.current = count;
    }

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += delta * 3;
      alphas[i] -= delta * 2;
      sizes[i] += delta * 0.5;
      if (alphas[i] <= 0) {
        positions[i * 3] = 99999;
        positions[i * 3 + 1] = 99999;
        positions[i * 3 + 2] = 99999;
      }
    }

    points.geometry.attributes.position.needsUpdate = true;
  });

  const pc = Math.min(maxParticles, 100);

  return (
    <group ref={groupRef} visible={isNitro}>
      <points>
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position" args={[positionsRef.current, 3]} />
          <bufferAttribute attach="attributes-alpha" args={[alphasRef.current, 1]} />
          <bufferAttribute attach="attributes-size" args={[sizesRef.current, 1]} />
        </bufferGeometry>
        <pointsMaterial
          attach="material"
          map={texture}
          size={0.5}
          sizeAttenuation={true}
          transparent
          alphaTest={0.01}
          depthWrite={false}
          color={COLORS.accent}
          toneMapped={false}
        />
      </points>
    </group>
  );
};

export default ParticleEffects;


