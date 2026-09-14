"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSpring } from "motion/react";
import { useGameStore } from "@/stores/gameStore";
import { GAME_CONSTANTS, COLORS } from "@/lib/constants";
import * as THREE from "three";

type CameraMode = "chase" | "cockpit" | "cinematic";

interface CameraControllerProps {
  playerRef: React.RefObject<THREE.Object3D>;
  cameraMode?: CameraMode;
}

const SMOOTHNESS = 0.1;
const HEIGHT_OFFSET_CHASE = 5;
const DISTANCE_CHASE = 12;
const HEIGHT_OFFSET_COCKPIT = 1;
const DISTANCE_COCKPIT = 0;

export const CameraController = ({
  playerRef,
  cameraMode = "chase",
}: CameraControllerProps) => {
  const { camera, mouse, viewport } = useThree();
  const gameStore = useGameStore();
  const camModeRef = useRef<CameraMode>(cameraMode);
  const targetPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetQuatRef = useRef(new THREE.Quaternion(0, 0, 0, 1));
  const speedFactorRef = useRef(0);
  const shakeRef = useRef(0);
  const lastVelocityRef = useRef(new THREE.Vector3(0, 0, 0));

  camModeRef.current = cameraMode;

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const player = playerRef.current;
    const pos = player.position;
    const quat = player.quaternion;

    const playerVel = new THREE.Vector3(
      gameStore.speedKmh * 0.05,
      0,
      0
    );
    speedFactorRef.current = THREE.MathUtils.lerp(
      speedFactorRef.current,
      Math.min(gameStore.speedKmh / 400, 1),
      0.05
    );

    let desiredPosition: THREE.Vector3;
    let desiredLookAt: THREE.Vector3;

    switch (camModeRef.current) {
      case "chase":
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
        const up = new THREE.Vector3(0, 1, 0);

        const backDir = forward.clone().negate();
        const chaseDir = backDir.clone().multiplyScalar(DISTANCE_CHASE * (1 + speedFactorRef.current * 0.5));
        const sideOffset = right.clone().multiplyScalar(gameStore.steering * 2);
        const heightOffset = up.clone().multiplyScalar(HEIGHT_OFFSET_CHASE + speedFactorRef.current * 2);

        desiredPosition = pos.clone().add(chaseDir).add(sideOffset).add(heightOffset);

        desiredLookAt = player.position.clone().add(forward.clone().multiplyScalar(5));

        const fov = THREE.MathUtils.lerp(70, 85, speedFactorRef.current);
        (camera as any).fov = fov;
        (camera as any).updateProjectionMatrix();
        break;

      case "cockpit":
        const cockpitForward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
        const cockpitRight = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
        const offset = new THREE.Vector3(0, 0.8, 0.5);
        desiredPosition = pos.clone().add(offset);

        desiredLookAt = pos.clone().add(cockpitForward.clone().multiplyScalar(20));
        break;

      case "cinematic":
        const angle = state.clock.elapsedTime * 0.2;
        const radius = 15 + speedFactorRef.current * 5;
        const cineX = pos.x + Math.cos(angle) * radius;
        const cineZ = pos.z + Math.sin(angle) * radius;
        desiredPosition = new THREE.Vector3(cineX, pos.y + 5, cineZ);
        desiredLookAt = pos.clone();
        break;

      default:
        desiredPosition = pos.clone().add(new THREE.Vector3(0, HEIGHT_OFFSET_CHASE, -DISTANCE_CHASE));
        desiredLookAt = pos.clone();
    }

    targetPosRef.current.lerp(desiredPosition, SMOOTHNESS);
    targetQuatRef.current.slerp(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, -1),
        desiredLookAt.clone().sub(targetPosRef.current).normalize()
      ),
      SMOOTHNESS
    );

    const camVel = playerVel.clone().sub(lastVelocityRef.current).divideScalar(delta || 0.016);
    const shakeMagnitude = Math.min(camVel.length() * 0.5, 0.5);
    lastVelocityRef.current = playerVel.clone();

    const shake = new THREE.Vector3(
      (Math.random() - 0.5) * shakeMagnitude * 0.3,
      (Math.random() - 0.5) * shakeMagnitude * 0.3,
      (Math.random() - 0.5) * shakeMagnitude * 0.3
    );

    camera.position.lerp(targetPosRef.current.clone().add(shake), 0.1);
    camera.quaternion.slerp(targetQuatRef.current, 0.1);
  });

  return null;
};

export default CameraController;


