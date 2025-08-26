"use client";

import { forwardRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceNumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
  showValidation?: boolean;
}

export const ServiceNumberInput = forwardRef<HTMLInputElement, ServiceNumberInputProps>(
  ({ onValueChange, onChange, value, showValidation = true, className, ...props }, ref) => {
    const [inputValue, setInputValue] = useState(value || "AFMS ");
    const [isValid, setIsValid] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (value !== undefined) {
        setInputValue(value as string);
        setIsValid(validateServiceNumber(value as string));
      }
    }, [value]);

    const formatServiceNumber = (input: string): string => {
      // Keep AFMS prefix, allow digits and forward slash
      let cleaned = input.replace(/^AFMS\s?/, "");

      // Remove any characters that aren't digits or forward slash
      cleaned = cleaned.replace(/[^\d/]/g, "");

      // Auto-add slash after first 2 digits if not present and we have more than 2 digits
      if (cleaned.length >= 3 && !cleaned.includes("/")) {
        cleaned = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
      }

      // Limit total length (2 digits + slash + 4 digits = 7 characters max)
      cleaned = cleaned.slice(0, 7);

      return "AFMS " + cleaned;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatServiceNumber(e.target.value);
      setInputValue(formatted);
      setIsValid(validateServiceNumber(formatted));

      // Call the onValueChange callback if provided
      if (onValueChange) {
        onValueChange(formatted);
      }

      // Call the original onChange if provided
      if (onChange) {
        e.target.value = formatted;
        onChange(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent deletion of AFMS prefix with space
      const target = e.target as HTMLInputElement;
      if (e.key === "Backspace" && target.selectionStart && target.selectionStart <= 5) {
        e.preventDefault();
        // Move cursor to after "AFMS "
        target.setSelectionRange(5, 5);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Place cursor after "AFMS " if at the beginning
      if (e.target.selectionStart === 0) {
        e.target.setSelectionRange(5, 5);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            ref={ref}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="AFMS 00/0000"
            maxLength={12}
            className={cn(
              "pr-20 font-mono",
              isValid && inputValue.length > 5 && "border-green-500 focus:border-green-500",
              !isValid && inputValue.length > 5 && "border-red-500 focus:border-red-500",
              className
            )}
            {...props}
          />

          {/* Format hint */}
          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {showValidation && inputValue.length > 5 && (
              <div className="flex items-center">
                {isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
            {!isFocused && inputValue.length <= 5 && (
              <span className="font-mono text-xs text-muted-foreground">AFMS 00/0000</span>
            )}
          </div>
        </div>

        {/* Validation message */}
        {showValidation && inputValue.length > 5 && !isValid && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            Service number must be in format: AFMS 00/0000
          </p>
        )}

        {showValidation && isValid && (
          <p className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            Valid service number format
          </p>
        )}
      </div>
    );
  }
);

ServiceNumberInput.displayName = "ServiceNumberInput";

// Example usage with validation
export const validateServiceNumber = (value: string): boolean => {
  const pattern = /^AFMS\s\d{2}\/\d{4}$/;
  return pattern.test(value);
};

// Helper to extract parts
export const parseServiceNumber = (value: string) => {
  const match = value.match(/^AFMS\s(\d{2})\/(\d{4})$/);
  if (match) {
    return {
      prefix: "AFMS",
      firstPart: match[1],
      secondPart: match[2],
      full: value,
    };
  }
  return null;
};
