"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Users,
  ArrowRight,
  GraduationCap,
  Shield,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";

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
  capacity: number;
  _count: {
    registrations: number;
  };
}

export default function EventRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventId = params.id as string;
  const returnUrl = searchParams.get("return") || `/events/${eventId}`;

  useEffect(() => {
    if (!eventId || eventId === "undefined" || eventId === "null") {
      setError("No event specified. Please select an event to register for.");
      setLoading(false);
      return;
    }

    if (eventId) {
      fetchEvent(eventId);
    }
  }, [eventId]);

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
          <h2 className="mb-4 text-2xl font-bold">Unable to Load Registration</h2>
          <p className="mb-6 text-muted-foreground">
            {error ||
              "No event specified or the event you're trying to register for doesn't exist."}
          </p>
          <div className="space-y-4">
            <Button onClick={() => router.push("/events")} variant="outline">
              Back to Events
            </Button>
            <Button onClick={() => router.push("/register")} variant="default">
              General Registration
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const spotsLeft = event.capacity - event._count.registrations;
  const isFullyBooked = spotsLeft <= 0;
  const isEarlyBird = event.earlyBirdDeadline && new Date(event.earlyBirdDeadline) > new Date();
  const currentPrice = isEarlyBird && event.earlyBirdPrice ? event.earlyBirdPrice : event.price;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  if (isFullyBooked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="w-full max-w-2xl border-red-200">
          <CardHeader className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-900">Event Fully Booked</CardTitle>
            <CardDescription className="text-red-700">
              {event.title} has reached maximum capacity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              Unfortunately, all {event.capacity} spots for this event have been filled.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push("/events")} variant="outline">
                Browse Other Events
              </Button>
              <Button onClick={() => router.push(returnUrl)}>Back to Event Details</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Button
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-blue-600"
            onClick={() => router.push(returnUrl)}
          >
            ← Back to Event Details
          </Button>
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Event Registration</h1>
          <p className="text-gray-600">Complete your registration for this event</p>
        </div>

        {/* Event Summary Card */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5" />
              {event.title}
            </CardTitle>
            <CardDescription className="text-blue-700">{event.shortDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div>
                <span className="font-bold">{formatCurrency(currentPrice)}</span>
                {isEarlyBird && event.earlyBirdPrice && (
                  <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                    Early Bird!
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-800">{spotsLeft} spots left</span>
            </div>
          </CardContent>
        </Card>

        {/* Registration Card */}
        <div className="mx-auto max-w-2xl">
          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-4 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-900">Alumni Member Registration</CardTitle>
              <CardDescription>Register for this event as an AFMS alumni</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Full event access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Alumni networking opportunities</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Squadron reunion activities</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Event materials & recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Certificate of attendance</span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-900">
                  📋 Please ensure your alumni profile is complete before registering
                </p>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={() => {
                  // Check if user is logged in
                  const token = localStorage.getItem("token");
                  if (!token) {
                    router.push(
                      `/login?redirect=${encodeURIComponent(`/events/${eventId}/register/alumni`)}`
                    );
                  } else {
                    router.push(`/events/${eventId}/register/alumni?integrated=true`);
                  }
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Proceed to Event Registration
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-center text-xs text-gray-500">
                Alumni members only • Your status will be verified
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Not yet registered as alumni?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:underline">
              Create Alumni Account First
            </Link>{" "}
            • Already have an account?{" "}
            <Link
              href={`/login?redirect=${encodeURIComponent(window.location.href)}`}
              className="font-medium text-blue-600 hover:underline"
            >
              Sign In
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>🎫 Secure Registration</span>
            <span>•</span>
            <span>💳 Multiple Payment Options</span>
            <span>•</span>
            <span>📧 Instant Confirmation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
