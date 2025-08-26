"use client";

import Link from "next/link";

export default function EventsPage() {
  const pgEvent = {
    id: "pg-conference-2025",
    title: "President General's Conference - Maiden Flight",
    shortDescription:
      "Join PG Muhammed Sani Abdullahi for leadership training, entrepreneurship opportunities, networking, and community service.",
    startDate: "Nov 28, 2025",
    endDate: "Nov 30, 2025",
    venue: "NAF Conference Centre",
    address: "FCT, Abuja, Nigeria",
    price: 25000,
    capacity: 500,
    registrations: 0,
  };

  const spotsLeft = pgEvent.capacity - pgEvent.registrations;

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-24">
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-black tracking-tight text-white md:text-6xl">
              PG Conference
              <span className="block bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
                Maiden Flight 2025
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl font-light text-blue-100">
              Join President General Muhammed Sani Abdullahi for capacity building, leadership
              training, and community service.
            </p>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container">
          <div className="mb-16">
            <div className="mb-12 text-center">
              <span className="text-sm font-bold uppercase tracking-wider text-green-600">
                Open for Registration
              </span>
              <h2 className="mt-4 text-3xl font-black text-gray-900 md:text-4xl">Upcoming Event</h2>
            </div>

            <div className="mx-auto max-w-2xl">
              <div className="overflow-hidden rounded-xl bg-white shadow-lg">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl text-white/30">📅</div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="mb-2 text-xl font-bold">{pgEvent.title}</h3>
                  <p className="mb-4 text-gray-600">{pgEvent.shortDescription}</p>

                  <div className="mb-4 space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500">📅</span>
                      <span className="font-medium">
                        {pgEvent.startDate} - {pgEvent.endDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-500">📍</span>
                      <span className="font-medium">{pgEvent.venue}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-500">💰</span>
                      <span className="text-2xl font-bold">
                        ₦{pgEvent.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-purple-500">👥</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{spotsLeft} spots left</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/events/${pgEvent.id}`}
                      className="flex-1 rounded-lg border px-4 py-2 text-center font-semibold hover:bg-gray-50"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/events/${pgEvent.id}/register`}
                      className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-center font-semibold text-white hover:from-blue-700 hover:to-indigo-700"
                    >
                      Register Now →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900"></div>
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center text-white">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <span className="text-yellow-400">⏰</span>
              <span className="font-semibold">94 Days Countdown</span>
            </div>

            <h2 className="mb-6 text-3xl font-black md:text-5xl">
              Register for PG Conference 2025
            </h2>
            <p className="mb-10 text-xl text-blue-100">
              Join the President General's Maiden Flight conference. Limited seats available!
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={`/events/${pgEvent.id}/register`}
                className="inline-flex transform items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-6 text-lg font-bold text-black shadow-2xl transition-all hover:scale-105 hover:from-yellow-600 hover:to-orange-600"
              >
                Register for Conference →
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-6 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/20"
              >
                Back to Home ›
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
