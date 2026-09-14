"use client";

import { memo, useEffect, useRef } from "react";
import { COLORS } from "@/lib/constants";

export interface SparklesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  density?: number;
  color?: string;
  particleCount?: number;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  delta: number;
};

export const SparklesBackground = memo(({
  children,
  className = "",
  density = 1,
  color = COLORS.primary,
  particleCount = 100,
}: SparklesBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const count = Math.round(particleCount * density);
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: Math.random() * 3 + 1,
      phase: Math.random() * Math.PI * 2,
      delta: Math.random() * 0.02 + 0.005,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx = -p.vx;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy = -p.vy;

        p.phase += p.delta;
        const alpha = Math.abs(Math.sin(p.phase)) * 0.6 + 0.2;

        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [particleCount, density, color]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden="true"
      />
      {children}
    </div>
  );
});

SparklesBackground.displayName = "SparklesBackground";
export default SparklesBackground;
