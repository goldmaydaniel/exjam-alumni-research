import { NextRequest, NextResponse } from "next/server";
import { convertWaitlistToRegistration } from "@/lib/waitlist";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Waitlist ID is required" },
        { status: 400 }
      );
    }

    const result = await convertWaitlistToRegistration(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Waitlist entry converted to registration",
      registrationId: result.registrationId,
    });
  } catch (error) {
    console.error("Waitlist conversion API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
