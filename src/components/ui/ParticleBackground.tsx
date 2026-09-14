"use client";

import { memo, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface ParticleBackgroundProps {
  className?: string;
  particleCount?: number;
  color?: string;
  speed?: number;
  interactive?: boolean;
  shape?: "circle" | "star" | "triangle";
}

export const ParticleBackground = memo(({
  className = "",
  particleCount = 50,
  color = COLORS.primary,
  speed = 1,
  interactive = false,
  shape = "circle",
}: ParticleBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -100, y: -100 });

  type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    life: number;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.2 * speed,
      vy: (Math.random() - 0.5) * 0.2 * speed,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      life: Math.random() * 3 + 1,
    }));

    const connectParticles = () => {
      for (let a = 0; a < particlesRef.current.length; a++) {
        for (let b = a + 1; b < particlesRef.current.length; b++) {
          const dx = particlesRef.current[a].x - particlesRef.current[b].x;
          const dy = particlesRef.current[a].y - particlesRef.current[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 100;

          if (distance < maxDist) {
            const opacity = (1 - distance / maxDist) * 0.3;
            ctx.strokeStyle = color;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particlesRef.current[a].x, particlesRef.current[a].y);
            ctx.lineTo(particlesRef.current[b].x, particlesRef.current[b].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawParticle = (p: Particle) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();

      if (shape === "circle") {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      } else if (shape === "star") {
        const spikes = 5;
        const outer = p.size;
        const inner = p.size / 2;
        let angle = (Math.PI / spikes) * -1.5;
        const cx = p.x;
        const cy = p.y;
        ctx.moveTo(cx, cy - outer);
        for (let i = 0; i < spikes; i++) {
          ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
          angle += (Math.PI / spikes) * 2;
          ctx.lineTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
          angle += (Math.PI / spikes) * 2;
        }
        ctx.closePath();
      } else if (shape === "triangle") {
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size, p.y + p.size);
        ctx.lineTo(p.x - p.size, p.y + p.size);
        ctx.closePath();
      }

      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (interactive) {
          const mouseX = mouseRef.current.x;
          const mouseY = mouseRef.current.y;
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const force = (80 - dist) / 80;
            p.vx += (dx / dist) * force * 0.02;
            p.vy += (dy / dist) * force * 0.02;
          }
        }

        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx = -p.vx;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy = -p.vy;

        drawParticle(p);
      });

      connectParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    if (interactive) {
      canvas.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
      if (interactive) {
        canvas.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [particleCount, color, speed, interactive, shape]);

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${className}`} />;
});

ParticleBackground.displayName = "ParticleBackground";
export default ParticleBackground;


