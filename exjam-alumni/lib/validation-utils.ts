import React from "react";
import { z } from "zod";

// Enhanced validation schemas
export const schemas = {
  email: z.string().email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),

  strongPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),

  serviceNumber: z
    .string()
    .regex(/^[A-Z0-9]{4,12}$/, "Service number must be 4-12 characters, letters and numbers only")
    .optional()
    .or(z.literal("")),

  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens and apostrophes"),

  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),

  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),

  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Amount cannot exceed ₦1,000,000"),

  date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, "Please enter a valid date"),

  futureDate: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed > new Date();
  }, "Date must be in the future"),

  pastDate: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed < new Date();
  }, "Date must be in the past"),

  file: z.instanceof(File).refine((file) => {
    return file.size <= 5 * 1024 * 1024; // 5MB
  }, "File size must be less than 5MB"),

  image: z.instanceof(File).refine((file) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    return validTypes.includes(file.type);
  }, "File must be a valid image (JPEG, PNG, WebP, or GIF)"),

  document: z.instanceof(File).refine((file) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return validTypes.includes(file.type);
  }, "File must be a PDF or Word document"),
};

// Common form schemas
export const formSchemas = {
  login: z.object({
    email: schemas.email,
    password: z.string().min(1, "Password is required"),
  }),

  register: z
    .object({
      firstName: schemas.name,
      lastName: schemas.name,
      email: schemas.email,
      password: schemas.password,
      confirmPassword: z.string(),
      serviceNumber: schemas.serviceNumber,
      phone: schemas.phone,
      squadron: z.enum(["ALPHA", "JAGUAR", "MIG", "HERCULES", "DONIER"]).optional(),
      graduationYear: z.string().optional(),
      chapter: z.string().optional(),
      currentLocation: z.string().optional(),
      terms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),

  profile: z.object({
    firstName: schemas.name,
    lastName: schemas.name,
    phone: schemas.phone,
    bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
    currentOccupation: z.string().max(100).optional(),
    company: z.string().max(100).optional(),
    currentLocation: z.string().max(100).optional(),
    emergencyContact: schemas.phone,
  }),

  event: z
    .object({
      title: z.string().min(1, "Title is required").max(200),
      description: z.string().optional(),
      shortDescription: z.string().max(300).optional(),
      startDate: schemas.futureDate,
      endDate: schemas.futureDate,
      venue: z.string().min(1, "Venue is required"),
      address: z.string().optional(),
      capacity: z.number().int().positive().max(10000),
      price: schemas.amount,
    })
    .refine(
      (data) => {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end > start;
      },
      {
        message: "End date must be after start date",
        path: ["endDate"],
      }
    ),

  payment: z.object({
    amount: schemas.amount,
    currency: z.string().default("NGN"),
    paymentMethod: z.enum(["card", "bank_transfer", "ussd"]),
  }),

  changePassword: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: schemas.password,
      confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "New passwords don't match",
      path: ["confirmNewPassword"],
    }),
};

// Field validation functions
export const validators = {
  email: (email: string) => {
    try {
      schemas.email.parse(email);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, message: error.errors[0].message };
      }
      return { valid: false, message: "Invalid email" };
    }
  },

  password: (password: string) => {
    try {
      schemas.password.parse(password);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, message: error.errors[0].message };
      }
      return { valid: false, message: "Invalid password" };
    }
  },

  required: (value: any, fieldName: string = "This field") => {
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return { valid: false, message: `${fieldName} is required` };
    }
    return { valid: true };
  },

  minLength: (value: string, min: number, fieldName: string = "This field") => {
    if (value.length < min) {
      return { valid: false, message: `${fieldName} must be at least ${min} characters` };
    }
    return { valid: true };
  },

  maxLength: (value: string, max: number, fieldName: string = "This field") => {
    if (value.length > max) {
      return { valid: false, message: `${fieldName} must be less than ${max} characters` };
    }
    return { valid: true };
  },

  fileSize: (file: File, maxSizeMB: number) => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return { valid: false, message: `File size must be less than ${maxSizeMB}MB` };
    }
    return { valid: true };
  },

  fileType: (file: File, allowedTypes: string[]) => {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: `File type must be one of: ${allowedTypes.join(", ")}` };
    }
    return { valid: true };
  },
};

// Real-time validation hook
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export const useFormValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: T
) => {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateField = (name: string, value: any) => {
    try {
      // Create a partial schema for single field validation
      const fieldSchema = schema.pick({ [name]: true } as any);
      fieldSchema.parse({ [name]: value });

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });

      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || "Invalid value";
        setErrors((prev) => ({ ...prev, [name]: errorMessage }));
        return false;
      }
      return false;
    }
  };

  const validateAll = (): boolean => {
    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        return false;
      }
      return false;
    }
  };

  const setValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));

    // Validate field if it's already been touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const setTouchedField = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, values[name]);
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  const handleSubmit = (onSubmit: (values: T) => Promise<void> | void) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => {
          acc[key] = true;
          return acc;
        },
        {} as Record<string, boolean>
      );
      setTouched(allTouched);

      if (validateAll()) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error("Form submission error:", error);
        }
      }

      setIsSubmitting(false);
    };
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouchedField,
    validateField,
    validateAll,
    reset,
    handleSubmit,
    isValid: Object.keys(errors).length === 0 && Object.keys(touched).length > 0,
  };
};

// Utility functions
export const formatValidationErrors = (errors: z.ZodError) => {
  const formatted: Record<string, string> = {};
  errors.errors.forEach((error) => {
    const path = error.path.join(".");
    formatted[path] = error.message;
  });
  return formatted;
};

export const getFieldError = (errors: Record<string, string>, field: string) => {
  return errors[field] || null;
};

export const hasFieldError = (
  errors: Record<string, string>,
  touched: Record<string, boolean>,
  field: string
) => {
  return touched[field] && errors[field];
};
