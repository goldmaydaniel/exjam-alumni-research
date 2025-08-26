"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Clock, ArrowRight, Sparkles, Users, Tag, Star, TrendingUp } from "lucide-react";

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

  // Color scheme based on event status
  const getStatusColors = () => {
    if (isPastEvent()) {
      return {
        badge: "bg-slate-700/90 text-white",
        icon: "text-slate-600",
        accent: "text-slate-500"
      };
    }
    if (isEarlyBird()) {
      return {
        badge: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
        icon: "text-amber-600",
        accent: "text-amber-600"
      };
    }
    return {
      badge: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
      icon: "text-emerald-600",
      accent: "text-emerald-600"
    };
  };

  const statusColors = getStatusColors();

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

            {/* Status badges with improved positioning */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {isPastEvent() ? (
                <Badge className={`${statusColors.badge} backdrop-blur-sm status-badge`}>
                  <Clock className="mr-1 h-3 w-3" />
                  Past Event
                </Badge>
              ) : (
                <Badge className={`${statusColors.badge} backdrop-blur-sm status-badge`}>
                  <Calendar className="mr-1 h-3 w-3" />
                  {isUpcoming() ? "Upcoming" : "Live Now"}
                </Badge>
              )}
            </div>

            {/* Early bird badge with enhanced animation */}
            {isEarlyBird() && !isPastEvent() && (
              <div className="absolute right-4 top-4">
                <Badge className="pulse-glow bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg backdrop-blur-sm status-badge">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Early Bird
                </Badge>
              </div>
            )}

            {/* Featured indicator */}
            {variant === "featured" && (
              <div className="absolute right-4 bottom-4">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg backdrop-blur-sm status-badge">
                  <Star className="mr-1 h-3 w-3" />
                  Featured
                </Badge>
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

          {/* Enhanced event details with better spacing */}
          <div className={`mb-4 space-y-3 ${variant === "compact" ? "text-sm" : ""}`}>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span className="font-medium">{formatDate(event.startDate)}</span>
              <Clock className="ml-2 h-4 w-4 text-emerald-500" />
              <span>{formatTime(event.startDate)}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 text-rose-500" />
              <span className="line-clamp-1 font-medium">{event.venue}</span>
            </div>
          </div>

          {/* Enhanced tags with better visual hierarchy */}
          {event.tags?.length > 0 && variant !== "compact" && (
            <div className="mb-4 flex flex-wrap gap-2">
              {event.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs border-gray-200 text-gray-600 bg-gray-50/50"
                >
                  +{event.tags.length - 3} more
                </Badge>
              )}
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
