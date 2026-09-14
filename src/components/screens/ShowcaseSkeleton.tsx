"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui";

export interface ShowcaseSkeletonProps {
  className?: string;
}

export const ShowcaseSkeleton = memo(({ className = "" }: ShowcaseSkeletonProps) => (
  <div className={`relative w-full h-[500px] rounded-2xl overflow-hidden ${className}`}>
    <div className="absolute inset-0 glass border border-border" />

    <div className="absolute inset-0 flex items-center justify-center">
      <Skeleton className="h-28 w-64 rounded-xl" />
    </div>

    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pb-4">
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>

    <Skeleton className="absolute top-4 right-4 h-14 w-24 rounded-xl" />
  </div>
));

ShowcaseSkeleton.displayName = "ShowcaseSkeleton";
export default ShowcaseSkeleton;
