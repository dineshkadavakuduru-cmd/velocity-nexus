"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { usePlane, useBox, useTrimesh } from "@react-three/cannon";
import { TRACK_CONFIGS } from "@/lib/constants";
import { TrackConfig, Vector3 } from "@/types";
import * as THREE from "three";

interface TrackProps {
  trackId?: string;
  onLoadComplete?: () => void;
  playerRef?: React.RefObject<THREE.Object3D | null>;
  onCheckpoint?: (index: number) => void;
}

interface CheckpointProps {
  position: [number, number, number];
  index: number;
  playerRef?: React.RefObject<THREE.Object3D | null>;
  onComplete?: (index: number) => void;
}

export const Checkpoint = ({ position, index, playerRef, onComplete }: CheckpointProps) => {
  const checkpointRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!checkpointRef.current || !playerRef?.current) return;
    const distance = checkpointRef.current.position.distanceTo(playerRef.current.position);
    if (distance < 3 && onComplete) {
      onComplete(index);
    }
  });

  return (
    <mesh ref={checkpointRef} position={position}>
      <torusGeometry args={[3, 0.08, 8, 32]} />
      <meshBasicMaterial color={index === 0 ? "#f59e0b" : "#64d8ff"} transparent opacity={0.45} />
    </mesh>
  );
};

interface BoxColliderProps {
  args: [number, number, number];
  position: [number, number, number];
}

const BoxCollider = ({ args, position }: BoxColliderProps) => {
  const [ref] = useBox(() => ({
    args,
    position,
    type: "Static",
    material: "ground",
  }));

  return (
    <mesh ref={ref as any} visible={false}>
      <boxGeometry args={args} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export const TrackBarriers = ({
  trackBounds,
}: {
  trackBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}) => {
  const barrierHeight = 2;
  const barrierThickness = 0.5;

  const wallLengthX = trackBounds.maxZ - trackBounds.minZ + barrierThickness * 2;
  const wallLengthZ = trackBounds.maxX - trackBounds.minX + barrierThickness * 2;

  const walls: Array<{ args: [number, number, number]; position: [number, number, number] }> = [
    { args: [barrierThickness, barrierHeight, wallLengthX], position: [trackBounds.minX - barrierThickness, barrierHeight / 2, (trackBounds.minZ + trackBounds.maxZ) / 2] },
    { args: [barrierThickness, barrierHeight, wallLengthX], position: [trackBounds.maxX + barrierThickness, barrierHeight / 2, (trackBounds.minZ + trackBounds.maxZ) / 2] },
    { args: [wallLengthZ, barrierHeight, barrierThickness], position: [(trackBounds.minX + trackBounds.maxX) / 2, barrierHeight / 2, trackBounds.minZ - barrierThickness] },
    { args: [wallLengthZ, barrierHeight, barrierThickness], position: [(trackBounds.minX + trackBounds.maxX) / 2, barrierHeight / 2, trackBounds.maxZ + barrierThickness] },
  ];

  return (
    <>
      {walls.map((wall, i) => (
        <BoxCollider key={`wall-${i}`} args={wall.args} position={wall.position} />
      ))}
    </>
  );
};

const TrackRoad = ({ trackId }: { trackId: string }) => {
  const track = TRACK_CONFIGS.find((t) => t.id === trackId) || TRACK_CONFIGS[0];

  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.5, 0],
    type: "Static",
  }));

  const roadTexture = useTexture("/textures/road-asphalt.jpg") as THREE.Texture;
  const normalTexture = useTexture("/textures/road-normal.jpg") as THREE.Texture;

  useEffect(() => {
    if (roadTexture) {
      roadTexture.wrapS = THREE.RepeatWrapping;
      roadTexture.wrapT = THREE.RepeatWrapping;
      roadTexture.repeat.set(4, 4);
    }
    if (normalTexture) {
      normalTexture.wrapS = THREE.RepeatWrapping;
      normalTexture.wrapT = THREE.RepeatWrapping;
      normalTexture.repeat.set(4, 4);
    }
  }, [roadTexture, normalTexture]);

  const trackColor = track.timeOfDay === "night" ? "#333333" : "#555555";

  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        map={roadTexture || undefined}
        normalMap={normalTexture || undefined}
        color={trackColor}
      />
    </mesh>
  );
};

const ProceduralTrack = ({ trackId }: { trackId: string }) => {
  const track = TRACK_CONFIGS.find((t) => t.id === trackId) || TRACK_CONFIGS[0];

  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 4;
      const radius = 30 + Math.sin(i * 0.5) * 10;
      const height = Math.sin(i * 0.3) * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const trackShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 4, 0, Math.PI * 2, true);
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    steps: 64,
    bevelEnabled: false,
    extrudePath: curve,
  }), [curve]);

  const roadTexture = useTexture("/textures/road-asphalt.jpg") as THREE.Texture;

  useEffect(() => {
    if (roadTexture) {
      roadTexture.wrapS = THREE.RepeatWrapping;
      roadTexture.wrapT = THREE.RepeatWrapping;
      roadTexture.repeat.set(1, 20);
    }
  }, [roadTexture]);

  const trackColor = track.timeOfDay === "night" ? "#444444" : "#555555";

  const geometry = useMemo(() => new THREE.ExtrudeGeometry(trackShape, extrudeSettings), [trackShape, extrudeSettings]);

  const [ref] = useTrimesh(() => ({
    args: [geometry.attributes.position.array as Float32Array, geometry.index?.array as Float32Array | undefined],
    type: "Static",
    material: "ground",
  }) as any, [] as any);

  return (
    <mesh ref={ref as any} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        map={roadTexture || undefined}
        color={trackColor}
        metalness={0.7}
        roughness={0.3}
      />
    </mesh>
  );
};

export const StartLine = ({
  positions,
}: {
  positions: [number, number, number][];
}) => {
  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4, 10]} />
            <meshStandardMaterial
              transparent
              opacity={0.8}
              emissive="#ffffff"
              emissiveIntensity={0.5}
            />
          </mesh>
          <pointLight position={[0, 2, 0]} intensity={1} color="#ffffff" distance={10} />
        </group>
      ))}
    </>
  );
};

export const Track = ({
  trackId = "neon-tokyo",
  onLoadComplete,
  playerRef,
  onCheckpoint,
}: TrackProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const track = TRACK_CONFIGS.find((t) => t.id === trackId) || TRACK_CONFIGS[0];

  const startPositions: [number, number, number][] = [
    [0, 1, 30],
    [6, 1, 30],
    [-6, 1, 30],
    [0, 1, 24],
    [6, 1, 24],
    [-6, 1, 24],
    [0, 1, 18],
    [6, 1, 18],
  ];

  const trackBounds = {
    minX: -80,
    maxX: 80,
    minZ: -80,
    maxZ: 80,
  };

  const checkpoints: [number, number, number][] = Array.from({ length: 10 }, (_, i) => {
    const angle = Math.PI / 2 + (i / 10) * Math.PI * 2;
    const radius = 34;
    return [Math.cos(angle) * radius, 1, Math.sin(angle) * radius];
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
      onLoadComplete?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  return (
    <group>
      <TrackRoad trackId={trackId} />
      <ProceduralTrack trackId={trackId} />
      <StartLine positions={startPositions} />
      <TrackBarriers trackBounds={trackBounds} />
      {checkpoints.map((position, index) => (
        <Checkpoint
          key={`checkpoint-${index}`}
          position={position}
          index={index}
          playerRef={playerRef}
          onComplete={onCheckpoint}
        />
      ))}
    </group>
  );
};

export default Track;


