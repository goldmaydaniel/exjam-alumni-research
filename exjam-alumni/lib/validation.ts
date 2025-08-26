import { z } from "zod";
import { logger } from "./logger";

// Validation result interface
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Custom validation error class
export class AppValidationError extends Error {
  public errors: ValidationError[];
  public statusCode: number;

  constructor(errors: ValidationError[], message = "Validation failed") {
    super(message);
    this.name = "AppValidationError";
    this.errors = errors;
    this.statusCode = 400;
  }
}

// Generic validator class
export class Validator {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): ValidationResult<T> {
    try {
      const result = schema.parse(data);
      logger.debug("Validation successful", context, { dataType: typeof data });
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        logger.warn("Validation failed", context, { errors: validationErrors });
        return { success: false, errors: validationErrors };
      }

      logger.error("Unexpected validation error", error as Error, context);
      return {
        success: false,
        errors: [{ field: "unknown", message: "Validation failed", code: "unknown_error" }],
      };
    }
  }

  static async validateAsync<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    context?: string
  ): Promise<ValidationResult<T>> {
    return this.validate(schema, data, context);
  }

  static throwOnError<T>(result: ValidationResult<T>): T {
    if (!result.success || !result.data) {
      throw new AppValidationError(result.errors || []);
    }
    return result.data;
  }
}

// Common validation schemas
export const CommonSchemas = {
  // User schemas
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().regex(/^\\+?[1-9]\\d{1,14}$/, "Invalid phone number format"),

  // ID schemas
  uuid: z.string().uuid("Invalid UUID format"),
  objectId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId format"),

  // Date schemas
  dateString: z.string().datetime("Invalid date format"),
  futureDate: z
    .string()
    .datetime()
    .refine((date) => new Date(date) > new Date(), "Date must be in the future"),

  // Number schemas
  positiveNumber: z.number().positive("Must be a positive number"),
  price: z.number().positive().max(1000000, "Price too high"),

  // String schemas
  nonEmptyString: z.string().min(1, "Cannot be empty"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug format"),

  // Array schemas
  nonEmptyArray: z.array(z.any()).min(1, "Array cannot be empty"),
};

// User validation schemas
export const UserValidationSchemas = {
  register: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: CommonSchemas.email,
    password: CommonSchemas.password,
    phone: CommonSchemas.phone.optional(),
    graduationYear: z.number().int().min(1980).max(new Date().getFullYear()),
    squadron: z.enum(["GREEN", "RED", "PURPLE", "YELLOW", "DORNIER", "PUMA"]),
    serviceNumber: z.string().optional(),
  }),

  login: z.object({
    email: CommonSchemas.email,
    password: z.string().min(1, "Password is required"),
  }),

  updateProfile: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: CommonSchemas.phone.optional(),
    bio: z.string().max(500).optional(),
    profilePhoto: z.string().url().optional(),
  }),

  resetPassword: z
    .object({
      token: z.string().min(1, "Reset token is required"),
      password: CommonSchemas.password,
      confirmPassword: CommonSchemas.password,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};

// Event validation schemas
export const EventValidationSchemas = {
  create: z
    .object({
      title: z.string().min(5, "Title must be at least 5 characters"),
      shortDescription: z.string().min(10, "Description must be at least 10 characters"),
      longDescription: z.string().optional(),
      startDate: CommonSchemas.futureDate,
      endDate: CommonSchemas.futureDate,
      venue: CommonSchemas.nonEmptyString,
      address: CommonSchemas.nonEmptyString,
      price: CommonSchemas.price,
      capacity: CommonSchemas.positiveNumber,
      isPublic: z.boolean().default(true),
      requiresApproval: z.boolean().default(false),
      imageUrl: z.string().url().optional(),
    })
    .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
      message: "End date must be after start date",
      path: ["endDate"],
    }),

  update: z.object({
    title: z.string().min(5).optional(),
    shortDescription: z.string().min(10).optional(),
    longDescription: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    venue: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    price: CommonSchemas.price.optional(),
    capacity: CommonSchemas.positiveNumber.optional(),
    isPublic: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    imageUrl: z.string().url().optional(),
  }),

  register: z.object({
    eventId: CommonSchemas.uuid,
    specialRequirements: z.string().max(500).optional(),
  }),
};

// API validation schemas
export const APIValidationSchemas = {
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).default("1"),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default("10"),
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).default("desc"),
  }),

  search: z.object({
    q: z.string().min(1, "Search query is required"),
    type: z.enum(["events", "users", "all"]).default("all"),
    filters: z.record(z.any()).optional(),
  }),

  bulkOperation: z.object({
    ids: z.array(CommonSchemas.uuid).min(1, "At least one ID is required"),
    operation: z.enum(["delete", "approve", "reject", "archive"]),
  }),
};

// Environment validation
export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url("Invalid database URL"),
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  RESEND_API_KEY: z.string().startsWith("re_", "Invalid Resend API key"),
  PAYSTACK_SECRET_KEY: z.string().startsWith("sk_", "Invalid Paystack secret key"),
  PAYSTACK_PUBLIC_KEY: z.string().startsWith("pk_", "Invalid Paystack public key"),
  NEXT_PUBLIC_APP_URL: z.string().url("Invalid app URL"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

// Validate environment variables
export function validateEnvironment() {
  try {
    const env = EnvironmentSchema.parse(process.env);
    logger.info("Environment validation successful", "startup");
    return env;
  } catch (error) {
    logger.error("Environment validation failed", error as Error, "startup");
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return null;
  }
}

// Middleware for request validation
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (data: unknown, context?: string): Promise<T> => {
    const result = Validator.validate(schema, data, context);
    if (!result.success) {
      throw new AppValidationError(result.errors || []);
    }
    return result.data as T;
  };
}

// Type-safe form validation hook (for client-side)
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (data: unknown) => Validator.validate(schema, data, "form"),
    validateField: (fieldName: keyof T, value: unknown) => {
      try {
        const fieldSchema = (schema as any).shape[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
          return { success: true };
        }
        return { success: false, error: "Field not found" };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return { success: false, error: error.errors[0]?.message || "Validation failed" };
        }
        return { success: false, error: "Validation failed" };
      }
    },
  };
}

// Export commonly used validators
export const validateUser = validateRequest(UserValidationSchemas.register);
export const validateLogin = validateRequest(UserValidationSchemas.login);
export const validateEvent = validateRequest(EventValidationSchemas.create);
export const validatePagination = validateRequest(APIValidationSchemas.pagination);

// Global error handler for validation errors
export function handleValidationError(error: AppValidationError) {
  logger.warn("Validation error occurred", "validation", {
    errors: error.errors,
    message: error.message,
  });

  return {
    error: "Validation failed",
    details: error.errors,
    statusCode: error.statusCode,
  };
}
