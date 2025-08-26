"use client";

import { SafeLink as Link } from "@/components/SafeLink";
import { useState, useEffect } from "react";

export function MinimalConferenceBanner() {
  const [isMounted, setIsMounted] = useState(false);
  const [daysToEvent, setDaysToEvent] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const eventDate = new Date("2025-11-28");
    const today = new Date();
    const timeDiff = eventDate.getTime() - today.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    setDaysToEvent(days > 0 ? days : 0);
  }, []);

  return (
    <div className="bg-blue-900 py-2.5 text-white">
      <div className="container mx-auto px-4">
        {/* Desktop Layout */}
        <div className="hidden items-center justify-center gap-6 md:flex">
          {/* Event Title */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="font-semibold">PG Conference 2025</span>
          </div>
          
          {/* Divider */}
          <div className="h-4 w-px bg-blue-300"></div>
          
          {/* Date */}
          <span className="text-blue-100">Nov 28-30, Abuja</span>
          
          {/* Divider */}
          <div className="h-4 w-px bg-blue-300"></div>
          
          {/* Countdown */}
          <span className="text-blue-100">
            {isMounted ? `${daysToEvent} days left` : "..."}
          </span>
          
          {/* CTA */}
          <Link
            href="/events"
            className="ml-2 rounded bg-white px-4 py-1 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-50"
          >
            Register
          </Link>
        </div>

        {/* Mobile Layout */}
        <div className="flex flex-col items-center gap-2 md:hidden">
          {/* Top row - Event title and date */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-base">🎯</span>
              <span className="font-semibold text-sm">PG Conference 2025</span>
            </div>
            <span className="text-xs text-blue-200">Nov 28-30, Abuja</span>
          </div>
          
          {/* Bottom row - Countdown and CTA */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-200">
              {isMounted ? `${daysToEvent} days left` : "..."}
            </span>
            <Link
              href="/events"
              className="rounded bg-white px-3 py-1 text-xs font-semibold text-blue-900 transition-colors hover:bg-blue-50"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
