"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Download,
  FileText,
  Video,
  Link as LinkIcon,
  Star,
  MessageSquare,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";

// Simple date formatting function
const formatDate = (
  dateString: string,
  formatType: "short" | "long" | "full" | "time" = "short"
) => {
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const longMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const month = months[date.getMonth()];
  const longMonth = longMonths[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const weekday = weekdays[date.getDay()];
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  switch (formatType) {
    case "short":
      return `${month} ${day}, ${year}`;
    case "long":
      return `${weekday}, ${longMonth} ${day}, ${year}`;
    case "full":
      return `${weekday}, ${longMonth} ${day}, ${year}`;
    case "time":
      return `${displayHours}:${minutes} ${ampm}`;
    default:
      return `${month} ${day}, ${year}`;
  }
};

interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  price: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
  capacity: number;
  imageUrl?: string;
  _count: {
    registrations: number;
  };
}

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (params.id) {
      fetchEvent(params.id as string);
      fetchFeedback(params.id as string);
      fetchResources(params.id as string);
    }
  }, [params.id]);

  const fetchEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) throw new Error("Failed to fetch event");
      const data = await response.json();
      setEvent(data);
    } catch (err) {
      setError("Failed to load event details. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}/feedback`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
        setFeedbackStats(data.statistics);
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    }
  };

  const fetchResources = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}/resources`);
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources);
      }
    } catch (err) {
      console.error("Failed to fetch resources:", err);
    }
  };

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin text-2xl text-blue-600">⏳</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold">Event Not Found</h2>
          <p className="mb-6 text-muted-foreground">
            {error || "The event you're looking for doesn't exist."}
          </p>
          <Button
            onClick={() => router.push("/events")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
          >
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const spotsLeft = event.capacity - event._count.registrations;
  const isFullyBooked = spotsLeft <= 0;
  const isAlmostFull = spotsLeft > 0 && spotsLeft <= 10;
  const isEarlyBird = event.earlyBirdDeadline && new Date(event.earlyBirdDeadline) > new Date();
  const currentPrice = isEarlyBird && event.earlyBirdPrice ? event.earlyBirdPrice : event.price;
  const percentageFilled = ((event._count.registrations / event.capacity) * 100).toFixed(0);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-16">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="container relative z-10">
          <Button
            variant="ghost"
            className="mb-6 text-white hover:bg-white/10 hover:text-yellow-400"
            onClick={() => router.push("/events")}
          >
            <span className="mr-2">←</span>
            Back to All Events
          </Button>

          <div className="max-w-4xl">
            {/* Event Badge */}
            <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              <span className="text-yellow-400">✨</span>
              <span className="font-semibold uppercase tracking-wider">
                The ExJAM Association Event
              </span>
            </div>

            {/* Title */}
            <h1 className="animate-fade-in-up mb-4 text-4xl font-black tracking-tight text-white md:text-6xl">
              {event.title}
            </h1>

            {/* Description */}
            <p className="animate-fade-in-up animation-delay-200 mb-8 text-xl font-light text-blue-100">
              {event.shortDescription}
            </p>

            {/* Quick Info */}
            <div className="animate-fade-in-up animation-delay-400 flex flex-wrap gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">📅</span>
                <span>{formatDate(event.startDate, "short")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">⏰</span>
                <span>{formatDate(event.startDate, "time")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">📍</span>
                <span>{event.venue}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 dark:from-gray-900 dark:to-background">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Left Column - Tabbed Content */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="feedback">Reviews</TabsTrigger>
                  <TabsTrigger value="agenda">Agenda</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                  {/* Event Image */}
                  {event.imageUrl && (
                    <div className="mb-12 aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl">
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        width={800}
                        height={450}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* About Section */}
                  <div className="mb-12">
                    <div className="mb-6 flex items-center gap-2">
                      <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                        About This Event
                      </h2>
                    </div>
                    <div className="prose prose-lg max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-400">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  {/* Event Details Grid */}
                  <div className="mb-12">
                    <div className="mb-6 flex items-center gap-2">
                      <div className="h-1 w-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-600"></div>
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                        Event Details
                      </h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <Card className="border-l-4 border-blue-500 transition-shadow hover:shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                              <span className="text-2xl text-white">📅</span>
                            </div>
                            <div>
                              <h3 className="mb-2 text-lg font-bold">Date & Time</h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                {formatDate(event.startDate, "long")}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                {formatDate(event.startDate, "time")} -{" "}
                                {formatDate(event.endDate, "time")}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-green-500 transition-shadow hover:shadow-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                              <span className="text-2xl text-white">📍</span>
                            </div>
                            <div>
                              <h3 className="mb-2 text-lg font-bold">Location</h3>
                              <p className="text-gray-600 dark:text-gray-400">{event.venue}</p>
                              {event.address && (
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  {event.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* What to Expect */}
                  <div className="mb-12">
                    <div className="mb-6 flex items-center gap-2">
                      <div className="h-1 w-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                        What to Expect
                      </h2>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                      {[
                        {
                          icon: "🏆",
                          title: "Awards",
                          description: "Recognition of outstanding alumni",
                        },
                        {
                          icon: "👥",
                          title: "Networking",
                          description: "Connect with fellow eagles",
                        },
                        {
                          icon: "❤️",
                          title: "Memories",
                          description: "Share stories and experiences",
                        },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="rounded-2xl bg-gray-50 p-6 text-center transition-all duration-300 hover:shadow-lg dark:bg-gray-800"
                        >
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500">
                            <span className="text-3xl text-white">{item.icon}</span>
                          </div>
                          <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Registration Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 overflow-hidden border-0 shadow-2xl">
                {/* Card Header with Gradient */}
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid3' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid3)'/%3E%3C/svg%3E")`,
                      }}
                    ></div>
                  </div>
                  <div className="relative">
                    <h3 className="mb-2 text-2xl font-bold">Secure Your Spot</h3>
                    <p className="text-blue-100">Join fellow alumni at this exclusive event</p>
                  </div>
                </div>

                <CardContent className="space-y-6 p-6">
                  {/* Early Bird Alert */}
                  {isEarlyBird && event.earlyBirdPrice && (
                    <div className="rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 dark:border-yellow-800 dark:from-yellow-900/20 dark:to-orange-900/20">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-yellow-600">✨</span>
                        <p className="font-bold text-yellow-900 dark:text-yellow-400">
                          Early Bird Special!
                        </p>
                      </div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-500">
                        Save ${event.price - event.earlyBirdPrice} when you register before{" "}
                        {formatDate(event.earlyBirdDeadline!, "short")}
                      </p>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Ticket Price</span>
                      <div className="text-right">
                        <p className="text-3xl font-black text-gray-900 dark:text-white">
                          ${currentPrice}
                        </p>
                        {isEarlyBird && event.earlyBirdPrice && (
                          <p className="text-sm text-gray-500 line-through">${event.price}</p>
                        )}
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Availability</span>
                        <span
                          className={`font-bold ${isFullyBooked ? "text-red-600" : isAlmostFull ? "text-orange-600" : "text-green-600"}`}
                        >
                          {isFullyBooked
                            ? "SOLD OUT"
                            : isAlmostFull
                              ? "Almost Full"
                              : `${spotsLeft} spots left`}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isFullyBooked
                              ? "bg-red-500"
                              : isAlmostFull
                                ? "bg-gradient-to-r from-orange-500 to-red-500"
                                : "bg-gradient-to-r from-green-500 to-emerald-500"
                          }`}
                          style={{ width: `${percentageFilled}%` }}
                        />
                      </div>
                      <p className="text-center text-xs text-gray-500">
                        {event._count.registrations} of {event.capacity} spots filled
                      </p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full transform rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                    size="lg"
                    disabled={isFullyBooked}
                    asChild
                  >
                    <Link
                      href={`/events/${event.id}/register`}
                      className="flex items-center justify-center gap-2"
                    >
                      {isFullyBooked ? "Join Waitlist" : "Register Now"}
                      <span>→</span>
                    </Link>
                  </Button>

                  {/* Share Buttons */}
                  <div className="flex gap-3 border-t pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <span className="mr-2">🔗</span>
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <span className="mr-2">❤️</span>
                      Save
                    </Button>
                  </div>

                  <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    By registering, you agree to our terms and conditions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Related Events Section */}
      <section className="bg-white py-16 dark:bg-background">
        <div className="container">
          <div className="mb-12 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Discover More
            </span>
            <h2 className="mt-4 text-3xl font-black text-gray-900 dark:text-white md:text-4xl">
              Other Upcoming Events
            </h2>
          </div>

          <div className="flex justify-center">
            <Button asChild variant="outline" size="lg" className="font-semibold">
              <Link href="/events" className="flex items-center gap-2">
                Browse All Events
                <span>›</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
