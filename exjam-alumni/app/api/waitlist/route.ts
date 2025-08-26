import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addToWaitlist, getWaitlistForEvent } from "@/lib/waitlist";
import { z } from "zod";

const addWaitlistSchema = z.object({
  userId: z.string(),
  eventId: z.string(),
  ticketType: z.enum(["REGULAR", "VIP", "STUDENT"]).optional().default("REGULAR"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, eventId, ticketType } = addWaitlistSchema.parse(body);

    const result = await addToWaitlist({ userId, eventId, ticketType });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully added to waitlist",
      position: result.position,
    });
  } catch (error) {
    console.error("Waitlist API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ success: false, error: "eventId is required" }, { status: 400 });
    }

    const waitlist = await getWaitlistForEvent(eventId);

    return NextResponse.json({
      success: true,
      waitlist,
    });
  } catch (error) {
    console.error("Waitlist GET API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}
