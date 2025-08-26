"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Calendar,
  MapPin,
  Mail,
  Download,
  Share2,
  ArrowRight,
  Shield,
  UserPlus,
  Loader2,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
}

export default function RegistrationConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const eventId = params.id as string;
  const registrationType = searchParams.get("type") || "general";

  useEffect(() => {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">Event Not Found</h2>
        <Button onClick={() => router.push("/events")}>Back to Events</Button>
      </div>
    );
  }

  const isAlumni = registrationType === "alumni";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="container max-w-4xl">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-green-800">Registration Successful!</h1>
          <p className="text-lg text-green-600">Welcome to {event.title}</p>
          <Badge className="mt-2 bg-green-600">
            {isAlumni ? "Alumni Registration" : "General Registration"} Confirmed
          </Badge>
        </div>

        {/* Confirmation Details */}
        <Card className="mb-8 border-2 border-green-100">
          <CardHeader className="bg-green-50">
            <div className="flex items-center gap-3">
              {isAlumni ? (
                <Shield className="h-6 w-6 text-blue-600" />
              ) : (
                <UserPlus className="h-6 w-6 text-gray-600" />
              )}
              <div>
                <CardTitle className="text-xl">Your Registration is Confirmed</CardTitle>
                <CardDescription>
                  Payment processed successfully • Confirmation sent to your email
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 flex items-center font-semibold">
                  <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                  Event Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Event:</span> {event.title}
                  </div>
                  <div>
                    <span className="font-medium">Start:</span> {formatDate(event.startDate)} at{" "}
                    {formatTime(event.startDate)}
                  </div>
                  <div>
                    <span className="font-medium">End:</span> {formatDate(event.endDate)} at{" "}
                    {formatTime(event.endDate)}
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{event.venue}</div>
                      <div className="text-gray-600">{event.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center font-semibold">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  What's Included
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Full event access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Event materials & welcome package</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Networking opportunities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Certificate of attendance</span>
                  </div>
                  {isAlumni && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-blue-500" />
                        <span className="text-blue-600">Alumni badge & recognition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-blue-500" />
                        <span className="text-blue-600">Priority seating</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-blue-500" />
                        <span className="text-blue-600">Alumni networking sessions</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-12">
            <Mail className="mr-2 h-4 w-4" />
            Resend Confirmation
          </Button>
          <Button variant="outline" className="h-12">
            <Download className="mr-2 h-4 w-4" />
            Download Ticket
          </Button>
          <Button variant="outline" className="h-12">
            <Share2 className="mr-2 h-4 w-4" />
            Share Event
          </Button>
          <Button
            className="h-12 bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/dashboard")}
          >
            View Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Next Steps */}
        <Card className="border border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg">What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                  1
                </div>
                <div>
                  <div className="font-medium">Check Your Email</div>
                  <div className="text-gray-600">
                    We've sent a detailed confirmation email with your ticket and event information.
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                  2
                </div>
                <div>
                  <div className="font-medium">Add to Calendar</div>
                  <div className="text-gray-600">
                    Save the event dates to your calendar so you don't miss it.
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                  3
                </div>
                <div>
                  <div className="font-medium">Stay Updated</div>
                  <div className="text-gray-600">
                    Follow event updates and announcements through your dashboard and email.
                  </div>
                </div>
              </div>
              {isAlumni && (
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                    4
                  </div>
                  <div>
                    <div className="font-medium">Connect with Alumni</div>
                    <div className="text-gray-600">
                      Access the alumni directory to reconnect with classmates before the event.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need help or have questions?
            <Button variant="link" className="ml-1 p-0 text-blue-600">
              Contact Support
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
