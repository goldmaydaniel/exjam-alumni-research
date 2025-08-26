import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data: tiers, error } = await supabase
      .from("membership_tiers")
      .select("*")
      .eq("is_active", true)
      .order("price_ngn", { ascending: true });

    if (error) {
      console.error("Error fetching membership tiers:", error);
      return NextResponse.json({ error: "Failed to fetch membership tiers" }, { status: 500 });
    }

    // Transform data for frontend
    const formattedTiers =
      tiers?.map((tier) => ({
        id: tier.id,
        type: tier.tier_type,
        name: tier.name,
        description: tier.description,
        price: tier.price_ngn,
        priceFormatted: `₦${(tier.price_ngn / 100).toLocaleString()}`,
        duration: tier.duration_months,
        durationLabel: tier.duration_months ? `${tier.duration_months} months` : "Lifetime",
        features: tier.features,
        isActive: tier.is_active,
        popular: tier.tier_type === "lifetime", // Mark lifetime as popular
      })) || [];

    return NextResponse.json(formattedTiers);
  } catch (error) {
    console.error("Error in membership tiers API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
