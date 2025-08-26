"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineItem {
  year: string;
  title: string;
  description: string;
  category?: string;
}

interface InteractiveTimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function InteractiveTimeline({ items, className }: InteractiveTimelineProps) {
  const [activeItem, setActiveItem] = useState<number | null>(null);

  return (
    <div className={cn("mx-auto max-w-4xl", className)}>
      <div className="relative">
        {/* Animated Timeline Line */}
        <div className="absolute bottom-0 left-8 top-0 w-1 rounded-full bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 opacity-20"></div>
        <div className="timeline-progress absolute left-8 top-0 w-1 rounded-full bg-gradient-to-b from-blue-500 via-purple-500 to-green-500"></div>

        {/* Timeline Items */}
        {items.map((item, index) => {
          const { ref, isInView } = useScrollAnimation({ threshold: 0.3 });

          return (
            <div
              key={index}
              ref={ref}
              className={cn(
                "group relative mb-16 flex items-center transition-all duration-700 ease-out",
                isInView ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
              onMouseEnter={() => setActiveItem(index)}
              onMouseLeave={() => setActiveItem(null)}
            >
              {/* Year Circle */}
              <div className="absolute left-0 z-10 flex h-16 w-16 transform items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl transition-all duration-300 group-hover:scale-110 dark:border-gray-900">
                <span className="text-xs font-bold text-white">{item.year}</span>
              </div>

              {/* Content Card */}
              <div className="ml-24 w-full">
                <Card
                  className={cn(
                    "transform border-l-4 border-l-transparent transition-all duration-500 hover:-translate-y-2 hover:border-l-blue-500 hover:shadow-2xl",
                    activeItem === index && "scale-105 border-l-blue-500 shadow-2xl"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-start justify-between">
                      <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white">
                        {item.title}
                      </h3>
                      {item.category && (
                        <Badge variant="secondary" className="ml-2">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>

                    {/* Progress indicator */}
                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out",
                          isInView ? "w-full" : "w-0"
                        )}
                        style={{ transitionDelay: `${index * 150 + 300}ms` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
