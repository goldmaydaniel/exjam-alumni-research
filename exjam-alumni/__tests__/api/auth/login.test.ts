/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";

// Mock Supabase
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}));

// Mock rate limiting
jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: jest.fn((req, config, handler) => handler()),
  rateLimitConfigs: {
    auth: {},
  },
}));

describe("/api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should validate required fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
  });

  it("should handle valid login credentials", async () => {
    const { createClient } = require("@/lib/supabase/server");
    const mockSupabase = createClient();

    // Mock successful auth
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: "user-123", email: "test@example.com" },
        session: { access_token: "token-123" },
      },
      error: null,
    });

    // Mock user data fetch
    const mockSelect = mockSupabase.from().select().eq().single;
    mockSelect.mockResolvedValue({
      data: {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.session).toBeDefined();
    expect(data.user.email).toBe("test@example.com");
  });

  it("should handle invalid credentials", async () => {
    const { createClient } = require("@/lib/supabase/server");
    const mockSupabase = createClient();

    // Mock auth failure
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid credentials" },
    });

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid credentials");
  });
});
