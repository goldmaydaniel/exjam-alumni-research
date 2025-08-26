import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    const status = searchParams.get("status");

    if (!reference) {
      return NextResponse.redirect(new URL("/dashboard?payment=error", req.url));
    }

    // If payment was successful, trigger verification
    if (status === "success") {
      // Redirect to verification endpoint which will handle the full verification process
      return NextResponse.redirect(new URL(`/api/payment/verify?reference=${reference}`, req.url));
    } else {
      // Payment was cancelled or failed
      return NextResponse.redirect(new URL("/dashboard?payment=cancelled", req.url));
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.redirect(new URL("/dashboard?payment=error", req.url));
  }
}
