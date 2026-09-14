"use client";

import { useMemo } from "react";
import { useGameStore } from "@/stores/gameStore";
import { CAR_CONFIGS } from "@/lib/constants";
import { PlayerState } from "@/types";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";

interface OpponentVehicleProps {
  player: PlayerState;
  interpolationBuffer?: boolean;
}

export const OpponentVehicle = ({
  player,
  interpolationBuffer = true,
}: OpponentVehicleProps) => {
  const meshRef = useRef<THREE.Group>(null!);
  const carConfig = useMemo(() => CAR_CONFIGS.find((c) => c.id === player.carId) || CAR_CONFIGS[0], [player.carId]);

  useFrame(() => {
    if (!meshRef.current) return;

    const targetPos = new THREE.Vector3(player.position.x, player.position.y, player.position.z);

    if (interpolationBuffer) {
      meshRef.current.position.lerp(targetPos, 0.1);
      const targetQuat = new THREE.Quaternion(player.rotation.x, player.rotation.y, player.rotation.z, player.rotation.w);
      meshRef.current.quaternion.slerp(targetQuat, 0.1);
    } else {
      meshRef.current.position.copy(targetPos);
      meshRef.current.quaternion.set(player.rotation.x, player.rotation.y, player.rotation.z, player.rotation.w);
    }
  });

  const bodyColor = player.color || carConfig.color;

  return (
    <group ref={meshRef}>
      <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
        <boxGeometry args={[4, 1.5, 1.5]} />
        <meshStandardMaterial color={bodyColor} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[1.5, 1, 1]} />
        <meshStandardMaterial color={bodyColor} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh castShadow position={[0, 0, 2.2]}>
        <boxGeometry args={[2, 0.5, 0.8]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0, 0, -2.2]}>
        <boxGeometry args={[2, 0.5, 0.8]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      <Wheel position={[-1.2, -0.5, 1.6]} isSteering />
      <Wheel position={[1.2, -0.5, 1.6]} isSteering />
      <Wheel position={[-1.2, -0.5, -1.6]} />
      <Wheel position={[1.2, -0.5, -1.6]} />
    </group>
  );
};

const Wheel = ({ position, isSteering = false }: { position: [number, number, number]; isSteering?: boolean }) => {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.35, 0.35, 0.3, 32]} />
      <meshStandardMaterial color="#111" metalness={0.95} roughness={0.05} />
    </mesh>
  );
};

export default OpponentVehicle;


