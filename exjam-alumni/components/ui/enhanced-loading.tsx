"use client";

import React from "react";

// Skeleton loading components
export const SkeletonLine: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
);

export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = "",
}) => (
  <div className={`animate-pulse space-y-4 rounded-lg border p-4 ${className}`}>
    <div className="space-y-3">
      <SkeletonLine className="h-4 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={`h-3 ${i === lines - 1 ? "w-1/2" : "w-full"}`} />
      ))}
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="animate-pulse space-y-4">
    {/* Table header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonLine key={i} className="h-4 w-24" />
      ))}
    </div>
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, colIndex) => (
          <SkeletonLine key={colIndex} className="h-4" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <SkeletonLine className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// Loading spinner with customizable size and color
export const LoadingSpinner: React.FC<{
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}> = ({ size = "md", color = "text-blue-600", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${color} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Full page loading overlay
export const LoadingOverlay: React.FC<{
  message?: string;
  transparent?: boolean;
}> = ({ message = "Loading...", transparent = false }) => (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center ${
      transparent ? "bg-white/80" : "bg-gray-900/50"
    } backdrop-blur-sm`}
  >
    <div className="flex flex-col items-center space-y-4 rounded-lg bg-white px-8 py-6 shadow-lg">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Button loading state
export const LoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}> = ({
  loading,
  children,
  loadingText = "Loading...",
  disabled,
  className = "",
  onClick,
  type = "button",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={loading || disabled}
    className={`inline-flex items-center justify-center space-x-2 ${className} ${
      loading || disabled ? "cursor-not-allowed opacity-50" : ""
    }`}
  >
    {loading && <LoadingSpinner size="sm" color="text-current" />}
    <span>{loading ? loadingText : children}</span>
  </button>
);

// Progress bar component
export const ProgressBar: React.FC<{
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}> = ({ progress, label, showPercentage = true, color = "blue", size = "md", animated = true }) => {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-600",
    yellow: "bg-yellow-600",
    purple: "bg-purple-600",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="mb-2 flex justify-between">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full rounded-full bg-gray-200 ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-full ${colorClasses[color]} ${
            animated ? "transition-all duration-300 ease-out" : ""
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// Pulser for real-time updates
export const LiveIndicator: React.FC<{
  active?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}> = ({ active = true, label = "Live", size = "md" }) => {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`rounded-full ${sizeClasses[size]} ${
          active ? "animate-pulse bg-green-500" : "bg-gray-400"
        }`}
      />
      {label && (
        <span className={`text-sm font-medium ${active ? "text-green-600" : "text-gray-500"}`}>
          {label}
        </span>
      )}
    </div>
  );
};

// Content state handlers
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="mb-4">{icon}</div>}
    <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
    {description && <p className="mb-4 max-w-sm text-gray-500">{description}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        {action.label}
      </button>
    )}
  </div>
);

// Error state component
export const ErrorState: React.FC<{
  title?: string;
  message: string;
  retry?: () => void;
  showDetails?: boolean;
  error?: Error;
}> = ({ title = "Something went wrong", message, retry, showDetails = false, error }) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-red-100 p-3">
        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mb-4 max-w-sm text-gray-600">{message}</p>

      <div className="flex flex-col space-y-2">
        {retry && (
          <button
            onClick={retry}
            className="inline-flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Try Again</span>
          </button>
        )}

        {showDetails && error && (
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            {showErrorDetails ? "Hide" : "Show"} Details
          </button>
        )}
      </div>

      {showErrorDetails && error && (
        <div className="mt-4 max-w-md rounded-md bg-gray-50 p-4 text-left">
          <pre className="overflow-auto text-xs text-gray-600">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </div>
      )}
    </div>
  );
};
