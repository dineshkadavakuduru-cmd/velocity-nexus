"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { COLORS } from "@/lib/constants";
import * as THREE from "three";

export const WeatherSystem = ({
  weather = "clear",
  timeOfDay = "day",
}: {
  weather?: "clear" | "rain" | "fog" | "storm";
  timeOfDay?: "day" | "night" | "sunset" | "dawn";
}) => {
  const rainCount = weather === "storm" ? 2000 : weather === "rain" ? 1000 : 0;
  const rainPositions = useMemo(() => {
    return new Float32Array(
      Array.from({ length: rainCount }, () => [
        Math.random() * 200 - 100,
        Math.random() * 100 + 50,
        Math.random() * 200 - 100,
      ]).flat()
    );
  }, [rainCount]);

  useFrame((_, delta) => {
    if (rainCount > 0) {
      for (let i = 0; i < rainCount; i++) {
        rainPositions[i * 3 + 1] -= delta * 30;
        if (rainPositions[i * 3 + 1] < -10) {
          rainPositions[i * 3 + 1] = 60;
          rainPositions[i * 3] = Math.random() * 200 - 100;
          rainPositions[i * 3 + 2] = Math.random() * 200 - 100;
        }
      }
    }
  });

  const skyColor = {
    day: "#87ceeb",
    night: "#0a0a2a",
    sunset: "#ff7e5f",
    dawn: "#4a5d6b",
  };

  return (
    <>
      <color attach="background" args={[skyColor[timeOfDay]]} />

      {weather === "fog" && (
        <fog attach="fog" args={[skyColor[timeOfDay], 10, 50]} />
      )}

      {rainCount > 0 && (
        <points>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              args={[rainPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            attach="material"
            size={0.3}
            sizeAttenuation={true}
            transparent
            opacity={0.6}
            color="#a0c8f0"
            depthWrite={false}
          />
        </points>
      )}
    </>
  );
};

export const SkyEnvironment = ({
  timeOfDay = "day",
  weather = "clear",
}: {
  timeOfDay?: "day" | "night" | "sunset" | "dawn";
  weather?: "clear" | "rain" | "fog" | "storm";
}) => {
  const skyColor = {
    day: "#87ceeb",
    night: "#0a0a2a",
    sunset: "#ff7e5f",
    dawn: "#4a5d6b",
  };

  const fogColor = {
    day: "#ffffff",
    night: "#0a0a2a",
    sunset: "#ff9a8b",
    dawn: "#4a5d6b",
  };

  return (
    <>
      <color attach="background" args={[skyColor[timeOfDay]]} />
      <fog
        attach="fog"
        args={[fogColor[timeOfDay], 50, 200]}
      />
      <ambientLight
        intensity={timeOfDay === "night" ? 0.2 : 0.5}
        color={skyColor[timeOfDay]}
      />
      <directionalLight
        position={[10, 30, 10]}
        intensity={timeOfDay === "night" ? 0.8 : 1.5}
        color={timeOfDay === "sunset" ? "#ff9100" : "#ffffff"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-left={-50}
        shadow-camera-right={50}
      />
    </>
  );
};

export default WeatherSystem;


