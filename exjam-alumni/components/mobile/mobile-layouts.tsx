"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useDeviceDetection, useSafeArea, useOrientationChange } from "@/lib/mobile-optimization";
import { useAccessibility, useFocusManagement } from "@/lib/accessibility";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mobile-first responsive container
export const MobileContainer = ({
  children,
  className,
  padding = "default",
  maxWidth = "none",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "small" | "default" | "large";
  maxWidth?: "none" | "sm" | "md" | "lg" | "xl";
}) => {
  const { isMobile, isTablet } = useDeviceDetection();
  const { safeAreaInsets } = useSafeArea();

  const paddingClasses = {
    none: "p-0",
    small: "p-2",
    default: "p-4",
    large: "p-6",
  };

  const maxWidthClasses = {
    none: "",
    sm: "max-w-sm mx-auto",
    md: "max-w-md mx-auto",
    lg: "max-w-lg mx-auto",
    xl: "max-w-xl mx-auto",
  };

  return (
    <div
      className={cn(
        "w-full",
        paddingClasses[padding],
        maxWidthClasses[maxWidth],
        isMobile && "min-h-screen",
        className
      )}
      style={{
        paddingTop: isMobile ? safeAreaInsets.top : undefined,
        paddingBottom: isMobile ? safeAreaInsets.bottom : undefined,
        paddingLeft: isMobile ? safeAreaInsets.left : undefined,
        paddingRight: isMobile ? safeAreaInsets.right : undefined,
      }}
    >
      {children}
    </div>
  );
};

// Mobile-optimized header with proper safe areas
export const MobileHeader = ({
  title,
  leftAction,
  rightAction,
  subtitle,
  className,
  sticky = true,
}: {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  subtitle?: string;
  className?: string;
  sticky?: boolean;
}) => {
  const { isMobile } = useDeviceDetection();
  const { safeAreaInsets } = useSafeArea();

  return (
    <header
      className={cn(
        "z-40 w-full border-b border-border bg-background",
        sticky && "sticky top-0",
        className
      )}
      style={{
        paddingTop: isMobile ? safeAreaInsets.top : 0,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {leftAction}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
};

// Mobile-optimized grid layout
export const MobileGrid = ({
  children,
  columns = "auto",
  gap = "default",
  className,
}: {
  children: React.ReactNode;
  columns?: "auto" | 1 | 2 | 3;
  gap?: "small" | "default" | "large";
  className?: string;
}) => {
  const { isMobile, isTablet } = useDeviceDetection();

  const getColumns = () => {
    if (columns === "auto") {
      return isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-3";
    }
    return `grid-cols-${columns}`;
  };

  const gapClasses = {
    small: "gap-2",
    default: "gap-4",
    large: "gap-6",
  };

  return (
    <div className={cn("grid w-full", getColumns(), gapClasses[gap], className)}>{children}</div>
  );
};

// Mobile-optimized form layout
export const MobileForm = ({
  children,
  onSubmit,
  className,
  title,
  description,
}: {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  title?: string;
  description?: string;
}) => {
  const { isMobile } = useDeviceDetection();
  const { setupKeyboardNavigation } = useAccessibility();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      setupKeyboardNavigation(formRef.current);
    }
  }, [setupKeyboardNavigation]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={cn("w-full space-y-6", isMobile && "space-y-4", className)}
      noValidate
    >
      {(title || description) && (
        <div className="space-y-2">
          {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className={cn("space-y-4", isMobile && "space-y-3")}>{children}</div>
    </form>
  );
};

// Mobile-optimized stack layout
export const MobileStack = ({
  children,
  spacing = "default",
  align = "stretch",
  className,
}: {
  children: React.ReactNode;
  spacing?: "tight" | "default" | "loose";
  align?: "start" | "center" | "end" | "stretch";
  className?: string;
}) => {
  const spacingClasses = {
    tight: "space-y-2",
    default: "space-y-4",
    loose: "space-y-6",
  };

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        spacingClasses[spacing],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

// Mobile-optimized action sheet
export const MobileActionSheet = ({
  isOpen,
  onClose,
  title,
  actions,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive";
    icon?: React.ReactNode;
  }>;
  className?: string;
}) => {
  const { isMobile } = useDeviceDetection();
  const { safeAreaInsets } = useSafeArea();
  const { trapFocus, releaseFocus } = useFocusManagement();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (sheetRef.current) {
        trapFocus(sheetRef.current);
      }
      document.body.style.overflow = "hidden";
    } else {
      releaseFocus();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      releaseFocus();
    };
  }, [isOpen, trapFocus, releaseFocus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Action Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full rounded-t-2xl bg-background shadow-xl",
          "transform transition-all duration-300 ease-out",
          isMobile ? "mx-0" : "mx-4 max-w-sm",
          className
        )}
        style={{
          paddingBottom: isMobile ? safeAreaInsets.bottom : 0,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Action menu"}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-6 pb-2">
            <h3 className="text-center text-lg font-semibold text-foreground">{title}</h3>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-6">
          <div className="space-y-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant === "destructive" ? "destructive" : "ghost"}
                className={cn(
                  "h-12 w-full justify-start text-base",
                  action.variant === "destructive" && "text-destructive"
                )}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
              >
                {action.icon && <span className="mr-3">{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>

          {/* Cancel button */}
          <Button variant="outline" className="mt-4 h-12 w-full text-base" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized tabs
export const MobileTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}: {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) => {
  const { isMobile } = useDeviceDetection();
  const tabsRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("w-full", className)}>
      {/* Tab Navigation */}
      <div
        ref={tabsRef}
        className={cn(
          "flex border-b border-border",
          isMobile ? "scrollbar-hide overflow-x-auto" : "flex-wrap"
        )}
        role="tablist"
        aria-label="Tab navigation"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              "whitespace-nowrap border-b-2 border-transparent",
              "hover:border-muted-foreground hover:text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              activeTab === tab.id ? "border-primary text-primary" : "text-muted-foreground",
              isMobile && "min-w-[120px] justify-center"
            )}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`tabpanel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            tabIndex={0}
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

// Mobile-optimized card list
export const MobileCardList = ({
  items,
  renderCard,
  onItemClick,
  emptyMessage = "No items found",
  className,
}: {
  items: any[];
  renderCard: (item: any, index: number) => React.ReactNode;
  onItemClick?: (item: any, index: number) => void;
  emptyMessage?: string;
  className?: string;
}) => {
  const { isMobile } = useDeviceDetection();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-4xl">📭</div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", isMobile && "space-y-2", className)}>
      {items.map((item, index) => (
        <Card
          key={index}
          className={cn(
            "transition-all duration-200",
            onItemClick && [
              "cursor-pointer hover:shadow-md",
              isMobile && "active:scale-[0.98] active:opacity-90",
            ]
          )}
          onClick={() => onItemClick?.(item, index)}
          tabIndex={onItemClick ? 0 : undefined}
          role={onItemClick ? "button" : undefined}
          onKeyDown={(e) => {
            if (onItemClick && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onItemClick(item, index);
            }
          }}
        >
          {renderCard(item, index)}
        </Card>
      ))}
    </div>
  );
};
