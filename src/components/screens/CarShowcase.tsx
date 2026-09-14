"use client";

import { useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { motion } from "motion/react";
import * as THREE from "three";
import { CAR_CONFIGS } from "@/lib/constants";
import { COLORS } from "@/lib/constants";

const CarModel = ({ color }: { color: string }) => {
  return (
    <group>
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.5, 1.5]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 1]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0, 2.2]} castShadow>
        <boxGeometry args={[2, 0.5, 0.8]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, -2.2]} castShadow>
        <boxGeometry args={[2, 0.5, 0.8]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1.2, -0.5, 1.2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 30]} />
        <meshStandardMaterial color="#111" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[1.2, -0.5, 1.2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 30]} />
        <meshStandardMaterial color="#111" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[-1.2, -0.5, -1.2]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.3, 30]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} metalness={0.95} roughness={0.05} />
        <mesh position={[0, 0.01, 0]}>
          <ringGeometry args={[0.5, 0.65, 30]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
      </mesh>
      <mesh position={[1.2, -0.5, -1.2]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.3, 30]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} metalness={0.95} roughness={0.05} />
        <mesh position={[0, 0.01, 0]}>
          <ringGeometry args={[0.5, 0.65, 30]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
      </mesh>

      {Array.from({ length: 6 }).map((_, i) => {
        const side = i < 3 ? -1 : 1;
        const pos = Math.floor(i % 3);
        const lightPos: [number, number, number] = [side * 1.8, -0.3, (pos - 1) * 0.6];
        return (
          <pointLight
            key={i}
            position={lightPos}
            intensity={0.5}
            color={color}
            distance={5}
          />
        );
      })}
    </group>
  );
};

const Scene = ({ color }: { color: string }) => {
  return (
    <>
      <Environment preset="apartment" />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-10, 15, -10]} intensity={0.3} />

      <CarModel color={color} />

      <ContactShadows
        position={[0, -1.01, 0]}
        opacity={0.5}
        scale={10}
        blur={2}
        far={5}
      />
    </>
  );
};

interface CarShowcaseProps {
  loaded?: boolean;
}

export const CarShowcase = ({ loaded = true }: CarShowcaseProps) => {
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const selectedCar = CAR_CONFIGS[selectedCarIndex];

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 2, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      onCreated={(state) => {
          state.gl.shadowMap.enabled = true;
          state.gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      >
        <color attach="background" args={["#050505"]} />
        <Scene color={selectedCar.color} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 4}
        />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.6} mipmapBlur />
          <ChromaticAberration offset={[0.001, 0.001]} />
          <Vignette eskil={false} offset={0.2} darkness={0.4} />
        </EffectComposer>
      </Canvas>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pb-4">
        {CAR_CONFIGS.slice(0, 3).map((car, i) => (
          <motion.button
            key={car.id}
            onClick={() => setSelectedCarIndex(i)}
            className="px-3 py-1 rounded-lg text-sm font-display"
            style={{
              background: i === selectedCarIndex
                ? `linear-gradient(135deg, ${COLORS.primary}40, ${COLORS.secondary}40)`
                : "rgba(30, 30, 30, 0.5)",
              color: i === selectedCarIndex ? COLORS.primary : COLORS.textSecondary,
              border: `1px solid ${i === selectedCarIndex ? COLORS.primary : COLORS.border}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {car.name}
          </motion.button>
        ))}
      </div>

      <motion.div
        className="absolute top-4 right-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div
          className="px-4 py-2 rounded-xl font-display"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="text-xs text-secondary">TOP SPEED</div>
          <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            {selectedCar.topSpeed} KM/H
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CarShowcase;


