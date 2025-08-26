"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeCarouselProps {
  children: React.ReactNode[];
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  itemsPerView?: number;
  gap?: number;
}

export function SwipeCarousel({
  children,
  className,
  showArrows = true,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  itemsPerView = 1,
  gap = 16,
}: SwipeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const totalItems = children.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && totalItems > itemsPerView) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, maxIndex, itemsPerView, totalItems]);

  // Touch handlers for swipe functionality
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);

    // Pause autoplay on touch
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < maxIndex) {
      next();
    }
    if (isRightSwipe && currentIndex > 0) {
      previous();
    }

    // Resume autoplay after touch
    if (autoPlay && totalItems > itemsPerView) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, autoPlayInterval);
    }
  };

  const next = () => {
    if (isTransitioning || currentIndex >= maxIndex) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const previous = () => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex || index > maxIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Calculate transform value
  const translateX = -currentIndex * (100 / itemsPerView);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Main carousel container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${translateX}%)`,
            gap: `${gap}px`,
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: `calc(${100 / itemsPerView}% - ${(gap * (itemsPerView - 1)) / itemsPerView}px)`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {showArrows && totalItems > itemsPerView && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-white/80 shadow-lg backdrop-blur-sm hover:bg-white/90"
            onClick={previous}
            disabled={currentIndex <= 0 || isTransitioning}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-white/80 shadow-lg backdrop-blur-sm hover:bg-white/90"
            onClick={next}
            disabled={currentIndex >= maxIndex || isTransitioning}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && totalItems > itemsPerView && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                index === currentIndex ? "bg-white shadow-lg" : "bg-white/50 hover:bg-white/70"
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress indicator */}
      {totalItems > itemsPerView && (
        <div className="mt-4 flex justify-center">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {maxIndex + 1}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for responsive items per view
export function useResponsiveItemsPerView() {
  const [itemsPerView, setItemsPerView] = useState(1);

  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        setItemsPerView(3); // xl
      } else if (width >= 768) {
        setItemsPerView(2); // md
      } else {
        setItemsPerView(1); // mobile
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  return itemsPerView;
}
