"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCompoundBody } from "@react-three/cannon";
import { useGameStore } from "@/stores/gameStore";
import { useVehicleControls } from "@/hooks/useVehicleControls";
import { CAR_CONFIGS } from "@/lib/constants";
import { useParticles } from "@/hooks/useParticles";
import { getEngineRpm, getOptimalGear, getDamageMultiplier } from "@/lib/physics";
import { VehicleConfig, Vector3 } from "@/types";
import * as THREE from "three";

interface VehicleProps {
  carId?: string;
  isLocal?: boolean;
  playerId?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  networked?: boolean;
  networkedState?: {
    position: Vector3;
    rotation: { x: number; y: number; z: number; w: number };
    velocity: Vector3;
  } | null;
}

export const Vehicle = ({
  carId = "phantom-gt",
  isLocal = false,
  playerId,
  position = [0, 1, 0],
  rotation = [0, 0, 0],
  networked = false,
  networkedState = null,
}: VehicleProps) => {
  const controls = useVehicleControls();
  const particles = useParticles();

  const carConfig = useMemo(() => CAR_CONFIGS.find((c) => c.id === carId) || CAR_CONFIGS[0], [carId]);

  const rpmRef = useRef(800);
  const gearRef = useRef(1);
  const speedRef = useRef(0);
  const steeringRef = useRef(0);
  const driftAngleRef = useRef(0);
  const nitroLevelRef = useRef(100);
  const driftScoreRef = useRef(0);
  const damageRef = useRef({ front: 0, rear: 0, left: 0, right: 0 });
  const visibleGearRef = useRef(1);

  const [visibleGear, setVisibleGear] = useState(1);
  const velocityRef = useRef<[number, number, number]>([0, 0, 0]);

  const [ref, api] = useCompoundBody(() => ({
    mass: carConfig.mass,
    position,
    rotation,
    shapes: [{ type: "Box", hsz: [2.2, 0.8, 5.0], cx: 0, cy: 0, cz: 0 }],
    material: "car",
  }) as any);

  useEffect(() => {
    return api.velocity.subscribe((v: [number, number, number]) => {
      velocityRef.current = v;
    });
  }, [api.velocity]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    if (networked && !isLocal && networkedState) {
      ref.current.position.lerp(
        new THREE.Vector3(networkedState.position.x, networkedState.position.y, networkedState.position.z),
        0.1
      );
      const targetQuat = new THREE.Quaternion(
        networkedState.rotation.x, networkedState.rotation.y, networkedState.rotation.z, networkedState.rotation.w
      );
      ref.current.quaternion.slerp(targetQuat, 0.1);
      return;
    }

    if (!isLocal) return;

    const [vx, vy, vz] = velocityRef.current;
    const speedKmh = Math.sqrt(vx * vx + vy * vy + vz * vz) * 3.6;

    const rpm = getEngineRpm(speedKmh, gearRef.current, carConfig.gearRatios, carConfig.finalDrive);
    rpmRef.current = rpm;
    speedRef.current = speedKmh;

    const optimalGear = getOptimalGear(speedKmh, carConfig.gearRatios, carConfig.finalDrive);
    if (optimalGear !== gearRef.current && speedKmh > 10) {
      gearRef.current = optimalGear;
      setVisibleGear(optimalGear);
      visibleGearRef.current = optimalGear;
    }

    const steeringInput = controls.steering;
    const throttleInput = controls.throttle;
    const brakeInput = controls.brake;
    const handbrakeInput = controls.handbrake;
    const nitroInput = controls.nitro;

    const maxSteer = THREE.MathUtils.degToRad(35);
    const speedSensitiveSteer = maxSteer * (1 - Math.min(speedKmh / carConfig.topSpeed, 0.7));
    const steerAngle = steeringInput * speedSensitiveSteer;
    steeringRef.current = steerAngle;

    const engineTorque = carConfig.enginePower * throttleInput * (1 + (nitroInput && nitroLevelRef.current > 0 ? carConfig.nitro / 10 : 0));
    const effectiveTorque = engineTorque * getDamageMultiplier((damageRef.current.front + damageRef.current.rear) / 2);

    if (Math.abs(steerAngle) > 0.01) {
      api.applyTorque([0, -steerAngle * 200, 0] as [number, number, number]);
    }

    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(ref.current.quaternion);
    if (throttleInput > 0) {
      const force: [number, number, number] = [
        forwardDir.x * effectiveTorque * 20,
        forwardDir.y * effectiveTorque * 20,
        forwardDir.z * effectiveTorque * 20,
      ];
      api.applyForce(force, ref.current.position.toArray() as [number, number, number]);
    }

    if (brakeInput) {
      api.applyForce([0, 0, 500] as [number, number, number], ref.current.position.toArray() as [number, number, number]);
    }

    if (handbrakeInput) {
      api.velocity.set(vx * 0.95, vy * 0.95, vz * 0.95);
      api.angularVelocity.set(0, 0, 0);

      driftAngleRef.current = Math.abs(steeringInput);
      if (driftAngleRef.current > 0.3 && speedKmh > 20) {
        driftScoreRef.current += delta * carConfig.driftModifier * 100;
        if (Math.floor(driftScoreRef.current / 100) > Math.floor((driftScoreRef.current - delta * carConfig.driftModifier * 100) / 100)) {
          const pos: [number, number, number] = [ref.current.position.x, ref.current.position.y - 0.5, ref.current.position.z];
          particles.triggerTireSmoke(pos, driftAngleRef.current);
        }
      }
    } else {
      driftAngleRef.current *= 0.9;
      driftScoreRef.current = 0;
    }

    if (nitroInput && nitroLevelRef.current > 0) {
      nitroLevelRef.current = Math.max(0, nitroLevelRef.current - delta * 20);
      const force: [number, number, number] = [
        forwardDir.x * carConfig.enginePower * 100,
        forwardDir.y * carConfig.enginePower * 100,
        forwardDir.z * carConfig.enginePower * 100,
      ];
      api.applyForce(force, ref.current.position.toArray() as [number, number, number]);

      if (Math.floor(nitroLevelRef.current / 5) > Math.floor((nitroLevelRef.current + delta * 20) / 5)) {
        const pos: [number, number, number] = [ref.current.position.x, ref.current.position.y - 0.5, ref.current.position.z - 2.2];
        particles.triggerNitroFlame(pos);
      }
    } else {
      nitroLevelRef.current = Math.min(100, nitroLevelRef.current + delta * 5);
    }

    useGameStore.getState().setVehicleState(
      speedKmh, rpm, visibleGear, throttleInput, steerAngle, brakeInput, handbrakeInput, nitroInput
    );
    useGameStore.getState().setNitroLevel(nitroLevelRef.current);

    const posArr = ref.current.position.toArray();
    useGameStore.getState().setPlayerState(useGameStore.getState().localPlayerId, {
      position: { x: posArr[0], y: posArr[1], z: posArr[2] },
      rotation: ref.current.quaternion,
      velocity: { x: vx, y: vy, z: vz },
    });
  });

  const wheelPositions: [number, number, number][] = [
    [-1.2, -0.5, 1.6],
    [1.2, -0.5, 1.6],
    [-1.2, -0.5, -1.6],
    [1.2, -0.5, -1.6],
  ];

  return (
    <group>
      <mesh
        ref={ref as any}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[4, 1.5, 1.5]} />
        <meshStandardMaterial
          color={carConfig.color}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {wheelPositions.map((pos, i) => (
        <WheelComponent key={i} position={pos} />
      ))}
    </group>
  );
};

const WheelComponent = ({ position }: { position: [number, number, number] }) => {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.35, 0.35, 0.3, 32]} />
      <meshStandardMaterial color="#111" metalness={0.95} roughness={0.05} />
    </mesh>
  );
};

export default Vehicle;


