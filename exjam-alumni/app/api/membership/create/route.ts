import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { membershipType, paymentMethod, email, amount } = body;

    // Get user from token or email
    const cookieStore = cookies();
    const token = cookieStore.get("auth-token")?.value;
    let userId = null;

    if (token) {
      userId = await getUserFromToken(token);
    }

    // If no user ID from token, try to find user by email
    if (!userId && email) {
      const { data: authUser } = await supabase.auth.admin.listUsers();
      const user = authUser.users.find((u) => u.email === email);
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get membership tier
    const { data: tier, error: tierError } = await supabase
      .from("membership_tiers")
      .select("*")
      .eq("tier_type", membershipType)
      .single();

    if (tierError || !tier) {
      return NextResponse.json({ error: "Invalid membership type" }, { status: 400 });
    }

    // Create membership record
    const { data: membership, error: membershipError } = await supabase
      .from("user_memberships")
      .insert({
        user_id: userId,
        tier_id: tier.id,
        membership_type: membershipType,
        status: "pending",
        auto_renew: membershipType !== "lifetime",
      })
      .select()
      .single();

    if (membershipError) {
      console.error("Error creating membership:", membershipError);
      return NextResponse.json({ error: "Failed to create membership" }, { status: 500 });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("membership_payments")
      .insert({
        membership_id: membership.id,
        user_id: userId,
        amount_ngn: tier.price_ngn,
        payment_method: paymentMethod,
        status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    // Generate payment reference
    const paymentRef = `EXJAM_${membership.id.slice(-8).toUpperCase()}_${Date.now()}`;

    // Update payment with reference
    await supabase
      .from("membership_payments")
      .update({ payment_reference: paymentRef })
      .eq("id", payment.id);

    // Return payment details
    return NextResponse.json({
      membershipId: membership.id,
      paymentId: payment.id,
      paymentReference: paymentRef,
      amount: tier.price_ngn,
      membershipType: tier.name,
      paymentMethod,
      // For bank transfer, include bank details
      ...(paymentMethod === "transfer" && {
        bankDetails: {
          bankName: "First Bank Nigeria",
          accountNumber: "2012345678",
          accountName: "The ExJAM Association",
          reference: paymentRef,
        },
      }),
    });
  } catch (error) {
    console.error("Error in membership creation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cookieStore = cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user's memberships with tier details
    const { data: memberships, error } = await supabase
      .from("user_memberships")
      .select(
        `
        *,
        membership_tiers (
          name,
          description,
          price_ngn,
          duration_months,
          features
        ),
        membership_payments (
          id,
          amount_ngn,
          payment_method,
          payment_reference,
          status,
          paid_at,
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching memberships:", error);
      return NextResponse.json({ error: "Failed to fetch memberships" }, { status: 500 });
    }

    return NextResponse.json(memberships || []);
  } catch (error) {
    console.error("Error in membership GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
