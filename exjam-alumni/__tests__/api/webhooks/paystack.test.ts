/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import crypto from "crypto";
import { POST } from "@/app/api/webhooks/paystack/route";

// Mock Supabase
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        catch: jest.fn(),
      })),
    })),
  })),
}));

// Mock NotificationService
jest.mock("@/lib/edge-functions/notification-service", () => ({
  NotificationService: jest.fn(() => ({
    sendPaymentConfirmation: jest.fn(),
    sendRegistrationConfirmation: jest.fn(),
  })),
}));

describe("/api/webhooks/paystack", () => {
  const mockSecret = "test-secret-key";
  const mockWebhookData = {
    event: "charge.success",
    data: {
      id: 12345,
      reference: "test-reference-123",
      amount: 50000, // 500.00 in kobo
      status: "success",
      gateway_response: "Successful",
      paid_at: "2023-10-01T10:00:00.000Z",
      created_at: "2023-10-01T09:00:00.000Z",
      channel: "card",
      currency: "NGN",
      customer: {
        id: 67890,
        email: "test@example.com",
        customer_code: "CUS_test123",
      },
      metadata: {
        registrationId: "reg-123",
        userId: "user-123",
        eventId: "event-123",
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = mockSecret;
  });

  function createSignedRequest(data: any) {
    const body = JSON.stringify(data);
    const hash = crypto.createHmac("sha512", mockSecret).update(body).digest("hex");

    return new NextRequest("http://localhost:3000/api/webhooks/paystack", {
      method: "POST",
      body,
      headers: {
        "x-paystack-signature": hash,
        "content-type": "application/json",
      },
    });
  }

  it("should reject requests without signature", async () => {
    const request = new NextRequest("http://localhost:3000/api/webhooks/paystack", {
      method: "POST",
      body: JSON.stringify(mockWebhookData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid webhook signature");
  });

  it("should reject requests with invalid signature", async () => {
    const request = new NextRequest("http://localhost:3000/api/webhooks/paystack", {
      method: "POST",
      body: JSON.stringify(mockWebhookData),
      headers: {
        "x-paystack-signature": "invalid-signature",
        "content-type": "application/json",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid webhook signature");
  });

  it("should process valid charge.success webhook", async () => {
    const { createClient } = require("@/lib/supabase/server");
    const mockSupabase = createClient();

    // Mock registration lookup
    const mockRegistration = {
      id: "reg-123",
      user: { first_name: "John", last_name: "Doe" },
      event: { title: "Test Event" },
    };

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockRegistration,
      error: null,
    });

    // Mock update operation
    mockSupabase.from().update().eq().mockResolvedValue({
      error: null,
    });

    const request = createSignedRequest(mockWebhookData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Webhook processed successfully");

    // Verify registration was looked up
    expect(mockSupabase.from).toHaveBeenCalledWith("registrations");

    // Verify update was called
    expect(mockSupabase.from().update).toHaveBeenCalledWith({
      payment_status: "paid",
      payment_confirmed_at: mockWebhookData.data.paid_at,
      payment_method: "paystack",
      payment_gateway_response: mockWebhookData.data.gateway_response,
      amount: mockWebhookData.data.amount / 100,
    });
  });

  it("should handle charge.failed webhook", async () => {
    const failedWebhook = {
      ...mockWebhookData,
      event: "charge.failed",
      data: {
        ...mockWebhookData.data,
        status: "failed",
        gateway_response: "Declined by issuer",
      },
    };

    const { createClient } = require("@/lib/supabase/server");
    const mockSupabase = createClient();

    // Mock update operation
    mockSupabase.from().update().eq().mockResolvedValue({
      error: null,
    });

    const request = createSignedRequest(failedWebhook);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Webhook processed successfully");

    // Verify failed payment update
    expect(mockSupabase.from().update).toHaveBeenCalledWith({
      payment_status: "failed",
      payment_gateway_response: "Declined by issuer",
      payment_failed_at: expect.any(String),
    });
  });

  it("should handle unknown webhook events gracefully", async () => {
    const unknownWebhook = {
      ...mockWebhookData,
      event: "unknown.event",
    };

    const request = createSignedRequest(unknownWebhook);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Webhook processed successfully");
  });
});
