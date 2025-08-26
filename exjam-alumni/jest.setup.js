import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/router", () => require("next-router-mock"));

// Mock Next.js navigation
jest.mock("next/navigation", () => require("next-router-mock"));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.PAYSTACK_SECRET_KEY = "sk_test_your_secret_key_here";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
