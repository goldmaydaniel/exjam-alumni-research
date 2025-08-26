"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/consolidated-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  FileText,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
  QrCode,
  ClipboardList,
  DollarSign,
  Bell,
  Database,
  Globe,
  UserCheck,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const sidebarItems = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Users",
    icon: Users,
    href: "/admin/users",
    badge: "new",
  },
  {
    title: "Events",
    icon: Calendar,
    href: "/admin/events",
  },
  {
    title: "Registrations",
    icon: ClipboardList,
    href: "/admin/registrations",
  },
  {
    title: "Check-In",
    icon: QrCode,
    href: "/admin/checkin",
  },
  {
    title: "Payments",
    icon: DollarSign,
    href: "/admin/payments",
  },
  {
    title: "Messages",
    icon: MessageSquare,
    href: "/admin/messages",
    badge: "3",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    title: "Waitlist",
    icon: UserCheck,
    href: "/admin/waitlist",
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/admin/notifications",
  },
  {
    title: "Site Config",
    icon: Globe,
    href: "/admin/site-config",
  },
  {
    title: "Storage",
    icon: Database,
    href: "/admin/storage",
  },
  {
    title: "Audit Logs",
    icon: History,
    href: "/admin/audit",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "ADMIN" && user?.role !== "ORGANIZER") {
      router.push("/dashboard");
      toast.error("Admin access required");
      return;
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "ORGANIZER")) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative flex flex-col border-r bg-white transition-all duration-300 dark:bg-gray-950",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="font-bold">Admin Panel</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                    collapsed && "justify-center"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Info */}
        <div className="border-t p-4">
          {collapsed ? (
            <div className="flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                {user?.firstName?.[0]}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                {user?.firstName?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
