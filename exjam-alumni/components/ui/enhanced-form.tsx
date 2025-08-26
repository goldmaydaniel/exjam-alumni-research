"use client";

import React from "react";
import { useFeedback } from "./feedback-system";
import { LoadingSpinner, LoadingButton } from "./enhanced-loading";
import { hasFieldError, getFieldError } from "@/lib/validation-utils";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: any;
  onChange: (name: string, value: any) => void;
  onBlur: (name: string) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  helper?: string;
  autoComplete?: string;
  className?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  helper,
  autoComplete,
  className = "",
  options,
  rows = 3,
  min,
  max,
  step,
}) => {
  const hasError = touched && error;
  const fieldId = `field-${name}`;
  const helperId = helper ? `${fieldId}-helper` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const baseInputClass = `
    block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 
    shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
    ${
      hasError
        ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
    } ${className}
  `;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const newValue = type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange(name, newValue);
  };

  const handleBlur = () => {
    onBlur(name);
  };

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            id={fieldId}
            name={name}
            value={value || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={baseInputClass}
            aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
            aria-invalid={hasError}
          />
        );

      case "select":
        return (
          <select
            id={fieldId}
            name={name}
            value={value || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={baseInputClass}
            aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
            aria-invalid={hasError}
          >
            <option value="">{placeholder || "Select an option"}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id={fieldId}
                name={name}
                type="checkbox"
                checked={value || false}
                onChange={(e) => onChange(name, e.target.checked)}
                onBlur={handleBlur}
                disabled={disabled}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
                aria-invalid={hasError}
              />
            </div>
            <div className="ml-3">
              <label htmlFor={fieldId} className="text-sm text-gray-700">
                {label}
                {required && <span className="text-red-500"> *</span>}
              </label>
            </div>
          </div>
        );

      case "file":
        return (
          <input
            id={fieldId}
            name={name}
            type="file"
            onChange={(e) => onChange(name, e.target.files?.[0] || null)}
            onBlur={handleBlur}
            disabled={disabled}
            className={baseInputClass}
            aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
            aria-invalid={hasError}
          />
        );

      default:
        return (
          <input
            id={fieldId}
            name={name}
            type={type}
            value={value || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            min={min}
            max={max}
            step={step}
            className={baseInputClass}
            aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
            aria-invalid={hasError}
          />
        );
    }
  };

  if (type === "checkbox") {
    return (
      <div className="space-y-1">
        {renderInput()}
        {helper && (
          <p id={helperId} className="text-sm text-gray-500">
            {helper}
          </p>
        )}
        {hasError && (
          <p id={errorId} className="flex items-center text-sm text-red-600">
            <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {renderInput()}
      {helper && (
        <p id={helperId} className="text-sm text-gray-500">
          {helper}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="flex items-center text-sm text-red-600">
          <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

// Form container with enhanced error handling
export const EnhancedForm: React.FC<{
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ children, onSubmit, loading = false, disabled = false, className = "" }) => {
  const { showError } = useFeedback();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || loading || disabled) return;

    setIsSubmitting(true);

    try {
      await onSubmit(e);
    } catch (error) {
      console.error("Form submission error:", error);
      showError(
        error instanceof Error ? error.message : "An error occurred while submitting the form"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`} noValidate>
      <fieldset disabled={isSubmitting || loading || disabled} className="space-y-6">
        {children}
      </fieldset>
    </form>
  );
};

// Form section with collapsible functionality
export const FormSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  required?: boolean;
}> = ({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  required = false,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${collapsible ? "cursor-pointer" : ""}`} onClick={toggleExpanded}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              {title}
              {required && <span className="ml-1 text-red-500">*</span>}
            </h3>
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>
          {collapsible && (
            <svg
              className={`h-5 w-5 text-gray-500 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </div>

      {expanded && <div className="space-y-4 pl-0">{children}</div>}
    </div>
  );
};

// Form buttons with consistent styling
export const FormActions: React.FC<{
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  submitVariant?: "primary" | "secondary" | "danger";
  showCancel?: boolean;
  additional?: React.ReactNode;
}> = ({
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onCancel,
  loading = false,
  disabled = false,
  submitVariant = "primary",
  showCancel = true,
  additional,
}) => {
  const submitClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
      <div className="flex items-center space-x-3">{additional}</div>
      <div className="flex items-center space-x-3">
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
        <LoadingButton
          type="submit"
          loading={loading}
          disabled={disabled}
          loadingText="Submitting..."
          className={`rounded-md px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${submitClasses[submitVariant]}`}
        >
          {submitLabel}
        </LoadingButton>
      </div>
    </div>
  );
};

// Field array component for dynamic form fields
export const FieldArray: React.FC<{
  label: string;
  name: string;
  values: any[];
  onChange: (name: string, values: any[]) => void;
  renderField: (
    value: any,
    index: number,
    onChange: (value: any) => void,
    onRemove: () => void
  ) => React.ReactNode;
  addLabel?: string;
  minItems?: number;
  maxItems?: number;
  helper?: string;
}> = ({
  label,
  name,
  values,
  onChange,
  renderField,
  addLabel = "Add Item",
  minItems = 0,
  maxItems = 10,
  helper,
}) => {
  const addItem = () => {
    if (values.length < maxItems) {
      onChange(name, [...values, null]);
    }
  };

  const removeItem = (index: number) => {
    if (values.length > minItems) {
      const newValues = values.filter((_, i) => i !== index);
      onChange(name, newValues);
    }
  };

  const updateItem = (index: number, value: any) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(name, newValues);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
      </div>

      <div className="space-y-3">
        {values.map((value, index) => (
          <div key={index} className="relative">
            {renderField(
              value,
              index,
              (newValue) => updateItem(index, newValue),
              () => removeItem(index)
            )}
          </div>
        ))}
      </div>

      {values.length < maxItems && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center space-x-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>{addLabel}</span>
        </button>
      )}
    </div>
  );
};
