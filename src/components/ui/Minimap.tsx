"use client";

import { memo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface MinimapProps {
  players: Array<{
    id: string;
    name: string;
    position: { x: number; y: number; z: number };
    color?: string;
    isLocal?: boolean;
    finished?: boolean;
  }>;
  trackBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  size?: number;
  className?: string;
}

export const Minimap = memo(({
  players = [],
  trackBounds,
  size = 160,
  className = "",
}: MinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: size, height: size });

  useEffect(() => {
    setDimensions({ width: size, height: size });
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const centerX = dimensions.width / 2;
    const centerZ = dimensions.height / 2;
    const scale = Math.min(
      (dimensions.width - 40) / Math.max(1, trackBounds.maxX - trackBounds.minX),
      (dimensions.height - 40) / Math.max(1, trackBounds.maxZ - trackBounds.minZ)
   );

    const trackWidth = (trackBounds.maxX - trackBounds.minX) * scale;
    const trackHeight = (trackBounds.maxZ - trackBounds.minZ) * scale;

    ctx.fillStyle = "rgba(30, 30, 30, 0.8)";
    ctx.fillRect(20, 20, trackWidth, trackHeight);

    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, trackWidth, trackHeight);

    const halfW = 20 + trackWidth / 2;
    const halfZ = 20 + trackHeight / 2;

    players.forEach((player) => {
      const relX = ((player.position.x - (trackBounds.minX + trackBounds.maxX) / 2) / (trackBounds.maxX - trackBounds.minX)) * trackWidth + halfW;
      const relZ = ((player.position.z - (trackBounds.minZ + trackBounds.maxZ) / 2) / (trackBounds.maxZ - trackBounds.minZ)) * trackHeight + halfZ;

      const px = Math.max(20, Math.min(dimensions.width - 20, relX + 20));
      const pz = Math.max(20, Math.min(dimensions.height - 20, relZ + 20));

      const isLocal = player.isLocal;
      const radius = isLocal ? 6 : 4;

      if (player.finished) {
        ctx.fillStyle = "#cccccc";
      } else {
        ctx.fillStyle = player.color || (isLocal ? COLORS.primary : COLORS.secondary);
      }

      ctx.beginPath();
      ctx.arc(px, pz, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isLocal) {
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (player.isLocal) {
        ctx.fillStyle = COLORS.textPrimary;
        ctx.font = "10px Rajdhani, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(player.name.substring(0, 8), px, pz + 20);
      }
    });
  }, [players, dimensions, trackBounds]);

  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(10px)",
        border: `2px solid ${COLORS.border}`,
        boxShadow: `${COLORS.primary}20 0 0 4px, ${COLORS.secondary}10 0 0 8px`,
      }}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />

      <div className="absolute top-1 left-1 bg-black/50 rounded text-xs px-1 text-secondary font-display">
        MAP
      </div>

      <div className="absolute bottom-1 right-1 flex flex-col gap-1">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1 text-xs"
            style={{
              color: p.isLocal ? COLORS.primary : COLORS.textSecondary,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: p.color || (p.isLocal ? COLORS.primary : COLORS.secondary),
              }}
            />
            <span>{p.isLocal ? "YOU" : p.name.substring(0, 6)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

Minimap.displayName = "Minimap";
export default Minimap;


