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
  objectRef?: React.MutableRefObject<THREE.Object3D | null>;
}

export const Vehicle = ({
  carId = "phantom-gt",
  isLocal = false,
  playerId,
  position = [0, 1, 0],
  rotation = [0, 0, 0],
  networked = false,
  networkedState = null,
  objectRef,
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
    if (objectRef) objectRef.current = ref.current;
    return api.velocity.subscribe((v: [number, number, number]) => {
      velocityRef.current = v;
    });
  }, [api.velocity, objectRef, ref]);

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
      const yawRate = steerAngle * Math.min(1, speedKmh / 35) * 2.5;
      api.angularVelocity.set(0, -yawRate, 0);
    } else {
      api.angularVelocity.set(0, 0, 0);
    }

    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(ref.current.quaternion);
    const currentHorizontalVelocity = new THREE.Vector3(vx, 0, vz);
    const targetSpeed = throttleInput * (carConfig.topSpeed / 3.6);
    const desiredVelocity = forwardDir.clone().multiplyScalar(targetSpeed);
    const response = throttleInput > 0 ? Math.min(1, delta * 5) : Math.min(1, delta * 3);
    const controlledVelocity = currentHorizontalVelocity.lerp(desiredVelocity, response);
    api.velocity.set(controlledVelocity.x, vy, controlledVelocity.z);

    if (brakeInput) {
      api.velocity.set(controlledVelocity.x * 0.75, vy, controlledVelocity.z * 0.75);
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
      const nitroVelocity = forwardDir.clone().multiplyScalar(carConfig.nitro * 4);
      api.velocity.set(
        controlledVelocity.x + nitroVelocity.x * delta,
        vy,
        controlledVelocity.z + nitroVelocity.z * delta,
      );

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
        position={[0, 0.15, 0]}
      >
        <boxGeometry args={[3.8, 0.65, 1.75]} />
        <meshStandardMaterial
          color={carConfig.color}
          metalness={0.72}
          roughness={0.22}
        />
      </mesh>

      <mesh position={[0, 0.7, 0.25]} castShadow>
        <boxGeometry args={[2.0, 0.55, 1.35]} />
        <meshStandardMaterial color="#151b22" metalness={0.35} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.72, 0.48]} castShadow>
        <boxGeometry args={[1.55, 0.32, 0.95]} />
        <meshStandardMaterial color="#263a4a" metalness={0.5} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.03, -1.0]} castShadow>
        <boxGeometry args={[3.35, 0.12, 0.25]} />
        <meshStandardMaterial color="#090b0d" metalness={0.25} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.47, -1.0]} castShadow>
        <boxGeometry args={[2.55, 0.08, 0.16]} />
        <meshStandardMaterial color={carConfig.color} emissive={carConfig.color} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.22, 1.0]} castShadow>
        <boxGeometry args={[3.2, 0.1, 0.18]} />
        <meshStandardMaterial color="#d7e5e8" emissive="#d7e5e8" emissiveIntensity={0.4} />
      </mesh>

      {wheelPositions.map((pos, i) => (
        <WheelComponent key={i} position={pos} />
      ))}
    </group>
  );
};

const WheelComponent = ({ position }: { position: [number, number, number] }) => {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.42, 0.42, 0.34, 16]} />
      <meshStandardMaterial color="#0a0d10" metalness={0.8} roughness={0.2} />
      <mesh position={[0, 0.18, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.02, 12]} />
        <meshStandardMaterial color="#b7c1c4" metalness={0.85} roughness={0.18} />
      </mesh>
    </mesh>
  );
};

export default Vehicle;


