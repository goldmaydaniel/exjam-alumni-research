"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Regular NoSSR component with proper hydration handling
export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Dynamic import version that completely skips SSR
const NoSSRWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const DynamicNoSSR = dynamic(() => Promise.resolve(NoSSRWrapper), {
  ssr: false,
});
