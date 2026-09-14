"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  AnimatedGradientText,
  MagneticButton,
  NeonText,
  SparklesBackground,
  TypewriterEffect,
  GlassmorphicPanel,
} from "@/components/ui";
import { COLORS } from "@/lib/constants";

const DynamicCarShowcase = dynamic(() => import("./CarShowcase"), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] flex items-center justify-center text-secondary">Loading showcase...</div>,
});

const features = [
  { title: "EXOTIC SUPERCARS", description: "6 handcrafted exotic cars with authentic performance specs" },
  { title: "BREATH-TAKING TRACKS", description: "3 stunning environments from neon cities to coastal circuits" },
  { title: "REAL-TIME MULTIPLAYER", description: "Race up to 8 players in real-time with synced physics" },
  { title: "CINEMATIC VISUALS", description: "Bloom, motion blur, and post-processing for a premium feel" },
  { title: "SPATIAL AUDIO", description: "Layered engine sounds and dynamic SFX that respond to your inputs" },
  { title: "DRIFT MECHANICS", description: "Master drifting with realistic tire physics and scoring" },
];

const HeroSection = () => {
  const router = useRouter();
  const [showFeatures, setShowFeatures] = useState(false);
  const [loaded3D, setLoaded3D] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowFeatures(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <SparklesBackground
        className="absolute inset-0"
        density={1.5}
        particleCount={120}
        color={COLORS.primary}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center">
        <header className="w-full py-8 px-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <NeonText color={COLORS.primary} glowIntensity="high" className="text-3xl sm:text-4xl">
              VELOCITY NEXUS
            </NeonText>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex gap-4"
          >
            <MagneticButton
              onClick={() => handleNavigate("/garage")}
              variant="primary"
              size="md"
            >
              GARAGE
            </MagneticButton>
            <MagneticButton
              onClick={() => handleNavigate("/tracks")}
              variant="secondary"
              size="md"
            >
              TRACKS
            </MagneticButton>
          </motion.div>
        </header>

        <main className="relative z-10 flex flex-col items-center flex-1 w-full">
          <motion.div
            className="relative w-full max-w-4xl mx-auto text-center py-16 sm:py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <AnimatePresence>
              <motion.h1
                key="title"
                className="mb-4 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <AnimatedGradientText
                  gradientColors={[COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.primary]}
                  animate={true}
                >
                  RACING
                </AnimatedGradientText>
              </motion.h1>

              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <TypewriterEffect
                  words={["FULL-STACK 3D MULTIPLAYER EXPERIENCE", "BROWSER-BASED SUPERCAR RACING", "CINEMATIC VISUALS IN YOUR BROWSER"]}
                  className="text-xl sm:text-2xl text-secondary"
                  typingSpeed={80}
                  deleteSpeed={40}
                  delayBetweenWords={3000}
                  loop={true}
                />
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <MagneticButton
                onClick={() => handleNavigate("/race?mode=single")}
                variant="primary"
                size="lg"
                className="font-display text-xl tracking-widest"
              >
                <span className="flex items-center gap-2">
                  SINGLE RACE
                </span>
              </MagneticButton>

              <MagneticButton
                onClick={() => handleNavigate("/lobby")}
                variant="secondary"
                size="lg"
                className="font-display text-xl tracking-widest"
              >
                <span className="flex items-center gap-2">
                  MULTIPLAYER
                </span>
              </MagneticButton>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative w-full max-w-6xl mx-auto py-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            <DynamicCarShowcase loaded={loaded3D} />
          </motion.div>
        </main>

        <motion.div
          className="relative z-10 w-full py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: showFeatures ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <motion.h2
              className="text-center text-3xl font-display font-bold mb-12"
              style={{ color: COLORS.textPrimary }}
              initial={{ opacity: 0, y: 20 }}
              animate={showFeatures ? { opacity: 1, y: 0 } : {}}
            >
              <NeonText color={COLORS.primary} glowIntensity="medium">
                FEATURES
              </NeonText>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={showFeatures ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                >
                  <GlassmorphicPanel hover className="h-full">
                    <h3 className="text-xl font-display font-bold mb-2" style={{ color: COLORS.primary }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm text-secondary">{feature.description}</p>
                  </GlassmorphicPanel>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;


