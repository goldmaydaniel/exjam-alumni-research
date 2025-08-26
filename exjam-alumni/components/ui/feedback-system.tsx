"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { toast, Toaster } from "react-hot-toast";

interface FeedbackContextType {
  showSuccess: (message: string, options?: ToastOptions) => void;
  showError: (message: string, options?: ToastOptions) => void;
  showWarning: (message: string, options?: ToastOptions) => void;
  showInfo: (message: string, options?: ToastOptions) => void;
  showLoading: (message: string) => string;
  dismissToast: (id: string) => void;
  showConfirmation: (options: ConfirmationOptions) => Promise<boolean>;
}

interface ToastOptions {
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (context === null) {
    // Instead of throwing an error, return default implementations
    // This prevents crashes during SSR/hydration
    return {
      showSuccess: (message: string) => console.log("Success:", message),
      showError: (message: string) => console.error("Error:", message),
      showWarning: (message: string) => console.warn("Warning:", message),
      showInfo: (message: string) => console.info("Info:", message),
      showLoading: (message: string) => {
        console.log("Loading:", message);
        return "loading";
      },
      dismissToast: () => {},
      showConfirmation: () => Promise.resolve(false),
    };
  }
  return context;
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    options: ConfirmationOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    toast.success(
      options?.action ? (
        <div className="flex items-center justify-between gap-3">
          <span className="flex-1">{message}</span>
          <button
            onClick={options.action.onClick}
            className="rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800 hover:bg-green-200"
          >
            {options.action.label}
          </button>
        </div>
      ) : (
        message
      ),
      {
        duration: options?.persistent ? Infinity : options?.duration || 4000,
        icon: "✅",
      }
    );
  }, []);

  const showError = useCallback((message: string, options?: ToastOptions) => {
    toast.error(
      options?.action ? (
        <div className="flex items-center justify-between gap-3">
          <span className="flex-1">{message}</span>
          <button
            onClick={options.action.onClick}
            className="rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800 hover:bg-red-200"
          >
            {options.action.label}
          </button>
        </div>
      ) : (
        message
      ),
      {
        duration: options?.persistent ? Infinity : options?.duration || 6000,
        icon: "❌",
      }
    );
  }, []);

  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    toast(
      options?.action ? (
        <div className="flex items-center justify-between gap-3">
          <span className="flex-1">{message}</span>
          <button
            onClick={options.action.onClick}
            className="rounded bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800 hover:bg-yellow-200"
          >
            {options.action.label}
          </button>
        </div>
      ) : (
        message
      ),
      {
        duration: options?.persistent ? Infinity : options?.duration || 5000,
        icon: "⚠️",
        style: {
          background: "#fef3c7",
          color: "#92400e",
          border: "1px solid #fcd34d",
        },
      }
    );
  }, []);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    toast(
      options?.action ? (
        <div className="flex items-center justify-between gap-3">
          <span className="flex-1">{message}</span>
          <button
            onClick={options.action.onClick}
            className="rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 hover:bg-blue-200"
          >
            {options.action.label}
          </button>
        </div>
      ) : (
        message
      ),
      {
        duration: options?.persistent ? Infinity : options?.duration || 4000,
        icon: "ℹ️",
        style: {
          background: "#dbeafe",
          color: "#1e40af",
          border: "1px solid #93c5fd",
        },
      }
    );
  }, []);

  const showLoading = useCallback((message: string) => {
    return toast.loading(message);
  }, []);

  const dismissToast = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  const showConfirmation = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationDialog({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirmationClose = useCallback(
    (confirmed: boolean) => {
      if (confirmationDialog) {
        confirmationDialog.resolve(confirmed);
        setConfirmationDialog(null);
      }
    },
    [confirmationDialog]
  );

  return (
    <FeedbackContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showLoading,
        dismissToast,
        showConfirmation,
      }}
    >
      {children}
      {/* Toaster is handled by ClientProviders to avoid duplicates */}

      {/* Confirmation Dialog */}
      {confirmationDialog?.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div
                    className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                      confirmationDialog.options.type === "danger"
                        ? "bg-red-100"
                        : confirmationDialog.options.type === "warning"
                          ? "bg-yellow-100"
                          : "bg-blue-100"
                    }`}
                  >
                    {confirmationDialog.options.type === "danger" ? (
                      <svg
                        className="h-6 w-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    ) : confirmationDialog.options.type === "warning" ? (
                      <svg
                        className="h-6 w-6 text-yellow-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {confirmationDialog.options.title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{confirmationDialog.options.message}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => handleConfirmationClose(true)}
                  className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    confirmationDialog.options.type === "danger"
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  }`}
                >
                  {confirmationDialog.options.confirmText || "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmationClose(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  {confirmationDialog.options.cancelText || "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

// Enhanced status indicators
export const StatusBadge: React.FC<{
  status: "success" | "error" | "warning" | "info" | "pending";
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}> = ({ status, children, size = "md" }) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full";
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };
  const statusClasses = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
    pending: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${statusClasses[status]}`}>
      {children}
    </span>
  );
};

// Progress indicator
export const ProgressIndicator: React.FC<{
  steps: { label: string; status: "completed" | "current" | "upcoming" }[];
}> = ({ steps }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.label}
            className={`relative ${stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : ""}`}
          >
            {step.status === "completed" ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-green-600" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-green-600 hover:bg-green-900">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </>
            ) : step.status === "current" ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                </div>
              </>
            )}
            <span className="absolute left-1/2 top-10 -translate-x-1/2 text-xs font-medium text-gray-500">
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
};
