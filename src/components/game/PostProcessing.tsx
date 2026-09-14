"use client";

import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise, ToneMapping } from "@react-three/postprocessing";
import { useGameStore } from "@/stores/gameStore";
import { QualityPreset } from "@/types";

interface PostProcessingProps {
  enabled?: boolean;
  quality?: QualityPreset;
}

export const PostProcessing = ({
  enabled = true,
  quality = "High",
}: PostProcessingProps) => {
  const speedKmh = useGameStore((s) => s.speedKmh);

  const speedFactor = Math.min(speedKmh / 400, 1);

  if (!enabled) return null;

  return (
    <EffectComposer>
      <ToneMapping />

      <Bloom
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        intensity={0.6 + speedFactor * 0.4}
        mipmapBlur={quality !== "Low"}
        radius={quality === "Ultra" ? 1.0 : 0.8}
      />

      {quality !== "Low" && <Noise opacity={0.02} premultiply={true} />}

      {quality === "Ultra" && speedFactor > 0.1 && (
        <Noise opacity={0.03 * speedFactor} premultiply={true} />
      )}

      {quality === "Ultra" && (
          <ChromaticAberration
            offset={[speedFactor * 0.002, speedFactor * 0.002]}
            radialModulation={true}
          />
      )}

      <Vignette eskil={false} offset={0.15} darkness={0.3 + speedFactor * 0.2} />
    </EffectComposer>
  );
};

export default PostProcessing;


