import axios from "axios";

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    paid_at: string;
    channel: string;
  };
}

export class PaymentService {
  private static paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  private static paystackBaseUrl = "https://api.paystack.co";

  static async initializePaystackPayment(
    email: string,
    amount: number,
    metadata: Record<string, any>
  ): Promise<PaystackInitializeResponse> {
    try {
      const response = await axios.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          email,
          amount: amount * 100, // Convert to kobo
          metadata,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Paystack initialization error:", error);
      throw new Error("Failed to initialize payment");
    }
  }

  static async verifyPaystackPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await axios.get(`${this.paystackBaseUrl}/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Paystack verification error:", error);
      throw new Error("Failed to verify payment");
    }
  }

  static generateBankTransferReference(userId: string): string {
    const timestamp = Date.now().toString(36);
    const userPart = userId.substring(0, 8);
    return `EXJAM-${userPart}-${timestamp}`.toUpperCase();
  }
}
