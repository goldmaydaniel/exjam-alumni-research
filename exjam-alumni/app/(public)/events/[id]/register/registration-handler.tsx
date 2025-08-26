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
    fetchEvent(eventId);
  }, [eventId]);

  const fetchEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else {
        // Use fallback for pg-conference-2025
        if (id === "pg-conference-2025") {
          setEvent(fallbackEvent);
        } else {
          throw new Error("Event not found");
        }
      }
    } catch (err) {
      console.error(err);
      if (eventId === "pg-conference-2025") {
        setEvent(fallbackEvent);
      } else {
        toast.error("Event not found");
        router.push("/events");
      }
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

  const displayEvent = event || fallbackEvent;

  const isEarlyBird = () => {
    if (!displayEvent?.earlyBirdDeadline) return false;
    return new Date(displayEvent.earlyBirdDeadline) > new Date();
  };

  const handleRegistration = async () => {
    setRegistering(true);

    try {
      // Check if user is authenticated first
      const authCheck = await fetch("/api/auth/profile");
      if (!authCheck.ok) {
        toast.error("Please login to register for events");
        router.push(`/login?redirect=/events/${eventId}/register`);
        return;
      }

      // First, create the event in the database if it doesn't exist
      if (eventId === "pg-conference-2025") {
        // Try to create the event if it doesn't exist
        const createEventRes = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fallbackEvent.title,
            description: fallbackEvent.shortDescription,
            shortDescription: fallbackEvent.shortDescription,
            startDate: fallbackEvent.startDate,
            endDate: fallbackEvent.endDate,
            venue: fallbackEvent.venue,
            address: fallbackEvent.address,
            capacity: 500,
            price: fallbackEvent.price,
            status: "PUBLISHED"
          })
        });
        
        if (createEventRes.ok) {
          const newEvent = await createEventRes.json();
          setEvent(newEvent);
        }
      }

      // Make actual registration API call
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: displayEvent.id,
          ticketType: "REGULAR",
          specialRequests: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Registration successful! Redirecting to payment...");
      
      // Redirect to payment page if payment URL is provided
      if (data.paymentUrl) {
        router.push(data.paymentUrl);
      } else if (data.payment?.id) {
        router.push(`/payment/${data.payment.id}`);
      } else {
        router.push(`/events/${eventId}/confirmation`);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message.includes("already registered")) {
        toast.error("You have already registered for this event");
      } else {
        toast.error(error.message || "Registration failed. Please try again.");
      }
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

  if (!displayEvent) return null;

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
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Left - Event Summary */}
            <div className="space-y-6 sm:space-y-8 lg:col-span-2">
              <Card className="overflow-hidden rounded-3xl border-0 shadow-2xl">
                {/* Event Header */}
                <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 text-white">
                  <div className="relative z-10">
                    <h1 className="mb-3 text-3xl font-black leading-tight">{displayEvent.title}</h1>
                    <p className="text-lg leading-relaxed text-blue-100">
                      {displayEvent.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-4 sm:p-8">
                  <div className="mb-6 sm:mb-8">
                    <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-gray-900">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Event Information
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-blue-50 p-4">
                        <p className="mb-1 text-sm font-bold text-gray-900">Date & Time</p>
                        <p className="text-sm text-gray-600">{formatDate(displayEvent.startDate)}</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {formatTime(displayEvent.startDate)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-green-50 p-4">
                        <p className="mb-1 text-sm font-bold text-gray-900">Venue</p>
                        <p className="text-sm font-semibold text-gray-600">{displayEvent.venue}</p>
                        {displayEvent.address && (
                          <p className="mt-1 text-xs text-gray-600">{displayEvent.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right - Registration Card */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden rounded-3xl border-0 shadow-2xl">
                <div className="p-6">
                  <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-gray-900">
                    <Ticket className="h-5 w-5 text-blue-600" />
                    Registration Summary
                  </h2>

                  <div className="mb-8 text-center">
                    <div className="text-4xl font-black text-blue-600">
                      ₦{displayEvent.price.toLocaleString()}
                    </div>
                  </div>

                  <Button
                    onClick={handleRegistration}
                    disabled={registering}
                    className="w-full h-14 text-base font-bold"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Ticket className="mr-2 h-5 w-5" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}