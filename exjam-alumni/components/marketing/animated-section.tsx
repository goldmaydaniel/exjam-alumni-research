"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: "fadeIn" | "slideUp" | "slideLeft" | "slideRight" | "scaleIn" | "rotateIn";
  delay?: number;
  duration?: number;
}

const animations = {
  fadeIn: {
    initial: "opacity-0",
    animate: "opacity-100",
  },
  slideUp: {
    initial: "opacity-0 translate-y-16",
    animate: "opacity-100 translate-y-0",
  },
  slideLeft: {
    initial: "opacity-0 translate-x-16",
    animate: "opacity-100 translate-x-0",
  },
  slideRight: {
    initial: "opacity-0 -translate-x-16",
    animate: "opacity-100 translate-x-0",
  },
  scaleIn: {
    initial: "opacity-0 scale-95",
    animate: "opacity-100 scale-100",
  },
  rotateIn: {
    initial: "opacity-0 rotate-6 scale-95",
    animate: "opacity-100 rotate-0 scale-100",
  },
};

export function AnimatedSection({
  children,
  className,
  animation = "slideUp",
  delay = 0,
  duration = 700,
}: AnimatedSectionProps) {
  const { ref, isInView } = useScrollAnimation({ threshold: 0.1, triggerOnce: true });

  const animationConfig = animations[animation];

  return (
    <section
      ref={ref}
      className={cn(
        "transition-all ease-out",
        isInView ? animationConfig.animate : animationConfig.initial,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </section>
  );
}
