"use client";

import { SafeLink as Link } from "@/components/SafeLink";
import { useState, useEffect } from "react";
import { Menu, X, User, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/lib/store/consolidated-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function StableHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [daysToEvent, setDaysToEvent] = useState(0);
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  // Use default values directly since useSiteConfig might not be working
  const safeMainLogo = "/exjam-logo.svg";
  const safeSiteName = "The ExJAM Association";
  const safePrimaryColor = "#1e40af";
  const safeSecondaryColor = "#3b82f6";

  useEffect(() => {
    setIsMounted(true);
    // Calculate days to PG Conference 2025 (Nov 28, 2025)
    const eventDate = new Date("2025-11-28");
    const today = new Date();
    const timeDiff = eventDate.getTime() - today.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    setDaysToEvent(days > 0 ? days : 0);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/alumni", label: "Alumni" },
    { href: "/events", label: "Events" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  // Return a stable header structure to prevent hydration issues
  // Keep the same structure but conditionally show dynamic content
  const showDynamicContent = isMounted;
  const showAuthContent = isMounted && isAuthenticated;

  return (
    <>
      {/* Simple Event Banner */}
      <div className="bg-blue-900 py-2 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">PG Conference 2025 • Nov 28-30 • Abuja</span>
            <Link
              href="/events"
              className="rounded bg-white px-4 py-1 text-sm font-semibold text-blue-900 hover:bg-blue-50"
            >
              Register Now
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b bg-white bg-opacity-95 shadow-sm backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2" prefetch={false}>
              <Logo
                src={safeMainLogo}
                alt={`${safeSiteName} Logo`}
                width={40}
                height={40}
                className="rounded-lg"
                fallbackEmoji="🎓"
                priority={true}
              />
              <div className="block">
                <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                  {safeSiteName}
                </h1>
                <p className="hidden text-xs text-gray-500 sm:block">Strive to Excel</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-4 md:flex">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
              >
                Home
              </Link>
              <Link
                href="/events"
                className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
              >
                PG Conference
              </Link>
              <Link
                href="/alumni"
                className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
              >
                Alumni
              </Link>
              <Link
                href="/about"
                className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
              >
                Contact
              </Link>
              <div className="ml-4 flex gap-2">
                {showAuthContent && user ? (
                  <>
                    <Link
                      href="/events"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      Register for PG&apos;25
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.profilePhotoUrl} />
                            <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
                          </Avatar>
                          <span className="hidden sm:inline">
                            {user.firstName || user.email?.split("@")[0]}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" className="flex items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        {user.role === "ADMIN" && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="flex items-center">
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Admin</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="flex items-center text-red-600 focus:text-red-600"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sign Out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : isMounted ? (
                  <>
                    <Link
                      href="/events"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      Register
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                    >
                      Join
                    </Link>
                  </>
                ) : (
                  // Loading state - show basic buttons without auth state
                  <>
                    <Link
                      href="/events"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      Register
                    </Link>
                    <div className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400">
                      Loading...
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="space-y-1 pb-3 pt-2">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {showAuthContent && user ? (
                  <>
                    <div className="my-2 border-t border-gray-200"></div>
                    <Link
                      href="/dashboard"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="mr-2 inline h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="mr-2 inline h-4 w-4" />
                      Profile
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="mr-2 inline h-4 w-4" />
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="mr-2 inline h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="mx-3 mb-2 block rounded-md border border-gray-300 bg-white px-6 py-3 text-center text-base font-semibold text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="mx-3 block rounded-md bg-blue-600 px-6 py-3 text-center text-base font-semibold text-white hover:bg-blue-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Join
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
