"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./button";

export interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
  showCount?: boolean;
  maxLength?: number;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  (
    {
      className,
      type,
      error,
      success,
      loading,
      icon,
      helperText,
      showCount = false,
      maxLength,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const hasError = !!error;
    const hasSuccess = success && !hasError && !loading;

    const currentLength = props.value?.toString().length || 0;
    const isOverLimit = maxLength && currentLength > maxLength;

    return (
      <div className="space-y-2">
        <div className="relative">
          {/* Left icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}

          <input
            type={inputType}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              // Icon spacing
              icon && "pl-10",
              // Right icon spacing (status icons, password toggle)
              (isPassword || hasError || hasSuccess || loading) && "pr-10",
              // Error state
              hasError && "border-destructive focus-visible:ring-destructive",
              // Success state
              hasSuccess && "border-green-500 focus-visible:ring-green-500",
              // Loading state
              loading && "border-blue-500 focus-visible:ring-blue-500",
              // Focus state
              focused && "ring-2 ring-ring ring-offset-2",
              // Over limit state
              isOverLimit && "border-orange-500 focus-visible:ring-orange-500",
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            maxLength={maxLength}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {/* Loading */}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}

            {/* Success */}
            {hasSuccess && <Check className="h-4 w-4 text-green-500" />}

            {/* Error */}
            {hasError && <AlertCircle className="h-4 w-4 text-destructive" />}

            {/* Password toggle */}
            {isPassword && !loading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Helper text, error message, or character count */}
        <div className="flex min-h-[1.25rem] items-center justify-between">
          <div className="flex-1">
            {hasError ? (
              <p className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            ) : helperText ? (
              <p className="text-sm text-muted-foreground">{helperText}</p>
            ) : null}
          </div>

          {/* Character count */}
          {showCount && maxLength && (
            <p
              className={cn(
                "text-sm tabular-nums",
                isOverLimit
                  ? "text-orange-600"
                  : currentLength > maxLength * 0.8
                    ? "text-yellow-600"
                    : "text-muted-foreground"
              )}
            >
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
EnhancedInput.displayName = "EnhancedInput";

// Specialized input variants
export const SearchInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ placeholder = "Search...", ...props }, ref) => (
    <EnhancedInput
      type="search"
      placeholder={placeholder}
      icon={
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      ref={ref}
      {...props}
    />
  )
);
SearchInput.displayName = "SearchInput";

export const EmailInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ placeholder = "Enter your email", ...props }, ref) => (
    <EnhancedInput
      type="email"
      placeholder={placeholder}
      icon={
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      }
      ref={ref}
      {...props}
    />
  )
);
EmailInput.displayName = "EmailInput";

export { EnhancedInput };
