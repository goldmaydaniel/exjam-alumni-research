import { useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";
import toast from "react-hot-toast";

interface AutoSaveOptions {
  key: string;
  delay?: number;
  onSave?: (data: any) => void;
  excludeFields?: string[];
}

export function useFormAutoSave(watch: any, getValues: any, options: AutoSaveOptions) {
  const { key, delay = 1000, onSave, excludeFields = [] } = options;
  const isMounted = useRef(false);
  const saveToastId = useRef<string | null>(null);

  // Create debounced save function
  const debouncedSave = useCallback(
    debounce((formData: any) => {
      // Filter out excluded fields
      const dataToSave = Object.keys(formData).reduce((acc, field) => {
        if (!excludeFields.includes(field)) {
          acc[field] = formData[field];
        }
        return acc;
      }, {} as any);

      // Save to localStorage
      localStorage.setItem(
        `form-draft-${key}`,
        JSON.stringify({
          data: dataToSave,
          timestamp: Date.now(),
        })
      );

      // Show save indicator
      if (saveToastId.current) {
        toast.dismiss(saveToastId.current);
      }
      saveToastId.current = toast.success("Draft saved", {
        duration: 1000,
        position: "bottom-right",
        style: {
          background: "#10b981",
          color: "white",
          fontSize: "14px",
          padding: "8px 12px",
        },
      });

      // Call custom save handler if provided
      if (onSave) {
        onSave(dataToSave);
      }
    }, delay),
    [key, delay, onSave, excludeFields]
  );

  // Watch for form changes
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const subscription = watch((formData: any) => {
      debouncedSave(formData);
    });

    return () => {
      subscription.unsubscribe();
      debouncedSave.cancel();
    };
  }, [watch, debouncedSave]);

  // Load saved draft on mount
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(`form-draft-${key}`);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);

        // Check if draft is less than 24 hours old
        const dayInMs = 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < dayInMs) {
          return data;
        } else {
          // Clear old draft
          localStorage.removeItem(`form-draft-${key}`);
        }
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
    return null;
  }, [key]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(`form-draft-${key}`);
    if (saveToastId.current) {
      toast.dismiss(saveToastId.current);
    }
    toast.success("Draft cleared", {
      duration: 2000,
      position: "bottom-right",
    });
  }, [key]);

  return {
    loadDraft,
    clearDraft,
    hasDraft: !!localStorage.getItem(`form-draft-${key}`),
  };
}
