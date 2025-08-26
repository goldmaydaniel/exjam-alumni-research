"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
  onStrengthChange?: (strength: number) => void;
}

interface Requirement {
  regex: RegExp;
  text: string;
  met: boolean;
}

export function PasswordStrength({ 
  password, 
  showRequirements = true,
  onStrengthChange 
}: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  useEffect(() => {
    const reqs: Requirement[] = [
      {
        regex: /.{8,}/,
        text: "At least 8 characters",
        met: false,
      },
      {
        regex: /[A-Z]/,
        text: "One uppercase letter",
        met: false,
      },
      {
        regex: /[a-z]/,
        text: "One lowercase letter",
        met: false,
      },
      {
        regex: /[0-9]/,
        text: "One number",
        met: false,
      },
      {
        regex: /[^A-Za-z0-9]/,
        text: "One special character",
        met: false,
      },
    ];

    let score = 0;
    reqs.forEach((req) => {
      if (req.regex.test(password)) {
        req.met = true;
        score++;
      }
    });

    // Additional strength bonuses
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    
    // Check for common patterns (weak)
    if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
      score = Math.max(1, score - 2);
    }

    // Check for sequential characters
    if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def/.test(password.toLowerCase())) {
      score = Math.max(1, score - 1);
    }

    const strengthPercentage = Math.min(100, (score / 5) * 100);
    setStrength(strengthPercentage);
    setRequirements(reqs);
    
    if (onStrengthChange) {
      onStrengthChange(strengthPercentage);
    }
  }, [password, onStrengthChange]);

  const getStrengthLabel = () => {
    if (strength === 0) return { label: "No password", color: "bg-gray-200" };
    if (strength < 25) return { label: "Very Weak", color: "bg-red-500" };
    if (strength < 50) return { label: "Weak", color: "bg-orange-500" };
    if (strength < 75) return { label: "Fair", color: "bg-yellow-500" };
    if (strength < 100) return { label: "Good", color: "bg-blue-500" };
    return { label: "Strong", color: "bg-green-500" };
  };

  const { label, color } = getStrengthLabel();

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Password strength</span>
          <span className={cn(
            "font-medium",
            strength >= 75 ? "text-green-600" : 
            strength >= 50 ? "text-yellow-600" : 
            "text-red-600"
          )}>
            {label}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 ease-out rounded-full",
              color
            )}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <AlertCircle className="h-3 w-3" />
            <span className="font-medium">Password must contain:</span>
          </div>
          <div className="grid gap-1.5">
            {requirements.map((req, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center gap-2 text-xs transition-all duration-200",
                  req.met ? "text-green-700" : "text-gray-500"
                )}
              >
                {req.met ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-gray-400" />
                )}
                <span className={cn(
                  "transition-all duration-200",
                  req.met && "font-medium"
                )}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Tips */}
      {strength >= 75 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs text-green-800">
              <span className="font-medium">Great password!</span>
              <p className="mt-1 text-green-700">
                Consider using a password manager to securely store this password.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}