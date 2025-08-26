"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Award,
  Sparkles,
  Star,
  Trophy,
  Plane,
  Hotel,
  Utensils,
  Music,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PGConferenceHeader() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const conferenceDate = new Date("2025-11-28T08:00:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = conferenceDate - now;

      if (distance > 0) {
        setTimeRemaining({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const highlights = [
    {
      icon: Award,
      title: "Leadership Excellence",
      description: "Keynote speeches from distinguished alumni leaders",
    },
    {
      icon: Users,
      title: "Networking Summit",
      description: "Connect with 500+ alumni across different sectors",
    },
    {
      icon: Trophy,
      title: "Recognition Ceremony",
      description: "Honoring outstanding alumni achievements",
    },
    {
      icon: Utensils,
      title: "Cultural Evening",
      description: "Traditional Nigerian cuisine and entertainment",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 opacity-10">
          <div className="animate-blob absolute left-10 top-10 h-32 w-32 rounded-full bg-blue-300 mix-blend-multiply blur-xl filter"></div>
          <div className="animate-blob animation-delay-2000 absolute right-10 top-10 h-32 w-32 rounded-full bg-purple-300 mix-blend-multiply blur-xl filter"></div>
          <div className="animate-blob animation-delay-4000 absolute bottom-10 left-20 h-32 w-32 rounded-full bg-indigo-300 mix-blend-multiply blur-xl filter"></div>
        </div>
      </div>

      <div className="container relative mx-auto px-4 py-8">
        {/* Main Conference Banner */}
        <div className="mb-8 text-center">


          <h1 className="mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-4xl font-black text-transparent md:text-6xl">
            President General's Conference 2025
          </h1>

          <p className="mb-4 text-xl font-semibold text-gray-700 md:text-2xl">
            The EXJAM Association AFMS Jos Alumni
          </p>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">November 28-30, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              <span className="font-semibold">NAF Conference Centre, Abuja FCT</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="font-semibold">500+ Alumni Expected</span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="mx-auto max-w-2xl rounded-2xl border bg-white/70 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-4 flex items-center justify-center gap-2 text-lg font-bold text-gray-800">
              <Clock className="h-5 w-5" />
              Conference Countdown
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { value: timeRemaining.days, label: "Days" },
                { value: timeRemaining.hours, label: "Hours" },
                { value: timeRemaining.minutes, label: "Minutes" },
                { value: timeRemaining.seconds, label: "Seconds" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="mb-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-3 text-white">
                    <div className="text-2xl font-bold md:text-3xl">
                      {item.value.toString().padStart(2, "0")}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conference Highlights - Expandable */}
        <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Star className="h-5 w-5 text-yellow-500" />
                Conference Highlights
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600"
              >
                {isExpanded ? (
                  <>
                    <span className="mr-2">Less</span>
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span className="mr-2">More</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "grid gap-4 transition-all duration-500 md:grid-cols-2",
                isExpanded ? "max-h-full opacity-100" : "opacity-100"
              )}
            >
              {highlights.slice(0, isExpanded ? highlights.length : 2).map((highlight, index) => {
                const Icon = highlight.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4"
                  >
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-gray-800">{highlight.title}</h4>
                      <p className="text-sm text-gray-600">{highlight.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isExpanded && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid gap-4 text-center md:grid-cols-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-blue-100 p-3">
                      <Plane className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Travel Support</div>
                      <div className="text-sm text-gray-600">Group discounts available</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-green-100 p-3">
                      <Hotel className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Accommodation</div>
                      <div className="text-sm text-gray-600">Partner hotels nearby</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-purple-100 p-3">
                      <Music className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Entertainment</div>
                      <div className="text-sm text-gray-600">Cultural performances</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Call-to-Action */}
        <div className="mt-8 text-center">
          <p className="mb-2 text-lg font-medium text-gray-700">
            Ready to be part of history? Register now for the inaugural PG Conference!
          </p>
          <p className="text-sm text-gray-600">
            Early bird pricing ends soon • Limited spaces available
          </p>
        </div>
      </div>

      <style jsx>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
