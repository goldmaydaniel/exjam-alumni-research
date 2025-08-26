import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
    }

    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "PAYMENT_FAILED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const supabase = await createClient();

    // Update the registration status
    const { data: updatedRegistration, error: updateError } = await supabase
      .from("Registration")
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating registration:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update registration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supabase = await createClient();

    // Get specific registration with all related data
    const { data: registration, error: registrationError } = await supabase
      .from("Registration")
      .select(
        `
        id,
        userId,
        eventId,
        ticketType,
        status,
        paymentReference,
        createdAt,
        updatedAt,
        user:User!userId(
          id,
          email,
          firstName,
          lastName,
          fullName,
          phone,
          serviceNumber,
          regiment,
          rank
        ),
        event:Event!eventId(
          id,
          title,
          description,
          startDate,
          endDate,
          venue,
          address,
          imageUrl
        ),
        ticket:Ticket(
          id,
          ticketNumber,
          checkedIn,
          checkinTime,
          qrCode,
          createdAt
        )
      `
      )
      .eq("id", id)
      .single();

    if (registrationError) {
      console.error("Error fetching registration:", registrationError);
      return NextResponse.json(
        { success: false, error: "Registration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
