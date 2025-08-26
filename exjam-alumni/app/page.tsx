"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Users,
  Shield,
  Calendar,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  GraduationCap,
  Globe,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";

// Event interface
interface Event {
  id: string;
  title: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  venue: string;
  price: number;
  earlyBirdPrice?: number;
  imageUrl?: string;
  status: string;
}

// Animated counter component
function AnimatedCounter({
  target,
  duration = 2000,
  suffix = "",
}: {
  target: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    requestAnimationFrame(animateCount);
  }, [target, duration]);

  return (
    <>
      {count}
      {suffix}
    </>
  );
}

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch("/api/events?limit=3&status=PUBLISHED");
      if (response.ok) {
        const data = await response.json();
        setUpcomingEvents(data.events || []);
      }
    } catch (error) {
      console.log("Could not fetch events for homepage");
    } finally {
      setEventsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Simplified Hero Section */}
      <section className="relative flex min-h-[80vh] items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="container relative z-10">
          <div
            className={`mx-auto max-w-4xl transform text-center transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            {/* Main Title - Cleaner */}
            <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
              The ExJAM Association
            </h1>
            <p className="mb-8 text-2xl font-semibold text-blue-600">
              President General's Conference
            </p>

            {/* Event Details - Minimal */}
            <div className="mb-10 flex flex-col items-center justify-center gap-2 text-gray-600 md:flex-row md:gap-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>NAF Conference Centre, Abuja</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>November 28-30, 2025</span>
              </div>
            </div>

            {/* CTA Buttons - Simplified */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/events">
                <Button
                  size="lg"
                  className="bg-blue-600 px-8 py-6 text-base font-semibold hover:bg-blue-700"
                >
                  Register for Conference
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 px-8 py-6 text-base font-semibold"
                >
                  Join Alumni
                </Button>
              </Link>
            </div>

            {/* Tagline */}
            <p className="mt-8 text-sm font-medium text-gray-500">
              Strive to Excel • Air Force Military School Jos Alumni
            </p>
          </div>
        </div>
      </section>

      {/* Minimalist Stats Section */}
      <section className="border-y bg-white py-20">
        <div className="container">
          <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-1 text-4xl font-bold text-gray-900">
                <AnimatedCounter target={3794} suffix="+" />
              </div>
              <p className="text-sm text-gray-600">Alumni Graduates</p>
            </div>
            <div className="text-center">
              <div className="mb-1 text-4xl font-bold text-gray-900">
                <AnimatedCounter target={45} />
              </div>
              <p className="text-sm text-gray-600">Years Active</p>
            </div>
            <div className="text-center">
              <div className="mb-1 text-4xl font-bold text-gray-900">
                <AnimatedCounter target={4} />
              </div>
              <p className="text-sm text-gray-600">Squadrons</p>
            </div>
            <div className="text-center">
              <div className="mb-1 text-4xl font-bold text-gray-900">
                <AnimatedCounter target={15} suffix="+" />
              </div>
              <p className="text-sm text-gray-600">Countries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="bg-white py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Join fellow alumni at exclusive events and networking opportunities
            </p>
          </div>

          {eventsLoading ? (
            <div className="grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <Card key={event.id} className="border-0 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.shortDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        ₦{event.earlyBirdPrice?.toLocaleString() || event.price.toLocaleString()}
                      </span>
                      {event.earlyBirdPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ₦{event.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Link href={`/events/${event.id}`}>
                      <Button className="w-full">
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Events Coming Soon</h3>
              <p className="text-gray-600 mb-6">We're planning exciting events for our alumni community.</p>
              <Link href="/events">
                <Button variant="outline">View All Events</Button>
              </Link>
            </div>
          )}

          {upcomingEvents.length > 0 && (
            <div className="mt-12 text-center">
              <Link href="/events">
                <Button variant="outline" size="lg">
                  View All Events
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Alumni Benefits */}
      <section className="bg-gray-50 py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Alumni Benefits</h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Connect with fellow graduates and discover opportunities
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {/* Alumni Directory */}
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Alumni Network</CardTitle>
                <CardDescription>Connect with fellow alumni</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Search by squadron & set
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Professional profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Global connections
                  </li>
                </ul>
                <Link href="/alumni" className="mt-6 block">
                  <Button variant="ghost" className="w-full">
                    Browse Directory →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Membership */}
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Membership</CardTitle>
                <CardDescription>Official alumni verification</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Alumni verification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Events access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Chapter participation
                  </li>
                </ul>
                <Link href="/membership" className="mt-6 block">
                  <Button variant="ghost" className="w-full">
                    Learn More →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Events */}
            <Card className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Events</CardTitle>
                <CardDescription>Reunions and networking</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Annual conferences
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Squadron meetups
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Career opportunities
                  </li>
                </ul>
                <Link href="/events" className="mt-6 block">
                  <Button variant="ghost" className="w-full">
                    View Events →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Simple Testimonial */}
      <section className="bg-white py-24">
        <div className="container max-w-4xl">
          <blockquote className="text-center">
            <p className="mb-6 text-xl italic text-gray-700">
              "AFMS Jos shaped me into the leader I am today. The discipline and excellence
              instilled here has been my compass throughout my career."
            </p>
            <footer className="text-sm text-gray-600">
              <strong>Wing Commander (Rtd) James O.</strong> • Set 1985 • Red Squadron
            </footer>
          </blockquote>
        </div>
      </section>

      {/* About Section - Minimal */}
      <section className="bg-gray-50 py-24">
        <div className="container max-w-4xl">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-blue-600">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Est. 1980</span>
            </div>
            <h2 className="mb-6 text-3xl font-bold text-gray-900">Air Force Military School Jos</h2>
            <p className="leading-relaxed text-gray-600">
              For over four decades, AFMS Jos has been nurturing excellence in young minds,
              producing leaders across military service, business, academia, and public service. The
              EXJAM Association connects these graduates, fostering lifelong bonds and networks
              across six squadrons worldwide.
            </p>
          </div>

          {/* Core Values - Simple Grid */}
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <Shield className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="text-sm font-semibold text-gray-700">Discipline</p>
            </div>
            <div className="text-center">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="text-sm font-semibold text-gray-700">Excellence</p>
            </div>
            <div className="text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="text-sm font-semibold text-gray-700">Brotherhood</p>
            </div>
            <div className="text-center">
              <Globe className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="text-sm font-semibold text-gray-700">Leadership</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Clean */}
      <section className="bg-blue-900 py-24 text-white">
        <div className="container max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Join The EXJAM Family</h2>
          <p className="mx-auto mb-10 max-w-2xl text-blue-100">
            Whether you're an AFMS graduate or supporter, there's a place for you in our community.
          </p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/events">
              <Button size="lg" className="bg-white px-8 py-6 text-blue-900 hover:bg-gray-100">
                Register for PG Conference
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="border-white px-8 py-6 text-white hover:bg-white/10"
              >
                Create Account
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200">
            <a href="mailto:info@exjam.org.ng" className="flex items-center gap-2 hover:text-white">
              <Mail className="h-4 w-4" />
              info@exjam.org.ng
            </a>
            <a href="tel:+2349012345678" className="flex items-center gap-2 hover:text-white">
              <Phone className="h-4 w-4" />
              +234 901 234 5678
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
