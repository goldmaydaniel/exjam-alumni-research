"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Skip to main content link
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-all duration-200 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
    >
      Skip to main content
    </a>
  );
}

// Screen reader only text
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return <span className={cn("sr-only", className)}>{children}</span>;
}

// Focus trap for modals and dropdowns
interface FocusTrapProps {
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
}

export function FocusTrap({ children, enabled = true, className }: FocusTrapProps) {
  useEffect(() => {
    if (!enabled) return;

    const focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const modal = document.querySelector('[role="dialog"], [role="alertdialog"]');
      if (!modal) return;

      const focusable = Array.from(modal.querySelectorAll(focusableElements)) as HTMLElement[];
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [enabled]);

  return <div className={className}>{children}</div>;
}

// Announcement for screen readers
interface AnnouncementProps {
  message: string;
  priority?: "polite" | "assertive";
}

export function Announcement({ message, priority = "polite" }: AnnouncementProps) {
  return (
    <div role="status" aria-live={priority} aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

// Loading announcement
export function LoadingAnnouncement({
  isLoading,
  loadingText = "Loading content, please wait...",
}: {
  isLoading: boolean;
  loadingText?: string;
}) {
  return isLoading ? <Announcement message={loadingText} /> : null;
}

// Error announcement
export function ErrorAnnouncement({
  error,
  errorText,
}: {
  error: string | null;
  errorText?: string;
}) {
  if (!error) return null;
  return <Announcement message={errorText || error} priority="assertive" />;
}

// High contrast mode detector and toggle
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check for user's preference
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setIsHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    document.documentElement.classList.toggle("high-contrast", newValue);
  };

  return { isHighContrast, toggleHighContrast };
}

// Reduced motion detector
export function useReducedMotion() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isReducedMotion;
}

// Accessible button with proper ARIA attributes
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AccessibleButton({
  children,
  isLoading = false,
  loadingText = "Loading...",
  disabled,
  className,
  ...props
}: AccessibleButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-describedby={isLoading ? "loading-text" : undefined}
      className={cn("focus-visible:ring-2 focus-visible:ring-offset-2", className)}
    >
      {isLoading ? (
        <>
          <span className="mr-2 animate-spin">⏳</span>
          <span id="loading-text">{loadingText}</span>
          <ScreenReaderOnly>Please wait</ScreenReaderOnly>
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// Accessible form field with proper labeling
interface AccessibleFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function AccessibleField({
  id,
  label,
  children,
  error,
  helperText,
  required = false,
}: AccessibleFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-label="required">
            *
          </span>
        )}
      </label>

      <div
        aria-describedby={describedBy}
        role={error ? "group" : undefined}
        aria-invalid={error ? "true" : undefined}
      >
        {children}
      </div>

      {helperText && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm font-medium text-destructive"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Progress indicator with proper ARIA attributes
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  className,
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span aria-label={`${percentage} percent complete`}>{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || "Progress"}
        className="h-2 w-full rounded-full bg-secondary"
      >
        <div
          className="h-2 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ScreenReaderOnly>Progress: {percentage}% complete</ScreenReaderOnly>
    </div>
  );
}

// Accessible modal with proper focus management
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: AccessibleModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const firstFocusable = document.querySelector(
        '[role="dialog"] input, [role="dialog"] button'
      ) as HTMLElement;
      firstFocusable?.focus();
    } else {
      document.body.style.overflow = "unset";
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <FocusTrap>
        <div className={cn("w-full max-w-md rounded-lg bg-white shadow-xl", className)}>
          <div className="flex items-center justify-between border-b p-4">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
              ✕
            </Button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </FocusTrap>
    </div>
  );
}
