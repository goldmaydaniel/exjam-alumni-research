"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface Event {
  id: string;
  title: string;
  shortDescription: string;
  description?: string;
  startDate: string;
  endDate: string;
  venue: string;
  address?: string;
  imageUrl?: string;
  price: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
  status: string;
  tags: string[];
}

interface EventCardProps {
  event: Event;
  variant?: "default" | "compact" | "featured";
  showImage?: boolean;
  showPrice?: boolean;
  showDescription?: boolean;
}

export function EventCard({
  event,
  variant = "default",
  showImage = true,
  showPrice = true,
  showDescription = true,
}: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isEarlyBird = () => {
    if (!event.earlyBirdDeadline) return false;
    return new Date(event.earlyBirdDeadline) > new Date();
  };

  const isPastEvent = () => {
    return new Date(event.endDate) < new Date();
  };

  const isUpcoming = () => {
    return new Date(event.startDate) > new Date();
  };

  const currentPrice = isEarlyBird() && event.earlyBirdPrice ? event.earlyBirdPrice : event.price;

  // Enhanced card styling with better color psychology
  const cardClasses = {
    default:
      "group cursor-pointer overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-indigo-200/50 hover:bg-white/95 event-card-hover",
    compact:
      "group cursor-pointer overflow-hidden rounded-xl bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 border border-white/20 hover:border-indigo-200/50 event-card-hover",
    featured:
      "group cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 via-indigo-50/50 to-purple-50/50 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300 border border-indigo-100/50 hover:border-indigo-200/80 event-card-hover",
  };


  return (
    <Link href={isPastEvent() ? `/events/${event.id}` : `/events/${event.id}/register`}>
      <Card className={cardClasses[variant]}>
        {/* Event Image with Enhanced Overlay */}
        {showImage && event.imageUrl && (
          <div
            className={`relative overflow-hidden ${
              variant === "compact" ? "h-32" : variant === "featured" ? "h-64" : "h-48"
            }`}
          >
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110 image-hover-zoom"
              sizes={
                variant === "compact"
                  ? "(max-width: 768px) 50vw, 25vw"
                  : variant === "featured"
                    ? "100vw"
                    : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              }
              priority={variant === "featured"}
            />
            
            {/* Enhanced gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Status indicators with clean typography */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {isPastEvent() ? (
                <div className="rounded-full bg-slate-800/90 px-3 py-1 backdrop-blur-sm">
                  <span className="text-xs font-bold text-white">PAST EVENT</span>
                </div>
              ) : (
                <div className="rounded-full bg-emerald-500/90 px-3 py-1 backdrop-blur-sm">
                  <span className="text-xs font-bold text-white">
                    {isUpcoming() ? "UPCOMING" : "LIVE NOW"}
                  </span>
                </div>
              )}
            </div>

            {/* Early bird indicator */}
            {isEarlyBird() && !isPastEvent() && (
              <div className="absolute right-4 top-4">
                <div className="animate-pulse rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 shadow-lg backdrop-blur-sm">
                  <span className="text-xs font-bold text-white">EARLY BIRD</span>
                </div>
              </div>
            )}

            {/* Featured indicator */}
            {variant === "featured" && (
              <div className="absolute right-4 bottom-4">
                <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 shadow-lg backdrop-blur-sm">
                  <span className="text-xs font-bold text-white">FEATURED</span>
                </div>
              </div>
            )}
          </div>
        )}

        <CardContent className={`${variant === "compact" ? "p-4" : "p-6"}`}>
          {/* Event title with improved typography */}
          <h3
            className={`mb-3 font-bold text-gray-900 transition-colors group-hover:text-indigo-600 ${
              variant === "featured" ? "text-2xl leading-tight" : variant === "compact" ? "text-lg" : "text-xl leading-tight"
            } line-clamp-2`}
          >
            {event.title}
          </h3>

          {/* Description with better readability */}
          {showDescription && event.shortDescription && (
            <p
              className={`mb-4 text-gray-600 leading-relaxed ${
                variant === "compact" ? "line-clamp-2 text-sm" : "line-clamp-3"
              }`}
            >
              {event.shortDescription}
            </p>
          )}

          {/* Event details with clean typography hierarchy */}
          <div className={`mb-4 space-y-3 ${variant === "compact" ? "text-sm" : ""}`}>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Event Date & Time
              </p>
              <div className="flex items-center gap-4 text-gray-700">
                <span className="font-semibold">{formatDate(event.startDate)}</span>
                <span className="text-gray-500">•</span>
                <span>{formatTime(event.startDate)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                Venue
              </p>
              <p className="font-medium text-gray-700 line-clamp-1">{event.venue}</p>
            </div>
          </div>

          {/* Clean tags without icons */}
          {event.tags?.length > 0 && variant !== "compact" && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {event.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    {tag}
                  </span>
                ))}
                {event.tags.length > 3 && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    +{event.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Enhanced price and CTA section */}
          <div className="flex items-center justify-between">
            {showPrice && (
              <div className="flex items-center gap-2">
                {isEarlyBird() && event.earlyBirdPrice ? (
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-emerald-600 ${
                      variant === "featured" ? "text-2xl" : variant === "compact" ? "text-lg" : "text-xl"
                    }`}>
                      ₦{currentPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ₦{event.price.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span
                    className={`font-bold text-indigo-600 ${
                      variant === "featured"
                        ? "text-2xl"
                        : variant === "compact"
                          ? "text-lg"
                          : "text-xl"
                    }`}
                  >
                    {event.price === 0 ? "Free" : `₦${event.price.toLocaleString()}`}
                  </span>
                )}
              </div>
            )}

            {/* Enhanced CTA button */}
            <Button
              size={variant === "compact" ? "sm" : "default"}
              className={`transition-all duration-300 group-hover:scale-105 ${
                isPastEvent() 
                  ? "bg-slate-600 hover:bg-slate-700" 
                  : "btn-gradient-hover bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              }`}
            >
              <span className="flex items-center">
                {isPastEvent() ? "View Details" : "Register"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
