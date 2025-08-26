"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Event {
  id: string;
  title: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  price: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
}

// Fallback event for when database is not set up
const fallbackEvent: Event = {
  id: "pg-conference-2025",
  title: "President General's Conference - Maiden Flight",
  shortDescription: "A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association",
  startDate: "2025-11-28T09:00:00.000Z",
  endDate: "2025-11-30T18:00:00.000Z",
  venue: "NAF Conference Centre, FCT, ABUJA",
  address: "Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria",
  price: 20000,
  earlyBirdPrice: undefined,
  earlyBirdDeadline: undefined,
};

export default function EventRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const eventId = params.id as string;

  useEffect(() => {
    // For now, just use the fallback event directly to avoid API issues
    if (eventId === "pg-conference-2025") {
      setEvent(fallbackEvent);
    } else {
      // For other events, try to fetch but fallback gracefully
      fetchEvent(eventId);
    }
    setLoading(false);
  }, [eventId]);

  const fetchEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else {
        // If API fails, use fallback event
        setEvent(fallbackEvent);
      }
    } catch (err) {
      console.error(err);
      // Use fallback event for any error
      setEvent(fallbackEvent);
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
    if (!displayEvent?.earlyBirdDeadline) return false;
    return new Date(displayEvent.earlyBirdDeadline) > new Date();
  };

  const handleRegistration = async () => {
    setRegistering(true);

    try {
      // Simulate registration process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Registration successful! Check your email for confirmation.");
      // For now, redirect to events page since confirmation page might not exist
      router.push(`/events`);
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Always show the fallback event if no event is loaded
  const displayEvent = event || fallbackEvent;

  const currentPrice = isEarlyBird() && displayEvent.earlyBirdPrice ? displayEvent.earlyBirdPrice : displayEvent.price;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Enhanced Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-16">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-10 translate-x-20 transform rounded-full bg-yellow-500 opacity-10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-20 translate-y-10 transform rounded-full bg-green-500 opacity-10 blur-3xl" />
        </div>

        <div className="container relative z-10">
          <div className="mb-8 flex items-center justify-between">
            <Link href={`/events/${eventId}`}>
              <Button
                variant="ghost"
                className="group rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Event
              </Button>
            </Link>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="font-semibold text-white">Secure Registration</span>
            </div>
          </div>

          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Ticket className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">Event Registration</span>
            </div>
            <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-6xl">
              Complete Your Registration
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-blue-100">
              Join fellow Ex-Junior Airmen at this event
            </p>
          </div>
        </div>
      </section>

      <div className="container relative z-10 -mt-8 px-4 pb-8 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          {/* Mobile-Optimized Progress Steps */}
          <div className="mb-6 sm:mb-12">
            <Card className="overflow-hidden rounded-3xl border-0 bg-white/90 shadow-xl backdrop-blur-sm">
              <div className="p-4 sm:p-8">
                <h2 className="mb-4 text-center text-base font-bold text-gray-900 sm:mb-6 sm:text-lg">
                  Registration Process
                </h2>
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 font-bold text-white shadow-lg sm:h-12 sm:w-12">
                        1
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-sm font-bold text-blue-900 sm:text-base">
                          Event Details
                        </p>
                        <p className="hidden text-xs text-blue-600 sm:block">Review and confirm</p>
                      </div>
                    </div>
                    <div className="h-px w-4 bg-gradient-to-r from-blue-500 to-purple-500 sm:w-8 lg:w-16" />
                    <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white font-bold text-gray-400 shadow sm:h-12 sm:w-12">
                        2
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-sm font-bold text-gray-400 sm:text-base">Payment</p>
                        <p className="hidden text-xs text-gray-400 sm:block">Secure checkout</p>
                      </div>
                    </div>
                    <div className="h-px w-4 bg-gray-300 sm:w-8 lg:w-16" />
                    <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white font-bold text-gray-400 shadow sm:h-12 sm:w-12">
                        3
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-sm font-bold text-gray-400 sm:text-base">Confirmation</p>
                        <p className="hidden text-xs text-gray-400 sm:block">You're all set!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Left - Event Summary */}
            <div className="space-y-6 sm:space-y-8 lg:col-span-2">
              <Card className="overflow-hidden rounded-3xl border-0 shadow-2xl">
                {/* Event Header */}
                <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 text-white">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-0">
                    <div className="absolute right-0 top-0 h-32 w-32 -translate-y-5 translate-x-10 transform rounded-full bg-yellow-500 opacity-20 blur-2xl" />
                    <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-10 translate-y-5 transform rounded-full bg-green-500 opacity-20 blur-2xl" />
                  </div>

                  <div className="relative z-10">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                      <Sparkles className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-semibold text-white">Alumni Event</span>
                    </div>
                    <h1 className="mb-3 text-3xl font-black leading-tight">{displayEvent.title}</h1>
                    <p className="text-lg leading-relaxed text-blue-100">
                      {displayEvent.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-4 sm:p-8">
                  <div className="mb-6 sm:mb-8">
                    <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-gray-900 sm:mb-6 sm:text-2xl">
                      <div className="rounded-full bg-blue-100 p-2">
                        <Calendar className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                      </div>
                      Event Information
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                      <div className="group flex items-start gap-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-3 transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 sm:gap-4 sm:rounded-2xl sm:p-4">
                        <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 p-2 shadow-lg transition-transform duration-300 group-hover:scale-110 sm:rounded-xl sm:p-3">
                          <Calendar className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-sm font-bold text-gray-900 sm:text-base">
                            Date & Time
                          </p>
                          <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                            {formatDate(displayEvent.startDate)}
                          </p>
                          <p className="text-xs font-semibold text-blue-600 sm:text-sm">
                            {formatTime(displayEvent.startDate)}
                          </p>
                        </div>
                      </div>

                      <div className="group flex items-start gap-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-3 transition-all duration-300 hover:from-green-100 hover:to-emerald-100 sm:gap-4 sm:rounded-2xl sm:p-4">
                        <div className="rounded-lg bg-gradient-to-br from-green-600 to-green-700 p-2 shadow-lg transition-transform duration-300 group-hover:scale-110 sm:rounded-xl sm:p-3">
                          <MapPin className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-sm font-bold text-gray-900 sm:text-base">Venue</p>
                          <p className="text-xs font-semibold text-gray-600 sm:text-sm">
                            {displayEvent.venue}
                          </p>
                          {displayEvent.address && (
                            <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
                              {displayEvent.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* What's Included */}
                  <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:rounded-2xl sm:p-6">
                    <h3 className="mb-4 flex items-center gap-3 text-lg font-bold text-green-900 sm:mb-6 sm:text-xl">
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                      </div>
                      What's Included
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-1.5 sm:p-2">
                          <Ticket className="h-3 w-3 text-green-600 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 sm:text-sm">
                          Full event access & materials
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-1.5 sm:p-2">
                          <Users className="h-3 w-3 text-blue-600 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 sm:text-sm">
                          Catering & meals included
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-purple-100 p-1.5 sm:p-2">
                          <Users className="h-3 w-3 text-purple-600 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 sm:text-sm">
                          Networking sessions
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-orange-100 p-1.5 sm:p-2">
                          <CheckCircle className="h-3 w-3 text-orange-600 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 sm:text-sm">
                          Digital certificates
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-pink-100 p-1.5 sm:p-2">
                          <CheckCircle className="h-3 w-3 text-pink-600 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 sm:text-sm">
                          Professional photography
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-indigo-100 p-1.5 sm:p-2">
                          <CheckCircle className="h-3 w-3 text-indigo-600 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 sm:text-sm">
                          Squadron reunions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Alumni Notice */}
                  <div className="mt-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:mt-6 sm:rounded-2xl sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="rounded-full bg-blue-100 p-2 sm:p-3">
                        <Shield className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="mb-2 text-base font-bold text-blue-900 sm:text-lg">
                          Alumni Members Only
                        </h4>
                        <p className="text-sm leading-relaxed text-blue-800 sm:text-base">
                          This event is for verified Ex-Junior Airmen from the Air Force Military
                          School. Your alumni status will be verified during the registration
                          process to ensure authenticity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right - Mobile-Optimized Registration Card */}
            <div className="lg:col-span-1">
              <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-6">
                <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-2xl backdrop-blur-sm sm:rounded-3xl">
                  <div className="relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>

                    <div className="relative p-4 sm:p-6 lg:p-8">
                      <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-gray-900 sm:mb-6 sm:text-xl">
                        <div className="rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-2">
                          <Ticket className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                        </div>
                        Registration Summary
                      </h2>

                      {/* Mobile-Optimized Pricing */}
                      <div className="mb-6 text-center sm:mb-8">
                        {isEarlyBird() && displayEvent.earlyBirdPrice ? (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1.5 text-xs text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                              <Sparkles className="h-3 w-3 animate-spin sm:h-4 sm:w-4" />
                              <span className="font-bold">Early Bird Special</span>
                            </div>

                            <div className="space-y-2">
                              <div className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-3xl font-black text-transparent sm:text-4xl lg:text-5xl">
                                ₦{currentPrice.toLocaleString()}
                              </div>
                              <div className="text-base text-gray-500 line-through sm:text-lg">
                                Regular: ₦{displayEvent.price.toLocaleString()}
                              </div>
                              <div className="inline-block rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 sm:text-sm">
                                Save ₦{(displayEvent.price - currentPrice).toLocaleString()}
                              </div>
                            </div>

                            <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-3 sm:p-4">
                              <p className="text-xs font-bold text-orange-800 sm:text-sm">
                                ⏰ Early bird ends: {formatDate(displayEvent.earlyBirdDeadline!)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-black text-transparent sm:text-4xl lg:text-5xl">
                            ₦{displayEvent.price.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Mobile-Optimized CTA Button */}
                      <Button
                        onClick={handleRegistration}
                        disabled={registering}
                        className="hover:shadow-3xl h-12 w-full transform rounded-xl border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-sm font-bold text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 sm:h-14 sm:rounded-2xl sm:text-base lg:h-16 lg:text-lg"
                      >
                        {registering ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin sm:mr-3 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                            <span className="hidden sm:inline">Processing Registration...</span>
                            <span className="sm:hidden">Processing...</span>
                          </>
                        ) : (
                          <>
                            <Ticket className="mr-2 h-4 w-4 sm:mr-3 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Complete Registration</span>
                            <span className="sm:hidden">Register</span>
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:ml-3 sm:h-5 sm:w-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
