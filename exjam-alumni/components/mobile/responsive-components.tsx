"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  useDeviceDetection,
  useTouchGestures,
  useViewportSize,
  useSafeArea,
  useOrientationChange,
} from "@/lib/mobile-optimization";
import {
  useAccessibility,
  useKeyboardNavigation,
  useFocusManagement,
  announce,
} from "@/lib/accessibility";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Mobile-optimized navigation component
export const MobileNavigation = ({
  items,
  currentPath,
  onNavigate,
}: {
  items: Array<{ path: string; label: string; icon?: React.ReactNode }>;
  currentPath: string;
  onNavigate: (path: string) => void;
}) => {
  const { isMobile } = useDeviceDetection();
  const { safeAreaInsets } = useSafeArea();
  const { setupKeyboardNavigation } = useKeyboardNavigation();

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navRef.current) {
      setupKeyboardNavigation(navRef.current);
    }
  }, [setupKeyboardNavigation]);

  if (!isMobile) return null;

  return (
    <nav
      ref={navRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border bg-background",
        "safe-area-inset-bottom"
      )}
      style={{ paddingBottom: safeAreaInsets.bottom }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item, index) => (
          <Button
            key={item.path}
            variant={currentPath === item.path ? "default" : "ghost"}
            size="sm"
            className={cn(
              "flex h-auto flex-1 flex-col items-center gap-1 py-2",
              "min-w-0 max-w-20 text-xs",
              "focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
            onClick={() => onNavigate(item.path)}
            aria-current={currentPath === item.path ? "page" : undefined}
            tabIndex={0}
          >
            {item.icon}
            <span className="w-full truncate text-center">{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
};

// Mobile-optimized card component with touch gestures
export const MobileCard = ({
  children,
  onTap,
  onSwipeLeft,
  onSwipeRight,
  className,
  ...props
}: {
  children: React.ReactNode;
  onTap?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
} & React.ComponentProps<typeof Card>) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTouchDevice } = useDeviceDetection();

  const { handleTouchStart, handleTouchMove, handleTouchEnd, gestures } = useTouchGestures({
    onTap,
    onSwipeLeft,
    onSwipeRight,
    element: cardRef.current,
  });

  return (
    <Card
      ref={cardRef}
      className={cn(
        "transition-all duration-200",
        isMobile && "active:scale-[0.98] active:opacity-90",
        isTouchDevice && "cursor-pointer",
        gestures.isPressed && "scale-[0.98] opacity-90",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={isTouchDevice ? undefined : onTap}
      tabIndex={onTap ? 0 : undefined}
      role={onTap ? "button" : undefined}
      onKeyDown={(e) => {
        if (onTap && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onTap();
        }
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

// Mobile-optimized form input with better touch targets
export const MobileInput = React.forwardRef<
  HTMLInputElement,
  {
    label: string;
    error?: string;
    helpText?: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    className?: string;
  }
>(
  (
    {
      label,
      error,
      helpText,
      required,
      type = "text",
      placeholder,
      value,
      onChange,
      onFocus,
      onBlur,
      className,
      ...props
    },
    ref
  ) => {
    const { isMobile } = useDeviceDetection();
    const [isFocused, setIsFocused] = useState(false);
    const inputId = `mobile-input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helpId = helpText ? `${inputId}-help` : undefined;

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      onFocus?.();
      if (isMobile && error) {
        announce(error, "assertive");
      }
    }, [onFocus, isMobile, error]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      onBlur?.();
    }, [onBlur]);

    return (
      <div className={cn("space-y-2", className)}>
        <label
          htmlFor={inputId}
          className={cn(
            "block text-sm font-medium text-foreground",
            "cursor-pointer select-none",
            isFocused && "text-primary"
          )}
        >
          {label}
          {required && (
            <span className="ml-1 text-destructive" aria-label="required">
              *
            </span>
          )}
        </label>

        <Input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={cn(errorId && errorId, helpId && helpId).trim() || undefined}
          className={cn(
            "transition-all duration-200",
            isMobile && [
              "min-h-[48px] text-base", // Prevent zoom on iOS
              "focus:ring-2 focus:ring-primary focus:ring-offset-2",
            ],
            error && "border-destructive focus:border-destructive focus:ring-destructive",
            isFocused && "ring-2 ring-primary ring-offset-2"
          )}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="flex items-center gap-1 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <span className="inline-block h-4 w-4">⚠️</span>
            {error}
          </p>
        )}

        {helpText && (
          <p id={helpId} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);
MobileInput.displayName = "MobileInput";

// Mobile-optimized search component
export const MobileSearch = ({
  placeholder = "Search...",
  onSearch,
  onClear,
  suggestions = [],
  isLoading = false,
}: {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  suggestions?: string[];
  isLoading?: boolean;
}) => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { isMobile } = useDeviceDetection();
  const { setupKeyboardNavigation } = useKeyboardNavigation();

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchRef.current) {
      setupKeyboardNavigation(searchRef.current);
    }
  }, [setupKeyboardNavigation]);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      onSearch(value);
      setShowSuggestions(value.length > 0 && suggestions.length > 0);
    },
    [onSearch, suggestions.length]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setShowSuggestions(false);
    onSearch("");
    onClear?.();
    inputRef.current?.focus();
    announce("Search cleared", "polite");
  }, [onSearch, onClear]);

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      onSearch(suggestion);
      setShowSuggestions(false);
      announce(`Selected: ${suggestion}`, "polite");
    },
    [onSearch]
  );

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSuggestions(query.length > 0 && suggestions.length > 0)}
          className={cn("w-full pr-20", isMobile && "min-h-[48px] text-base")}
          aria-label="Search"
          autoComplete="off"
          role="searchbox"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}

          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-muted"
              aria-label="Clear search"
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full z-10 mt-1",
            "rounded-md border border-border bg-background shadow-lg",
            "max-h-60 overflow-y-auto"
          )}
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              className={cn(
                "w-full px-3 py-2 text-left text-sm",
                "hover:bg-muted focus:bg-muted focus:outline-none",
                "first:rounded-t-md last:rounded-b-md",
                isMobile && "flex min-h-[44px] items-center"
              )}
              onClick={() => selectSuggestion(suggestion)}
              role="option"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectSuggestion(suggestion);
                }
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Mobile-optimized list with pull-to-refresh
export const MobileList = ({
  items,
  renderItem,
  onRefresh,
  isRefreshing = false,
  emptyMessage = "No items found",
  className,
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  emptyMessage?: string;
  className?: string;
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshTriggered, setIsRefreshTriggered] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useDeviceDetection();

  const pullThreshold = 80;
  let startY = 0;
  let currentY = 0;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!onRefresh || !isMobile) return;
      startY = e.touches[0].clientY;
    },
    [onRefresh, isMobile]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!onRefresh || !isMobile || !listRef.current) return;

      currentY = e.touches[0].clientY;
      const scrollTop = listRef.current.scrollTop;

      if (scrollTop === 0 && currentY > startY) {
        const distance = Math.min(currentY - startY, pullThreshold * 1.5);
        setPullDistance(distance);

        if (distance >= pullThreshold && !isRefreshTriggered) {
          setIsRefreshTriggered(true);
          announce("Release to refresh", "polite");
        } else if (distance < pullThreshold && isRefreshTriggered) {
          setIsRefreshTriggered(false);
        }
      }
    },
    [onRefresh, isMobile, isRefreshTriggered, pullThreshold]
  );

  const handleTouchEnd = useCallback(() => {
    if (!onRefresh || !isMobile) return;

    if (isRefreshTriggered && pullDistance >= pullThreshold) {
      onRefresh();
      announce("Refreshing content", "polite");
    }

    setPullDistance(0);
    setIsRefreshTriggered(false);
  }, [onRefresh, isMobile, isRefreshTriggered, pullDistance, pullThreshold]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !isMobile) return;

    list.addEventListener("touchstart", handleTouchStart, { passive: true });
    list.addEventListener("touchmove", handleTouchMove, { passive: false });
    list.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      list.removeEventListener("touchstart", handleTouchStart);
      list.removeEventListener("touchmove", handleTouchMove);
      list.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isMobile]);

  return (
    <div
      ref={listRef}
      className={cn("relative overflow-y-auto", isMobile && "overscroll-y-none", className)}
      role="list"
      aria-label={`List with ${items.length} items`}
    >
      {/* Pull to refresh indicator */}
      {isMobile && onRefresh && (
        <div
          className={cn(
            "absolute left-0 right-0 top-0 flex items-center justify-center",
            "bg-background/90 backdrop-blur-sm transition-all duration-200",
            pullDistance > 0 ? "opacity-100" : "opacity-0"
          )}
          style={{
            height: Math.max(pullDistance, 0),
            transform: `translateY(-${Math.max(pullDistance - 40, 0)}px)`,
          }}
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isRefreshing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Refreshing...
              </>
            ) : isRefreshTriggered ? (
              <>
                <span>🔄</span>
                Release to refresh
              </>
            ) : (
              <>
                <span>⬇️</span>
                Pull to refresh
              </>
            )}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-4xl">📭</div>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} role="listitem">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Mobile-optimized modal/drawer
export const MobileDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  size = "default",
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "small" | "default" | "large";
}) => {
  const { isMobile } = useDeviceDetection();
  const { safeAreaInsets } = useSafeArea();
  const drawerRef = useRef<HTMLDivElement>(null);

  const { trapFocus, releaseFocus } = useFocusManagement();

  useEffect(() => {
    if (isOpen && drawerRef.current) {
      trapFocus(drawerRef.current);
      announce(`${title || "Dialog"} opened`, "polite");
    } else {
      releaseFocus();
    }

    return () => releaseFocus();
  }, [isOpen, title, trapFocus, releaseFocus]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const heightClass = {
    small: "h-1/3",
    default: "h-2/3",
    large: "h-5/6",
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "relative w-full rounded-t-2xl bg-background shadow-xl",
          "transform transition-all duration-300 ease-out",
          heightClass,
          isMobile ? "mx-0" : "mx-4 max-w-lg"
        )}
        style={{
          paddingBottom: isMobile ? safeAreaInsets.bottom : 0,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        {title && (
          <div className="border-b border-border px-6 pb-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4 h-8 w-8 p-0"
              aria-label="Close dialog"
            >
              ✕
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
