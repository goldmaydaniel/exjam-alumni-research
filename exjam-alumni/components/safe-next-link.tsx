"use client";

import { useRouter } from "next/navigation";
import { ComponentPropsWithoutRef, MouseEvent, forwardRef } from "react";

type SafeNextLinkProps = ComponentPropsWithoutRef<"a"> & {
  prefetch?: boolean;
  scroll?: boolean;
};

export const SafeNextLink = forwardRef<HTMLAnchorElement, SafeNextLinkProps>(
  ({ href, onClick, children, prefetch = true, scroll = true, ...props }, ref) => {
    let router;

    try {
      router = useRouter();
    } catch (error) {
      // Router context not available - fallback to native links
      console.warn("Next.js router context not available, using native navigation");
      router = null;
    }

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      // If no router available, use native navigation
      if (!router) {
        return; // Let the browser handle the navigation
      }

      // Prevent default anchor behavior only if router is available
      e.preventDefault();

      // Call custom onClick if provided
      if (onClick) {
        onClick(e);
      }

      // Navigate using Next.js router
      if (href && typeof href === "string") {
        if (href.startsWith("http") || href.startsWith("mailto:")) {
          // External link
          window.location.href = href;
        } else {
          // Internal navigation
          try {
            router.push(href);
          } catch (routerError) {
            console.warn(
              "Router navigation failed, falling back to native navigation:",
              routerError
            );
            window.location.href = href;
          }
        }
      }
    };

    return (
      <a ref={ref} href={href} onClick={handleClick} {...props}>
        {children}
      </a>
    );
  }
);

SafeNextLink.displayName = "SafeNextLink";
