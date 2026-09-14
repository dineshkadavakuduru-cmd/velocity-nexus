"use client";

import dynamic from "next/dynamic";
import ShowcaseSkeleton from "./ShowcaseSkeleton";

const DynamicCarShowcase = dynamic(() => import("./CarShowcase"), {
  ssr: false,
  loading: () => <ShowcaseSkeleton />,
});

interface CarShowcaseLoaderProps {
  loaded?: boolean;
}

const CarShowcaseLoader = ({ loaded = true }: CarShowcaseLoaderProps) => (
  <DynamicCarShowcase loaded={loaded} />
);

export default CarShowcaseLoader;
