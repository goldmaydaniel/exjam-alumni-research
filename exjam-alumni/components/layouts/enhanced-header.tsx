"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Database,
  Calendar,
  Users,
  ChevronDown,
  Settings,
  BarChart3,
  Bell,
  Shield,
  Ticket,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/store/consolidated-auth";

const navigation = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Alumni",
    href: "/alumni",
  },
  {
    name: "Events",
    href: "/events",
  },
  {
    name: "Contact",
    href: "/contact",
  },
];

export function EnhancedHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, signOut, isLoading, initialize } = useAuth();

  const isAdmin = user?.role === "ADMIN" || user?.role === "ORGANIZER";

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName[0] || ""}${lastName[0] || "U"}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 shadow-sm backdrop-blur-lg">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 shadow-lg transition-transform group-hover:scale-110">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="flex h-full items-center justify-center">
                  <span className="text-lg font-bold text-white">EX</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-lg font-bold text-transparent">
                  The EXJAM Association
                </h1>
                <p className="text-xs italic text-muted-foreground">Strive to Excel</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Clean typography approach */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative px-1 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-blue-700"
                      : "text-gray-700 hover:text-gray-900"
                  )}
                >
                  {item.name}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section - User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {isAuthenticated ? (
              <>
                {/* Admin Quick Actions */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Admin Tools</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/admin")}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/admin/events")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Manage Events
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/admin/analytics")}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/admin/checkin")}>
                        <Ticket className="mr-2 h-4 w-4" />
                        Check-in System
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/admin/supabase")}>
                        <Database className="mr-2 h-4 w-4" />
                        Database Console
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src="/placeholder-avatar.jpg"
                          alt={user?.firstName || "User"}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        {user?.role && (
                          <Badge variant="secondary" className="mt-1 w-fit">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard#settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                  asChild
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile menu - Clean approach */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "block px-3 py-3 text-base font-medium rounded-lg",
                      isActive
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}

              <div className="space-y-1 border-t pt-4">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="h-5 w-5" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-base font-medium text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Users className="h-5 w-5" />
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
