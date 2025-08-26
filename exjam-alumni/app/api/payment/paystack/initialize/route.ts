import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId, email, amount } = await request.json();

    // Verify payment exists and belongs to user
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { Registration: true },
    });

    if (!payment || payment.userId !== user.userId) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Initialize Paystack payment
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // Amount in kobo
        reference: payment.reference,
        currency: "NGN",
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?reference=${payment.reference}`,
        metadata: {
          userId: user.userId,
          paymentId: payment.id,
          registrationId: payment.registrationId,
          custom_fields: [
            {
              display_name: "Payment Reference",
              variable_name: "payment_reference",
              value: payment.reference,
            },
          ],
        },
      }),
    });

    const data = await paystackResponse.json();

    if (!data.status) {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    // Update payment metadata
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          paymentMethod: "PAYSTACK",
          access_code: data.data.access_code,
          paystack_reference: data.data.reference,
        },
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      accessCode: data.data.access_code,
    });
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
