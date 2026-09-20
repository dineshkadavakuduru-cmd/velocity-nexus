"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { CAR_CONFIGS } from "@/lib/constants";
import { TrackConfig } from "@/types";
import * as THREE from "three";

interface AIVehicleProps {
  carId: string;
  track: TrackConfig;
  initialPosition: [number, number, number];
  difficulty: "easy" | "medium" | "hard";
}

type Waypoint = {
  position: THREE.Vector3;
  direction: THREE.Vector3;
};

const Wheel = ({ position }: { position: [number, number, number] }) => {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.35, 0.35, 0.3, 32]} />
      <meshStandardMaterial color="#222" metalness={0.95} roughness={0.05} />
    </mesh>
  );
};

export const AIVehicle = ({
  carId,
  track,
  initialPosition,
  difficulty = "medium",
}: AIVehicleProps) => {
  const groupRef = useRef<THREE.Group>(null!);
  const stateRef = useRef<{
    speed: number;
    steering: number;
    targetWaypoint: number;
    waypoints: Waypoint[];
    gear: number;
  }>({
    speed: 0,
    steering: 0,
    targetWaypoint: 0,
    waypoints: [],
    gear: 1,
  });

  const carConfig = useMemo(() => CAR_CONFIGS.find((c) => c.id === carId) || CAR_CONFIGS[0], [carId]);

  const difficultyMultipliers = {
    easy: 0.5,
    medium: 0.75,
    hard: 1.0,
  };

  const multiplier = difficultyMultipliers[difficulty];

  useEffect(() => {
    const waypoints: Waypoint[] = [];

    if (track.checkpoints && track.checkpoints.length > 0) {
      track.checkpoints.forEach((cp, i) => {
        const nextCp = track.checkpoints[(i + 1) % track.checkpoints.length];
        const pos = new THREE.Vector3(cp.x, 0, cp.z);
        const nextPos = new THREE.Vector3(nextCp.x, 0, nextCp.z);
        const dir = new THREE.Vector3().subVectors(nextPos, pos).normalize();
        waypoints.push({ position: pos, direction: dir });
      });
    } else {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 40;
        const pos = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        const dir = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
        waypoints.push({ position: pos, direction: dir });
      }
    }

    stateRef.current.waypoints = waypoints;
    stateRef.current.targetWaypoint = 0;
  }, [track]);

  const getInput = () => {
    if (stateRef.current.waypoints.length === 0) {
      return { throttle: 0, brake: false, steering: 0, handbrake: false };
    }

    const wp = stateRef.current.waypoints[stateRef.current.targetWaypoint];
    if (!wp) {
      stateRef.current.targetWaypoint = 0;
      return { throttle: 1, brake: false, steering: 0, handbrake: false };
    }

    if (!groupRef.current) {
      return { throttle: 1, brake: false, steering: 0, handbrake: false };
    }

    const toTarget = new THREE.Vector3().subVectors(wp.position, groupRef.current.position);
    const distance = toTarget.length();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(groupRef.current.quaternion);

    const cross = new THREE.Vector3().crossVectors(toTarget.normalize(), forward);
    const steerInput = THREE.MathUtils.clamp(cross.y * 2, -1, 1);

    if (distance < 5) {
      stateRef.current.targetWaypoint = (stateRef.current.targetWaypoint + 1) % stateRef.current.waypoints.length;
    }

    const speedFactor = Math.abs(steerInput) < 0.3 ? 1 : 0.8;
    const throttleInput = Math.min(1, speedFactor * multiplier + 0.3);
    const brakeInput = steerInput > 0.7 ? true : false;

    return {
      throttle: throttleInput,
      brake: brakeInput,
      steering: steerInput,
      handbrake: false,
    };
  };

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const input = getInput();

    stateRef.current.speed += input.throttle * carConfig.enginePower * multiplier * delta * 0.01;
    stateRef.current.speed *= 0.98;

    if (input.brake) {
      stateRef.current.speed *= 0.95;
    }

    const maxSpeed = carConfig.topSpeed * multiplier;
    if (stateRef.current.speed > maxSpeed) {
      stateRef.current.speed = maxSpeed;
    }

    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(groupRef.current.quaternion);
    groupRef.current.position.add(direction.multiplyScalar(stateRef.current.speed * delta * 0.001));

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      groupRef.current.rotation.y + input.steering * delta * 2,
      0.1
    );
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      <mesh castShadow receiveShadow position={[0, -0.3, 0]}>
        <boxGeometry args={[3.8, 0.65, 1.75]} />
        <meshStandardMaterial color={carConfig.color} metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh castShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[2, 0.55, 1.35]} />
        <meshStandardMaterial color="#17222b" metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.94, 0.25]}>
        <boxGeometry args={[1.55, 0.3, 0.95]} />
        <meshStandardMaterial color="#294153" metalness={0.5} roughness={0.12} />
      </mesh>
      <Wheel position={[-1.2, -0.5, 1.6]} />
      <Wheel position={[1.2, -0.5, 1.6]} />
      <Wheel position={[-1.2, -0.5, -1.6]} />
      <Wheel position={[1.2, -0.5, -1.6]} />
    </group>
  );
};

export default AIVehicle;


