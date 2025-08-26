"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: string;
  badge?: string;
}

interface FeatureGridProps {
  title?: string;
  subtitle?: string;
  description?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: "default" | "cards" | "minimal";
  className?: string;
}

export function FeatureGrid({
  title,
  subtitle,
  description,
  features,
  columns = 4,
  variant = "default",
  className,
}: FeatureGridProps) {
  const { ref: headerRef, isInView: headerInView } = useScrollAnimation();

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className={cn("py-20", className)}>
      <div className="container">
        {/* Header */}
        {(title || subtitle || description) && (
          <div
            ref={headerRef}
            className={cn(
              "mb-16 text-center transition-all duration-700 ease-out",
              headerInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}
          >
            {subtitle && (
              <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
                {subtitle}
              </span>
            )}
            {title && (
              <h2 className="mt-4 text-4xl font-black text-gray-900 dark:text-white md:text-5xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className={cn("mx-auto grid max-w-6xl gap-6", gridCols[columns])}>
          {features.map((feature, index) => {
            const { ref, isInView } = useScrollAnimation({
              threshold: 0.1,
              rootMargin: "50px",
            });

            if (variant === "minimal") {
              return (
                <div
                  key={index}
                  ref={ref}
                  className={cn(
                    "text-center transition-all duration-700 ease-out",
                    isInView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                  )}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div
                    className={cn(
                      "mx-auto mb-4 flex h-16 w-16 transform items-center justify-center rounded-2xl transition-transform duration-300 hover:scale-110",
                      feature.color || "bg-gradient-to-br from-blue-500 to-indigo-600"
                    )}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              );
            }

            if (variant === "cards") {
              return (
                <Card
                  key={index}
                  ref={ref}
                  className={cn(
                    "group transform border-t-4 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl",
                    isInView
                      ? "translate-y-0 scale-100 opacity-100"
                      : "translate-y-12 scale-95 opacity-0",
                    feature.color ? `border-t-[${feature.color}]` : "border-t-blue-500"
                  )}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <CardHeader>
                    <div
                      className={cn(
                        "mb-4 flex h-16 w-16 transform items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                        feature.color || "bg-gradient-to-br from-blue-500 to-indigo-600"
                      )}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                      {feature.title}
                      {feature.badge && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                          {feature.badge}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            }

            // Default variant
            return (
              <div
                key={index}
                ref={ref}
                className={cn(
                  "group transition-all duration-700 ease-out",
                  isInView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                )}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="relative transform rounded-2xl bg-gray-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-800">
                  {/* Hover gradient background */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-900/20 dark:to-purple-900/20" />

                  <div className="relative z-10">
                    <div
                      className={cn(
                        "mb-4 flex h-14 w-14 transform items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                        feature.color || "bg-gradient-to-br from-blue-500 to-indigo-600"
                      )}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold transition-colors group-hover:text-blue-600">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 transition-colors group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
