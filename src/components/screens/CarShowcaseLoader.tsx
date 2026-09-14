"use client";

import dynamic from "next/dynamic";

const DynamicCarShowcase = dynamic(() => import("./CarShowcase"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center text-secondary">
      Loading showcase...
    </div>
  ),
});

interface CarShowcaseLoaderProps {
  loaded?: boolean;
}

const CarShowcaseLoader = ({ loaded = true }: CarShowcaseLoaderProps) => (
  <DynamicCarShowcase loaded={loaded} />
);

export default CarShowcaseLoader;
