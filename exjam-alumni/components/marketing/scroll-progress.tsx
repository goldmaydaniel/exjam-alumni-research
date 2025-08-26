"use client";

import { useScrollProgress } from "@/hooks/use-scroll-animation";

export function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-gray-200 dark:bg-gray-800">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
