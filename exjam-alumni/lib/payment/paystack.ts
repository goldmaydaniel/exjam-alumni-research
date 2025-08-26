/**
 * Paystack Payment Integration
 * Handles payment processing for event registrations
 */

export interface PaymentData {
  email: string;
  amount: number; // In kobo (Nigerian currency)
  currency?: string;
  reference: string;
  callback_url?: string;
  metadata?: {
    userId: string;
    eventId: string;
    registrationId: string;
    ticketType: string;
    userName: string;
    eventTitle: string;
  };
}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaymentVerificationResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
    };
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

class PaystackService {
  private baseUrl = "https://api.paystack.co";
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY!;
    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY environment variable is required");
    }
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Initialize payment transaction
   */
  async initializePayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          email: paymentData.email,
          amount: paymentData.amount,
          currency: paymentData.currency || "NGN",
          reference: paymentData.reference,
          callback_url: paymentData.callback_url,
          metadata: paymentData.metadata,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Payment initialization failed");
      }

      return result;
    } catch (error) {
      console.error("Paystack initialization error:", error);
      throw error;
    }
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Payment verification failed");
      }

      return result;
    } catch (error) {
      console.error("Paystack verification error:", error);
      throw error;
    }
  }

  /**
   * Generate payment reference
   */
  generatePaymentReference(prefix: string = "REG"): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Convert naira to kobo
   */
  nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
  }

  /**
   * Convert kobo to naira
   */
  koboToNaira(kobo: number): number {
    return kobo / 100;
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = "NGN"): string {
    if (currency === "NGN") {
      return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export const paystackService = new PaystackService();
export { PaystackService };
