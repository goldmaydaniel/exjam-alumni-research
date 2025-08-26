"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  Share2,
  Heart,
  CheckCircle,
  Info,
  Mail,
  Phone,
  Globe,
  Ticket,
  Tag,
} from "lucide-react";
import { toast } from "react-hot-toast";

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

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const eventId = params.id as string;

  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
    }
  }, [eventId]);

  const fetchEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else {
        router.push("/events");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      router.push("/events");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      weekday: "long",
      day: "numeric",
      month: "long",
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
    if (!event?.earlyBirdDeadline) return false;
    return new Date(event.earlyBirdDeadline) > new Date();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container py-20">
          <div className="animate-pulse">
            <div className="h-96 rounded-2xl bg-gray-200" />
            <div className="mt-8 space-y-4">
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const currentPrice = isEarlyBird() && event.earlyBirdPrice ? event.earlyBirdPrice : event.price;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] overflow-hidden">
        {/* Background Layer */}
        {event.imageUrl ? (
          <>
            <div className="absolute inset-0">
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="scale-110 object-cover transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-purple-900/30" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900" />
            <div className="absolute inset-0">
              {/* Animated background orbs */}
              <div className="absolute right-0 top-0 h-96 w-96 -translate-y-16 translate-x-32 animate-pulse rounded-full bg-yellow-500 opacity-20 blur-3xl" />
              <div
                className="absolute bottom-0 left-0 h-96 w-96 -translate-x-32 translate-y-16 animate-pulse rounded-full bg-cyan-500 opacity-20 blur-3xl"
                style={{ animationDelay: "1s" }}
              />
              <div
                className="absolute right-1/3 top-1/3 h-64 w-64 animate-pulse rounded-full bg-pink-500 opacity-15 blur-2xl"
                style={{ animationDelay: "2s" }}
              />
              <div
                className="absolute left-1/4 top-1/4 h-48 w-48 animate-pulse rounded-full bg-green-500 opacity-10 blur-2xl"
                style={{ animationDelay: "3s" }}
              />
            </div>
            {/* Geometric overlay patterns */}
            <div className="absolute inset-0">
              <div
                className="absolute left-20 top-20 h-32 w-32 rotate-45 animate-spin border border-white/10"
                style={{ animationDuration: "20s" }}
              ></div>
              <div
                className="absolute bottom-20 right-20 h-24 w-24 animate-bounce rounded-full border-2 border-white/20"
                style={{ animationDelay: "1s", animationDuration: "3s" }}
              ></div>
              <div className="absolute left-10 top-1/2 h-16 w-16 rotate-12 animate-pulse bg-white/5"></div>
            </div>
          </>
        )}

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Enhanced Navigation Bar */}
        <div className="absolute left-0 right-0 top-0 z-30 p-6">
          <div className="flex items-center justify-between">
            <Link href="/events">
              <Button
                variant="ghost"
                className="group transform rounded-full border border-white/30 bg-white/10 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Events
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              {/* Event Status Badge */}
              {event.status === "PUBLISHED" && (
                <Badge className="border border-green-500/30 bg-green-500/20 text-green-300 backdrop-blur-sm">
                  <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
                  Live Event
                </Badge>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleShare}
                  variant="ghost"
                  size="icon"
                  className="group transform rounded-full border border-white/30 bg-white/10 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
                >
                  <Share2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                </Button>
                <Button
                  onClick={handleFavorite}
                  variant="ghost"
                  size="icon"
                  className="group transform rounded-full border border-white/30 bg-white/10 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
                >
                  <Heart
                    className={`h-4 w-4 transition-all group-hover:scale-110 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Event Title Section */}
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container px-4">
            <div className="max-w-5xl">
              {/* Event Tags & Badges */}
              <div className="animate-fade-in mb-6 flex flex-wrap gap-3">
                {event.tags.map((tag, index) => (
                  <Badge
                    key={tag}
                    className="transform rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/20"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Tag className="mr-2 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
                {isEarlyBird() && (
                  <Badge className="animate-pulse rounded-full border-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 px-6 py-2 text-white shadow-2xl">
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    <span className="font-bold">Limited Time Offer</span>
                  </Badge>
                )}
              </div>

              {/* Main Title with Animation */}
              <div className="mb-8 space-y-6">
                <h1 className="text-4xl font-black leading-[0.9] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl">
                  <span className="animate-gradient inline-block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                    {event.title}
                  </span>
                </h1>
                <p className="max-w-4xl text-xl font-medium leading-relaxed text-white/95 md:text-2xl lg:text-3xl">
                  {event.shortDescription}
                </p>
              </div>

              {/* Enhanced Info Cards */}
              <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="group flex items-center gap-4 rounded-2xl border border-white/30 bg-white/10 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/20">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                      Event Date
                    </p>
                    <p className="text-lg font-bold text-white">{formatDate(event.startDate)}</p>
                  </div>
                </div>

                <div className="group flex items-center gap-4 rounded-2xl border border-white/30 bg-white/10 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/20">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                      Start Time
                    </p>
                    <p className="text-lg font-bold text-white">{formatTime(event.startDate)}</p>
                  </div>
                </div>

                <div className="group flex items-center gap-4 rounded-2xl border border-white/30 bg-white/10 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/20 sm:col-span-2 lg:col-span-1">
                  <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                      Venue
                    </p>
                    <p className="text-lg font-bold leading-tight text-white">{event.venue}</p>
                  </div>
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="mt-8">
                <Link href={`/events/${event.id}/register`}>
                  <Button
                    size="lg"
                    className="hover:shadow-3xl group transform rounded-2xl border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700"
                  >
                    <Ticket className="mr-3 h-5 w-5" />
                    Register Now
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 transform">
          <div className="animate-bounce">
            <div className="flex h-10 w-6 justify-center rounded-full border-2 border-white/50">
              <div className="mt-2 h-3 w-1 animate-pulse rounded-full bg-white/70"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container relative z-20 -mt-10 px-4 pb-24">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Left Column - Event Details */}
          <div className="space-y-10 lg:col-span-2">
            {/* Quick Info Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="group border-0 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Date</p>
                    <p className="text-sm font-bold leading-tight text-gray-900">
                      {formatDate(event.startDate)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="group border-0 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Time</p>
                    <p className="text-sm font-bold text-gray-900">{formatTime(event.startDate)}</p>
                  </div>
                </div>
              </Card>

              <Card className="group border-0 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Venue</p>
                    <p className="line-clamp-2 text-sm font-bold leading-tight text-gray-900">
                      {event.venue}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs Section */}
            <Card className="overflow-hidden rounded-3xl border-0 bg-white shadow-xl">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="h-auto w-full justify-start rounded-none border-b bg-gray-50 p-0">
                  <TabsTrigger
                    value="about"
                    className="rounded-none border-b-4 border-transparent px-8 py-4 font-semibold text-gray-600 transition-all duration-300 data-[state=active]:border-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600"
                  >
                    <Info className="mr-2 h-5 w-5" />
                    About Event
                  </TabsTrigger>
                  <TabsTrigger
                    value="schedule"
                    className="rounded-none border-b-4 border-transparent px-8 py-4 font-semibold text-gray-600 transition-all duration-300 data-[state=active]:border-green-600 data-[state=active]:bg-white data-[state=active]:text-green-600"
                  >
                    <Clock className="mr-2 h-5 w-5" />
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger
                    value="venue"
                    className="rounded-none border-b-4 border-transparent px-8 py-4 font-semibold text-gray-600 transition-all duration-300 data-[state=active]:border-purple-600 data-[state=active]:bg-white data-[state=active]:text-purple-600"
                  >
                    <MapPin className="mr-2 h-5 w-5" />
                    Venue Info
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="p-8">
                  <div className="space-y-8">
                    <div>
                      <h3 className="mb-6 text-3xl font-bold text-gray-900">Conference Overview</h3>
                      <div className="prose prose-lg max-w-none">
                        <div className="space-y-4 text-lg leading-relaxed text-gray-700">
                          <p>
                            The President General's Conference "Maiden Flight" represents a historic
                            milestone in the journey of The ExJAM Association. This inaugural
                            three-day conference brings together Ex-Junior Airmen from across
                            Nigeria and the diaspora for an unprecedented gathering of military
                            academy alumni.
                          </p>
                          <p>
                            Set against the backdrop of Nigeria's capital city, this conference
                            symbolizes our collective takeoff into a new era of alumni engagement,
                            professional development, and brotherhood strengthening.
                          </p>
                          <p>
                            From November 28-30, 2025, the NAF Conference Centre in Abuja will host
                            distinguished alumni, industry leaders, and special guests for three
                            days of networking, learning, celebration, and strategic planning for
                            the future of our association.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
                      <h4 className="mb-6 text-2xl font-bold text-gray-900">
                        Maiden Flight Experience
                      </h4>
                      <p className="mb-6 text-base leading-relaxed text-gray-700">
                        Join us for this historic inaugural President General's Conference - where
                        Ex-Junior Airmen take flight together into a new era of excellence and
                        brotherhood.
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-green-100 p-2">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">Network & Connect</h5>
                            <p className="text-gray-600">
                              Forge lasting connections with accomplished Ex-Junior Airmen across
                              diverse career paths and industries
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-purple-100 p-2">
                            <CheckCircle className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">Inspiring Experiences</h5>
                            <p className="text-gray-600">
                              Experience thought-provoking keynotes, interactive workshops, and
                              memorable entertainment programs
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-orange-100 p-2">
                            <CheckCircle className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">Culinary Excellence</h5>
                            <p className="text-gray-600">
                              Savor exquisitely prepared Nigerian and international cuisine by
                              renowned chefs
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-blue-100 p-2">
                            <CheckCircle className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">Squadron Brotherhood</h5>
                            <p className="text-gray-600">
                              Reconnect with your squadron family and celebrate the bonds forged at
                              the Academy
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="p-8">
                  <div className="space-y-8">
                    <h3 className="text-3xl font-bold text-gray-900">Program Timeline</h3>
                    <div className="space-y-6">
                      <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-lg">
                            Day 1
                          </div>
                          <div className="mt-2 h-16 w-1 bg-gradient-to-b from-blue-500 to-green-500"></div>
                        </div>
                        <div className="flex-1 pt-3">
                          <h4 className="mb-2 text-xl font-bold text-gray-900">
                            Thursday, November 28th 2025
                          </h4>
                          <p className="leading-relaxed text-gray-600">
                            Conference Opening • Registration & Welcome Ceremony • Keynote Address
                            by Distinguished Alumni
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-xs font-bold text-white shadow-lg">
                            Day 2
                          </div>
                          <div className="mt-2 h-16 w-1 bg-gradient-to-b from-green-500 to-purple-500"></div>
                        </div>
                        <div className="flex-1 pt-3">
                          <h4 className="mb-2 text-xl font-bold text-gray-900">
                            Friday, November 29th 2025
                          </h4>
                          <p className="leading-relaxed text-gray-600">
                            Main Conference Day • Business Sessions • Squadron Meetings •
                            Professional Development Workshops
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-xs font-bold text-white shadow-lg">
                            Day 3
                          </div>
                          <div className="mt-2 h-16 w-1 bg-gradient-to-b from-purple-500 to-orange-500"></div>
                        </div>
                        <div className="flex-1 pt-3">
                          <h4 className="mb-2 text-xl font-bold text-gray-900">
                            Saturday, November 30th 2025
                          </h4>
                          <p className="leading-relaxed text-gray-600">
                            Grand Finale • Cultural Night • Awards Ceremony • Gala Dinner • Closing
                            Ceremony
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="venue" className="p-8">
                  <div className="space-y-8">
                    <h3 className="text-3xl font-bold text-gray-900">Location Details</h3>

                    <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 p-8">
                      <div className="flex items-start gap-6">
                        <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 shadow-lg">
                          <MapPin className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-2 text-2xl font-bold text-gray-900">
                            NAF Conference Centre
                          </h4>
                          <p className="mb-4 text-lg text-gray-600">
                            Federal Capital Territory (FCT), Abuja, Nigeria
                          </p>
                          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                            <h5 className="mb-2 font-semibold text-yellow-800">Historic Venue</h5>
                            <p className="text-sm text-yellow-700">
                              The Nigerian Air Force Conference Centre - a fitting location for this
                              milestone gathering of Ex-Junior Airmen.
                            </p>
                          </div>
                          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                            <MapPin className="mr-2 h-4 w-4" />
                            Open in Maps
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <Card className="border-0 bg-white p-6 shadow-lg">
                        <h4 className="mb-4 text-lg font-bold text-gray-900">Transportation</h4>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-3">
                            <div className="rounded-full bg-green-100 p-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-gray-700">Complimentary secured parking</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="rounded-full bg-blue-100 p-1">
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-gray-700">Metro & bus connections nearby</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="rounded-full bg-orange-100 p-1">
                              <CheckCircle className="h-4 w-4 text-orange-600" />
                            </div>
                            <span className="text-gray-700">Dedicated ride-share zone</span>
                          </li>
                        </ul>
                      </Card>

                      <Card className="border-0 bg-white p-6 shadow-lg">
                        <h4 className="mb-4 text-lg font-bold text-gray-900">Amenities</h4>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-3">
                            <div className="rounded-full bg-purple-100 p-1">
                              <CheckCircle className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="text-gray-700">Climate-controlled environment</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="rounded-full bg-teal-100 p-1">
                              <CheckCircle className="h-4 w-4 text-teal-600" />
                            </div>
                            <span className="text-gray-700">State-of-the-art AV systems</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="rounded-full bg-pink-100 p-1">
                              <CheckCircle className="h-4 w-4 text-pink-600" />
                            </div>
                            <span className="text-gray-700">Full accessibility compliance</span>
                          </li>
                        </ul>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Registration Card */}
          <div className="lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-6">
              <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-2xl backdrop-blur-sm">
                <div className="relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>

                  <div className="relative p-6">
                    {/* Price Section */}
                    <div className="mb-6 text-center">
                      {isEarlyBird() && event.earlyBirdPrice ? (
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 text-sm text-white shadow-lg">
                            <Sparkles className="h-3 w-3" />
                            <span className="font-bold">Early Bird Offer</span>
                          </div>

                          <div className="space-y-1">
                            <div className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-4xl font-black text-transparent">
                              ₦{currentPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 line-through">
                              Regular: ₦{event.price.toLocaleString()}
                            </div>
                            <div className="inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                              Save ₦{(event.price - currentPrice).toLocaleString()}
                            </div>
                          </div>

                          <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-3">
                            <p className="text-xs font-bold text-orange-800">
                              ⏰ Offer ends {formatDate(event.earlyBirdDeadline!)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-black text-transparent">
                          ₦{event.price.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Link href={`/events/${event.id}/register`}>
                      <Button className="h-14 w-full transform rounded-xl border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-2xl">
                        <Ticket className="mr-2 h-5 w-5" />
                        Register Now
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>

                    {/* What's Included */}
                    <div className="mt-6 rounded-xl bg-white/80 p-4 shadow-lg backdrop-blur-sm">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        What's Included
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-blue-100 p-1">
                            <Ticket className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            Special access & materials
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-green-100 p-1">
                            <Users className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            Gourmet dining experience
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-purple-100 p-1">
                            <Globe className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            Executive networking opportunities
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-orange-100 p-1">
                            <CheckCircle className="h-3 w-3 text-orange-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            Commemorative digital certificate
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Alumni Notice */}
                    <div className="mt-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 rounded-full bg-blue-100 p-1.5">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="mb-1 text-sm font-bold text-blue-900">Alumni Gathering</h5>
                          <p className="text-xs leading-relaxed text-blue-700">
                            A gathering for verified Ex-Junior Airmen. Alumni credentials required
                            for participation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Contact Card */}
              <Card className="overflow-hidden rounded-3xl border-0 bg-white shadow-xl">
                <div className="p-6">
                  <h4 className="mb-4 flex items-center gap-3 text-lg font-bold text-gray-900">
                    <div className="rounded-full bg-green-100 p-2">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    Event Support Center
                  </h4>
                  <div className="space-y-3">
                    <a
                      href="mailto:support@exjam.org.ng"
                      className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3 transition-all duration-300 hover:from-blue-100 hover:to-indigo-100"
                    >
                      <div className="rounded-full bg-blue-100 p-1.5 transition-colors group-hover:bg-blue-200">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Event Inquiries</p>
                        <p className="text-xs text-blue-600">support@exjam.org.ng</p>
                      </div>
                    </a>
                    <a
                      href="tel:+2348091234567"
                      className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-3 transition-all duration-300 hover:from-green-100 hover:to-emerald-100"
                    >
                      <div className="rounded-full bg-green-100 p-1.5 transition-colors group-hover:bg-green-200">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Direct Line</p>
                        <p className="text-xs text-green-600">+234 (0) 809 123 4567</p>
                      </div>
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
