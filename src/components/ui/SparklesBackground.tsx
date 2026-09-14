"use client";

import { memo, useMemo } from "react";
import { motion } from "motion/react";
import { tsParticles } from "@tsparticles/engine";

export interface SparklesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  density?: number;
  color?: string;
  particleCount?: number;
}

export const SparklesBackground = memo(({
  children,
  className = "",
  density = 1,
  color = "#00f0ff",
  particleCount = 100,
}: SparklesBackgroundProps) => {
  const sparkleIds = useMemo(() => {
    return Array.from({ length: particleCount * density }, (_, i) => i);
  }, [particleCount, density]);

  const sparkles = sparkleIds.map((id) => {
    const size = Math.random() * 4 + 1;
    const style: React.CSSProperties = {
      position: "absolute",
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: "50%",
      opacity: Math.random() * 0.5 + 0.3,
      filter: `blur(${Math.random() * 2}px)`,
      animation: `twinkle-${id} ${Math.random() * 3 + 2}s infinite ease-in-out`,
      animationDelay: `-${Math.random() * 3}s`,
    };

    return (
      <div key={id} className="sparkle" style={style} />
    );
  });

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}05 0%, transparent 70%)`,
        }}
      />
      <style jsx>{`
        .sparkle {
          box-shadow: 0 0 ${Math.random() * 10 + 5}px currentColor;
        }
        @keyframes twinkle-${0} {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
      `}</style>
      {sparkles}
      {children}
    </div>
  );
});

SparklesBackground.displayName = "SparklesBackground";
export default SparklesBackground;


