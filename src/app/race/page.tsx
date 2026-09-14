"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import LoadingScreen from "@/components/screens/LoadingScreen";
import { QualityPreset } from "@/types";

const DynamicGameCanvas = dynamic(
  () => import("@/components/game/GameCanvas").then((mod) => mod.GameCanvas),
  {
    ssr: false,
    loading: () => <LoadingScreen progress={50} />,
  }
);

function RaceContent() {
  const searchParams = useSearchParams();
  const mode = (searchParams?.get("mode") || "single") as "single" | "multiplayer";
  const quality = (searchParams?.get("quality") || "High") as QualityPreset;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <LoadingScreen progress={30} />;
  }

  return <DynamicGameCanvas mode={mode} quality={quality} />;
}

const RacePage = () => {
  return (
    <Suspense fallback={<LoadingScreen progress={50} />}>
      <RaceContent />
    </Suspense>
  );
};

export default RacePage;
