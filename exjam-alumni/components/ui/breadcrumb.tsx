"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {/* Home link */}
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center text-gray-500 transition-colors hover:text-gray-700"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="mx-2 h-4 w-4 text-gray-400" aria-hidden="true" />
            {item.current ? (
              <span className="font-medium text-gray-900" aria-current="page">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 transition-colors hover:text-gray-700"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-500">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Hook for generating breadcrumbs based on pathname
export function useBreadcrumbs(pathname: string, customItems?: BreadcrumbItem[]): BreadcrumbItem[] {
  return React.useMemo(() => {
    if (customItems) return customItems;

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      const isLast = i === segments.length - 1;

      // Convert segment to readable label
      let label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Handle special cases
      switch (segment) {
        case "dashboard":
          label = "Dashboard";
          break;
        case "admin":
          label = "Admin";
          break;
        case "alumni":
          label = "Alumni";
          break;
        case "profile":
          label = "Profile";
          break;
        case "events":
          label = "Events";
          break;
        case "users":
          label = "Users";
          break;
        case "registrations":
          label = "Registrations";
          break;
        case "checkin":
          label = "Check-in";
          break;
        case "site-config":
          label = "Site Configuration";
          break;
        case "waitlist":
          label = "Waitlist";
          break;
        case "performance":
          label = "Performance";
          break;
        case "settings":
          label = "Settings";
          break;
        case "directory":
          label = "Directory";
          break;
        case "connections":
          label = "Connections";
          break;
        case "badge":
          label = "Badge";
          break;
        case "payment":
          label = "Payment";
          break;
        case "new":
          label = "New";
          break;
        case "badges":
          label = "Badges";
          break;
        case "messages":
          label = "Messages";
          break;
      }

      // Skip adding href for UUID-like segments (dynamic routes)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        segment
      );

      breadcrumbs.push({
        label: isUuid ? "Details" : label,
        href: isLast || isUuid ? undefined : currentPath,
        current: isLast,
      });
    }

    return breadcrumbs;
  }, [pathname, customItems]);
}
