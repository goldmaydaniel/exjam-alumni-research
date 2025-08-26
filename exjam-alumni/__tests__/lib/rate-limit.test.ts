/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { rateLimit, rateLimitConfigs, ipKeyGenerator, userKeyGenerator } from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    const { rateLimitStore } = require("@/lib/rate-limit");
    if (rateLimitStore) {
      rateLimitStore.clear();
    }
  });

  describe("ipKeyGenerator", () => {
    it("should generate key from x-forwarded-for header", () => {
      const request = new NextRequest("http://localhost:3000", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      const key = ipKeyGenerator(request);
      expect(key).toBe("192.168.1.1");
    });

    it("should fallback to x-real-ip header", () => {
      const request = new NextRequest("http://localhost:3000", {
        headers: {
          "x-real-ip": "192.168.1.2",
        },
      });

      const key = ipKeyGenerator(request);
      expect(key).toBe("192.168.1.2");
    });

    it("should fallback to unknown when no IP headers", () => {
      const request = new NextRequest("http://localhost:3000");
      const key = ipKeyGenerator(request);
      expect(key).toBe("unknown");
    });
  });

  describe("userKeyGenerator", () => {
    it("should generate key from valid JWT token", () => {
      // Simple mock JWT: header.payload.signature
      const mockPayload = { userId: "user-123" };
      const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;

      const request = new NextRequest("http://localhost:3000", {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      });

      const key = userKeyGenerator(request);
      expect(key).toBe("user:user-123");
    });

    it("should fallback to IP when no valid token", () => {
      const request = new NextRequest("http://localhost:3000", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
        },
      });

      const key = userKeyGenerator(request);
      expect(key).toBe("192.168.1.1");
    });
  });

  describe("rateLimit function", () => {
    const testConfig = {
      maxRequests: 3,
      windowMs: 60000, // 1 minute
      blockDurationMs: 30000, // 30 seconds
    };

    it("should allow requests within limit", async () => {
      const rateLimiter = rateLimit(testConfig);
      const request = new NextRequest("http://localhost:3000", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      });

      // First request should pass
      const result1 = await rateLimiter(request);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);

      // Second request should pass
      const result2 = await rateLimiter(request);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      // Third request should pass
      const result3 = await rateLimiter(request);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it("should block requests exceeding limit", async () => {
      const rateLimiter = rateLimit(testConfig);
      const request = new NextRequest("http://localhost:3000", {
        headers: { "x-forwarded-for": "192.168.1.101" },
      });

      // Use up all requests
      await rateLimiter(request);
      await rateLimiter(request);
      await rateLimiter(request);

      // Fourth request should be blocked
      const result = await rateLimiter(request);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.error).toContain("Rate limit exceeded");
    });

    it("should respect block duration", async () => {
      const shortBlockConfig = {
        ...testConfig,
        blockDurationMs: 100, // 100ms block
      };

      const rateLimiter = rateLimit(shortBlockConfig);
      const request = new NextRequest("http://localhost:3000", {
        headers: { "x-forwarded-for": "192.168.1.102" },
      });

      // Exhaust rate limit
      await rateLimiter(request);
      await rateLimiter(request);
      await rateLimiter(request);

      // Should be blocked
      const blockedResult = await rateLimiter(request);
      expect(blockedResult.success).toBe(false);

      // Wait for block to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should still be blocked (within window)
      const stillBlockedResult = await rateLimiter(request);
      expect(stillBlockedResult.success).toBe(false);
    });

    it("should skip rate limiting when skip function returns true", async () => {
      const configWithSkip = {
        ...testConfig,
        skip: () => true,
      };

      const rateLimiter = rateLimit(configWithSkip);
      const request = new NextRequest("http://localhost:3000");

      const result = await rateLimiter(request);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(testConfig.maxRequests);
    });
  });

  describe("predefined configurations", () => {
    it("should have auth config with appropriate limits", () => {
      expect(rateLimitConfigs.auth.maxRequests).toBe(5);
      expect(rateLimitConfigs.auth.windowMs).toBe(15 * 60 * 1000);
      expect(rateLimitConfigs.auth.blockDurationMs).toBe(30 * 60 * 1000);
    });

    it("should have password reset config more restrictive than auth", () => {
      expect(rateLimitConfigs.passwordReset.maxRequests).toBeLessThan(
        rateLimitConfigs.auth.maxRequests
      );
      expect(rateLimitConfigs.passwordReset.blockDurationMs).toBeGreaterThan(
        rateLimitConfigs.auth.blockDurationMs!
      );
    });

    it("should have public config with higher limits", () => {
      expect(rateLimitConfigs.public.maxRequests).toBeGreaterThan(
        rateLimitConfigs.auth.maxRequests
      );
      expect(rateLimitConfigs.public.windowMs).toBeLessThan(rateLimitConfigs.auth.windowMs);
    });
  });
});
