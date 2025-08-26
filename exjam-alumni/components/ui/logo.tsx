"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
  fallbackEmoji?: string;
  showLoadingSpinner?: boolean;
  priority?: boolean;
}

export function Logo({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = "/exjam-logo.svg",
  fallbackEmoji = "🎓",
  showLoadingSpinner = true,
  priority = false,
}: LogoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);

    if (imageSrc === src && fallbackSrc !== src) {
      // Try fallback image first
      setImageSrc(fallbackSrc);
      setHasError(false);
    } else {
      // Both main and fallback failed, show emoji
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-bold text-white shadow-sm",
          className
        )}
        style={{ width, height }}
        title={alt}
      >
        {fallbackEmoji}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      {/* Loading Spinner */}
      {isLoading && showLoadingSpinner && (
        <div
          className="absolute inset-0 flex animate-pulse items-center justify-center rounded-lg bg-gray-100"
          style={{ width, height }}
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Logo Image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-contain transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        quality={95}
      />
    </div>
  );
}
