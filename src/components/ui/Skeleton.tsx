"use client";

import { memo } from "react";

export interface SkeletonProps {
  className?: string;
}

export const Skeleton = memo(({ className = "" }: SkeletonProps) => (
  <div className={`rounded-xl bg-input animate-pulse ${className}`} />
));

Skeleton.displayName = "Skeleton";
export default Skeleton;
