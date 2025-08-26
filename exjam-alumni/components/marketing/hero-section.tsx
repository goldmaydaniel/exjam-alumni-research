"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useParallax } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: ReactNode;
  stats?: Array<{ value: string; label: string; color?: string }>;
  actions?: ReactNode;
  backgroundGradient?: string;
  className?: string;
}

export function HeroSection({
  title,
  subtitle,
  description,
  badge,
  stats,
  actions,
  backgroundGradient = "from-blue-900 via-blue-800 to-indigo-900",
  className,
}: HeroSectionProps) {
  const parallaxOffset = useParallax(0.3);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <section
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden",
        className
      )}
    >
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${backgroundGradient}`}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            transform: `translateY(${parallaxOffset}px)`,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating Elements with Parallax */}
      <div className="absolute inset-0">
        <div
          className="animate-float absolute left-10 top-1/4 h-64 w-64 rounded-full bg-yellow-500 opacity-20 mix-blend-multiply blur-3xl filter"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        />
        <div
          className="animate-float animation-delay-2000 absolute right-10 top-1/3 h-64 w-64 rounded-full bg-green-500 opacity-20 mix-blend-multiply blur-3xl filter"
          style={{ transform: `translateY(${parallaxOffset * 0.8}px)` }}
        />
        <div
          className="animate-float animation-delay-4000 absolute bottom-1/4 left-1/2 h-64 w-64 rounded-full bg-red-500 opacity-20 mix-blend-multiply blur-3xl filter"
          style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          {badge && <div className="animate-fade-in mb-8">{badge}</div>}

          {/* Title */}
          <h1 className="mb-6 text-4xl font-black tracking-tight text-white md:text-6xl lg:text-7xl">
            <span className="animate-fade-in-up block">{title}</span>
            {subtitle && (
              <span className="animate-fade-in-up animation-delay-200 block bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
                {subtitle}
              </span>
            )}
          </h1>

          {/* Description */}
          {description && (
            <p className="animate-fade-in-up animation-delay-400 mx-auto mb-10 max-w-3xl text-xl font-light text-blue-100 md:text-2xl">
              {description}
            </p>
          )}

          {/* Stats */}
          {stats && (
            <div
              className={cn(
                "animate-fade-in-up animation-delay-600 mx-auto mb-12 grid max-w-4xl gap-8",
                stats.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"
              )}
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div
                    className={cn(
                      "mb-2 text-3xl font-bold md:text-4xl",
                      stat.color || "text-yellow-400"
                    )}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {actions && <div className="animate-fade-in-up animation-delay-800 mb-12">{actions}</div>}

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce">
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollToContent}
              className="rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            >
              <ArrowDown className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in {
          opacity: 0;
          animation: fadeIn 1s ease-out forwards;
        }

        .animate-fade-in-up {
          opacity: 0;
          transform: translateY(30px);
          animation: fadeInUp 1s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
