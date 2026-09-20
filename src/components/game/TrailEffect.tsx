"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/stores/gameStore";
import { COLORS } from "@/lib/constants";
import * as THREE from "three";

interface TrailEffectProps {
  playerRef?: React.RefObject<THREE.Object3D | null>;
  enabled?: boolean;
  maxTrails?: number;
}

export const TrailEffect = ({
  playerRef,
  enabled = true,
  maxTrails = 50,
}: TrailEffectProps) => {
  const trailRef = useRef<THREE.Group>(null!);
  const trailPointsRef = useRef<THREE.Vector3[]>([]);
  const lastPosRef = useRef<THREE.Vector3 | null>(null);
  const segmentLengthRef = useRef(0);
  const { speedKmh, handbrake } = useGameStore();

  const positions = useRef<Float32Array>(new Float32Array(maxTrails * 3));
  const geometryRef = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());

  useFrame((_, delta) => {
    if (!playerRef?.current || !enabled || !geometryRef.current) return;

    const pos = playerRef.current.position;
    const speedThreshold = handbrake && speedKmh > 30;

    if (speedThreshold) {
      if (!lastPosRef.current) {
        lastPosRef.current = pos.clone();
      } else {
        const distance = pos.distanceTo(lastPosRef.current);
        segmentLengthRef.current += distance;

        if (segmentLengthRef.current > 0.5) {
          segmentLengthRef.current = 0;
          lastPosRef.current = pos.clone();

          const newTrail = pos.clone().add(new THREE.Vector3(0, -0.3, 0));
          trailPointsRef.current.push(newTrail);

          if (trailPointsRef.current.length > maxTrails) {
            trailPointsRef.current.shift();
          }
        }
      }
    } else {
      if (trailPointsRef.current.length > 0) {
        trailPointsRef.current = trailPointsRef.current.slice(-Math.max(0, trailPointsRef.current.length - 2));
      }
    }

    const posArray = positions.current;

    for (let i = 0; i < trailPointsRef.current.length; i++) {
      const trail = trailPointsRef.current[i];
      posArray[i * 3] = trail.x;
      posArray[i * 3 + 1] = trail.y;
      posArray[i * 3 + 2] = trail.z;
    }

    for (let i = trailPointsRef.current.length; i < maxTrails; i++) {
      posArray[i * 3] = 99999;
      posArray[i * 3 + 1] = 99999;
      posArray[i * 3 + 2] = 99999;
    }

    geometryRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={trailRef} visible={enabled && handbrake && speedKmh > 20}>
      <line>
        <bufferGeometry attach="geometry" ref={geometryRef}>
          <bufferAttribute attach="attributes-position" attach-object-index={0} args={[positions.current, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          attach="material"
          transparent
          color={COLORS.primary}
          opacity={0.4}
          toneMapped={false}
        />
      </line>
    </group>
  );
};

export default TrailEffect;


