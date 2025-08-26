import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid URL").optional(),

  // Authentication
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long")
    .refine((val) => val !== "your-super-secret-jwt-key-change-in-production", {
      message: "JWT_SECRET must be changed from the default value",
    }),

  // Email (Resend)
  RESEND_API_KEY: z.string().startsWith("re_", "RESEND_API_KEY must start with 're_'"),

  // Payment (Paystack)
  PAYSTACK_SECRET_KEY: z.string().startsWith("sk_", "PAYSTACK_SECRET_KEY must start with 'sk_'"),
  PAYSTACK_PUBLIC_KEY: z.string().startsWith("pk_", "PAYSTACK_PUBLIC_KEY must start with 'pk_'"),

  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NEXT_PUBLIC_URL: z.string().url("NEXT_PUBLIC_URL must be a valid URL").optional(),

  // Optional Supabase (if using)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment variable validation failed:");
      error.errors?.forEach((err) => {
        console.error(`  • ${err.path.join(".")}: ${err.message}`);
      });
      console.error(
        "\n💡 Please check your .env file and ensure all required variables are set correctly."
      );
      console.error("📚 See .env.example for the required format.\n");
    } else {
      console.error("❌ Unexpected error during environment validation:", error);
    }
    process.exit(1);
  }
}

// Validate environment variables on import (but not during build)
let validatedEnv: Env;

if (process.env.NODE_ENV !== "production" || process.env.SKIP_ENV_VALIDATION !== "true") {
  validatedEnv = validateEnv();
} else {
  // In production, trust that env vars are correct (but still type them)
  validatedEnv = process.env as any;
}

export const env = validatedEnv;

// Utility function to check if all critical services are configured
export function checkServiceConfiguration() {
  const checks = {
    database: !!env.DATABASE_URL,
    email: !!env.RESEND_API_KEY,
    payment: !!(env.PAYSTACK_SECRET_KEY && env.PAYSTACK_PUBLIC_KEY),
    auth: !!env.JWT_SECRET,
  };

  const missingServices = Object.entries(checks)
    .filter(([, configured]) => !configured)
    .map(([service]) => service);

  if (missingServices.length > 0) {
    console.warn("⚠️  Some services are not fully configured:");
    missingServices.forEach((service) => {
      console.warn(`  • ${service} configuration missing`);
    });
  }

  return {
    allConfigured: missingServices.length === 0,
    configured: Object.entries(checks)
      .filter(([, configured]) => configured)
      .map(([service]) => service),
    missing: missingServices,
  };
}

export default env;
