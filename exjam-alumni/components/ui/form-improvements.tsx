"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { AccessibleField, AccessibleProgress } from "@/components/ui/accessibility";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Info, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Password strength indicator
interface PasswordStrengthProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
}

export function PasswordStrengthIndicator({ password, onStrengthChange }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    const calculateStrength = () => {
      let score = 0;
      const checks = [];

      if (password.length >= 8) {
        score += 1;
        checks.push("At least 8 characters");
      } else {
        checks.push("At least 8 characters (missing)");
      }

      if (/[a-z]/.test(password)) {
        score += 1;
        checks.push("Lowercase letter");
      } else {
        checks.push("Lowercase letter (missing)");
      }

      if (/[A-Z]/.test(password)) {
        score += 1;
        checks.push("Uppercase letter");
      } else {
        checks.push("Uppercase letter (missing)");
      }

      if (/\d/.test(password)) {
        score += 1;
        checks.push("Number");
      } else {
        checks.push("Number (missing)");
      }

      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 1;
        checks.push("Special character");
      } else {
        checks.push("Special character (missing)");
      }

      setStrength(score);
      setFeedback(checks);
      onStrengthChange?.(score);
    };

    calculateStrength();
  }, [password, onStrengthChange]);

  const getStrengthColor = () => {
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Good";
    return "Strong";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Password strength</span>
        <span
          className={cn(
            "font-medium",
            strength <= 2
              ? "text-red-600"
              : strength <= 3
                ? "text-yellow-600"
                : strength <= 4
                  ? "text-blue-600"
                  : "text-green-600"
          )}
        >
          {getStrengthText()}
        </span>
      </div>

      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              i < strength ? getStrengthColor() : "bg-gray-200"
            )}
          />
        ))}
      </div>

      <div className="space-y-1">
        {feedback.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {check.includes("missing") ? (
              <AlertCircle className="h-3 w-3 text-gray-400" />
            ) : (
              <CheckCircle className="h-3 w-3 text-green-500" />
            )}
            <span className={check.includes("missing") ? "text-gray-500" : "text-green-600"}>
              {check.replace(" (missing)", "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Real-time email validation
interface EmailValidationProps {
  email: string;
  onValidationChange?: (isValid: boolean) => void;
}

export function EmailValidation({ email, onValidationChange }: EmailValidationProps) {
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email) {
      setStatus("idle");
      setMessage("");
      onValidationChange?.(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setStatus("invalid");
      setMessage("Please enter a valid email address");
      onValidationChange?.(false);
      return;
    }

    setStatus("valid");
    setMessage("Email format is valid");
    onValidationChange?.(true);
  }, [email, onValidationChange]);

  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        status === "valid" ? "text-green-600" : "text-red-600"
      )}
    >
      {status === "valid" ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span>{message}</span>
    </div>
  );
}

// Form progress indicator
interface FormProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function FormProgress({ steps, currentStep, className }: FormProgressProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Progress</span>
        <span className="text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>

      <AccessibleProgress
        value={currentStep + 1}
        max={steps.length}
        label="Form completion progress"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        {steps.map((step, index) => (
          <span
            key={index}
            className={cn(
              "max-w-20 truncate",
              index <= currentStep ? "font-medium text-primary" : ""
            )}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

// Smart form field with auto-suggestions
interface SmartFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  suggestions?: string[];
  required?: boolean;
  error?: string;
  helperText?: string;
}

export function SmartField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  suggestions = [],
  required,
  error,
  helperText,
}: SmartFieldProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(value.toLowerCase()) && suggestion !== value
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, suggestions]);

  return (
    <div className="relative">
      <AccessibleField
        id={id}
        label={label}
        required={required}
        error={error}
        helperText={helperText}
      >
        <EnhancedInput
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          error={error}
          onFocus={() => value && setShowSuggestions(filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
      </AccessibleField>

      {showSuggestions && (
        <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50"
              onMouseDown={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Form validation summary
interface ValidationSummaryProps {
  errors: { [key: string]: string };
  className?: string;
}

export function ValidationSummary({ errors, className }: ValidationSummaryProps) {
  const errorCount = Object.keys(errors).length;

  if (errorCount === 0) return null;

  return (
    <Card className={cn("border-red-200 bg-red-50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          Please fix the following {errorCount} error{errorCount !== 1 ? "s" : ""}:
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1 text-sm text-red-700">
          {Object.entries(errors).map(([field, error]) => (
            <li key={field} className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              <span className="capitalize">
                {field.replace(/([A-Z])/g, " $1").trim()}: {error}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Save draft functionality
export function useDraftSave(formData: any, key: string) {
  useEffect(() => {
    const draftKey = `draft_${key}`;

    // Save draft on form data change
    const timeoutId = setTimeout(() => {
      if (Object.values(formData).some((value) => value)) {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            data: formData,
            timestamp: Date.now(),
          })
        );
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData, key]);

  const loadDraft = () => {
    try {
      const draftKey = `draft_${key}`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const { data, timestamp } = JSON.parse(draft);
        // Only load drafts from the last 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
        localStorage.removeItem(draftKey);
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
    return null;
  };

  const clearDraft = () => {
    const draftKey = `draft_${key}`;
    localStorage.removeItem(draftKey);
  };

  return { loadDraft, clearDraft };
}
