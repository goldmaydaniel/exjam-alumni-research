"use client";

import Link from "next/link";
import Image from "next/image";

export function BasicHeader() {
  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-2 text-white">
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm">
            <span>✨</span>
            <span className="font-semibold">PG Conference 2025</span>

          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>📅 Nov 28-30, 2025</span>
            <span>📍 Abuja</span>
            <a
              href="/register"
              className="rounded bg-white px-3 py-1 text-xs font-medium text-blue-600"
            >
              Register Now
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b bg-white bg-opacity-95 shadow-sm backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src="https://yzrzjagkkycmdwuhrvww.supabase.co/storage/v1/object/public/event-photos/logo/exjam-logo.png"
                  alt="The EXJAM Association Logo"
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-xl shadow-lg"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-black text-transparent">
                  EXJAM Association
                </h1>
                <p className="text-xs italic text-gray-600">Strive to Excel</p>
              </div>
            </Link>

            <div className="hidden items-center gap-4 md:flex">
              <a
                href="/"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600"
              >
                Home
              </a>
              <a
                href="/about"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600"
              >
                About
              </a>
              <a
                href="/alumni"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600"
              >
                Alumni
              </a>
              <a
                href="/events"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600"
              >
                Events
              </a>
              <a
                href="/contact"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600"
              >
                Contact
              </a>
              <a
                href="/events"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg"
              >
                🎫 View Events
              </a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
