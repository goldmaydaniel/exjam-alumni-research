"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SwipeCarousel, useResponsiveItemsPerView } from "@/components/ui/swipe-carousel";
import { EventCard } from "@/components/ui/event-card";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  Filter,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";


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

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all" | "past">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerView = useResponsiveItemsPerView();

  // Optimized fallback event with better imagery
  const fallbackEvent: Event = {
    id: "pg-conference-2025",
    title: "President General's Conference - Maiden Flight",
    shortDescription: "A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association",
    startDate: "2025-11-28T09:00:00.000Z",
    endDate: "2025-11-30T18:00:00.000Z",
    venue: "NAF Conference Centre, FCT, ABUJA",
    price: 20000,
    status: "PUBLISHED",
    tags: ["conference", "leadership", "networking", "alumni", "maiden-flight"],
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center"
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events?showPast=true&status=ALL");
      
      if (response.ok) {
        const data = await response.json();
        const allEvents = data.events || [];

        // Remove duplicates by ID and also by title to prevent fallback duplicates
        const uniqueEvents = allEvents.filter(
          (event: Event, index: number, self: Event[]) =>
            index === self.findIndex((e) => 
              e.id === event.id || 
              (e.title === event.title && e.startDate === event.startDate)
            )
        );

        // Also filter out any events that match our fallback event
        const filteredEvents = uniqueEvents.filter(event => 
          !(event.title === fallbackEvent.title && 
            event.startDate === fallbackEvent.startDate)
        );

        const now = new Date();

        // Split and sort events
        const upcoming = filteredEvents
          .filter((event: Event) => new Date(event.endDate) >= now && event.status !== "COMPLETED")
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        const past = filteredEvents
          .filter((event: Event) => new Date(event.endDate) < now || event.status === "COMPLETED")
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

        // Only use fallback if no upcoming events found
        setUpcomingEvents(upcoming.length === 0 ? [fallbackEvent] : upcoming);
        setPastEvents(past);
      } else {
        setUpcomingEvents([fallbackEvent]);
        setPastEvents([]);
      }
    } catch (error) {
      setUpcomingEvents([fallbackEvent]);
      setPastEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = (() => {
    // Ensure we don't have duplicates between upcoming and fallback
    const eventsWithFallback = upcomingEvents.length === 0 ? [fallbackEvent] : upcomingEvents;
    
    let events = filter === "upcoming" 
      ? eventsWithFallback 
      : filter === "past" 
        ? pastEvents 
        : [...eventsWithFallback, ...pastEvents];

    // Remove any duplicates that might still exist
    const uniqueEvents = events.filter(
      (event, index, self) =>
        index === self.findIndex((e) => 
          e.id === event.id || 
          (e.title === event.title && e.startDate === event.startDate)
        )
    );

    // Apply search filter
    if (searchQuery.trim()) {
      return uniqueEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return uniqueEvents;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto py-20">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-96 loading-shimmer rounded-2xl bg-white/60 shadow-lg event-card-hover" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section - Optimized Color Psychology */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 py-20">
        {/* Enhanced animated background elements with color psychology */}
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-96 w-96 translate-x-32 -translate-y-32 transform rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 blur-3xl floating-element" />
          <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-32 translate-y-32 transform rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 blur-3xl floating-element" style={{ animationDelay: '2s' }} />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-gradient-to-br from-pink-400 to-rose-500 opacity-10 blur-2xl floating-element" style={{ animationDelay: '4s' }} />
          <div className="absolute right-1/4 bottom-1/4 h-48 w-48 translate-x-16 translate-y-16 transform rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-15 blur-2xl floating-element" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            {/* Premium badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 backdrop-blur-md border border-white/20">
              <Star className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-white">Premium Alumni Events</span>
            </div>

            {/* Main heading with improved typography */}
            <h1 className="mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-5xl font-black tracking-tight text-transparent md:text-7xl">
              ExJAM Events
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-xl text-blue-100 leading-relaxed">
              Connect, celebrate, and create lasting memories with fellow Ex-Junior Airmen at our curated events
            </p>

            {/* Enhanced search and filter section */}
            <div className="mx-auto max-w-2xl space-y-4">
              {/* Enhanced search bar with better UX */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search events, venues, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full search-input-enhanced px-12 py-4 text-white placeholder-gray-300 backdrop-blur-md border border-white/20 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Enhanced filter tabs with better UX */}
              <div className="inline-flex gap-1 rounded-full bg-white/10 p-1 backdrop-blur-md border border-white/20">
                {[
                  { key: "upcoming", label: "Upcoming", icon: TrendingUp },
                  { key: "all", label: "All Events", icon: Calendar },
                  { key: "past", label: "Past Events", icon: Clock },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`filter-tab flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                      filter === key
                        ? "bg-white text-indigo-900 shadow-lg"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section - Streamlined Layout */}
      <section className="container mx-auto -mt-8 px-4 pb-20">
        {filteredEvents.length === 0 ? (
          <div className="rounded-3xl bg-white/80 p-20 text-center shadow-xl backdrop-blur-sm border border-white/20">
            <Users className="mx-auto mb-6 h-20 w-20 text-gray-300" />
            <h3 className="mb-3 text-2xl font-bold text-gray-900">No Events Found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or check back soon for upcoming events</p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setFilter("upcoming");
              }}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              View All Events
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Events Carousel - Only for upcoming */}
            {filter === "upcoming" && upcomingEvents.length > 0 && (
              <div>
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <Sparkles className="h-6 w-6 text-amber-500" />
                    <h2 className="text-3xl font-bold text-gray-900">Featured Events</h2>
                  </div>
                  <p className="text-gray-600">Discover our most anticipated upcoming gatherings</p>
                </div>
                
                <SwipeCarousel
                  itemsPerView={itemsPerView}
                  autoPlay={true}
                  autoPlayInterval={5000}
                  showArrows={true}
                  showDots={true}
                  className="mb-8"
                >
                  {upcomingEvents.slice(0, 6).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="featured"
                      showImage={true}
                      showPrice={true}
                      showDescription={true}
                    />
                  ))}
                </SwipeCarousel>
              </div>
            )}

            {/* All Events Grid */}
            <div>
              <div className="mb-8 text-center">
                <h2 className="mb-3 text-3xl font-bold text-gray-900">
                  {filter === "upcoming"
                    ? "All Upcoming Events"
                    : filter === "past"
                      ? "Past Events"
                      : "All Events"}
                </h2>
                <p className="text-gray-600">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>

              {/* Enhanced responsive grid layout */}
              <div className="events-grid">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="default"
                    showImage={true}
                    showPrice={true}
                    showDescription={true}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Enhanced CTA Section */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-4xl font-black text-white">Host Your Own Event</h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-blue-100 leading-relaxed">
              Organize reunions, workshops, or social events for the ExJAM community. 
              Let's create memorable experiences together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="btn-gradient-hover rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-4 transition-all duration-300"
              >
                <span className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Contact Event Team
                </span>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="rounded-full border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 transition-all duration-300"
              >
                <Calendar className="mr-2 h-5 w-5" />
                View Guidelines
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
