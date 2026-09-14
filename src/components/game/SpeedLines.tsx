"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "@/stores/gameStore";
import { COLORS } from "@/lib/constants";
import * as THREE from "three";

interface SpeedLinesProps {
  speed: number;
  quality?: "Ultra" | "High" | "Medium" | "Low";
}

export const SpeedLines = ({ speed, quality = "High" }: SpeedLinesProps) => {
  const lineCount = quality === "Low" ? 5 : quality === "Medium" ? 10 : quality === "High" ? 20 : 30;
  const speedFactor = Math.min(speed / 300, 1);
  const linesRef = useRef<THREE.Group>(null!);
  const lineRefs = useRef<THREE.Mesh[]>([]);

  useFrame((_, delta) => {
    if (!linesRef.current) return;

    lineRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const offset = (i * 0.2 + Date.now() * 0.001) % 10;
      mesh.position.x = -20 + offset * 5;
      const scale = speedFactor * (0.5 + (i % 3) * 0.3);
      mesh.scale.set(1, scale, 1);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = speedFactor * (0.3 + (i % 3) * 0.2);
    });
  });

  return (
    <group ref={linesRef} position={[0, 0, -5]}>
      {Array.from({ length: lineCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) lineRefs.current[i] = el;
          }}
          position={[-20 + i * 2, (Math.random() - 0.5) * 5, 0]}
        >
          <planeGeometry args={[0.1, 6 + i * 0.3]} />
          <meshBasicMaterial
            transparent
            side={THREE.DoubleSide}
            color={COLORS.primary}
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
};

export default SpeedLines;


