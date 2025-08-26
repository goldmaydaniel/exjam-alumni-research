export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get all registrations with related data
    const { data: registrations, error: registrationsError } = await supabase
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
          fullName
        ),
        event:Event!eventId(
          id,
          title,
          startDate,
          endDate,
          venue,
          address
        ),
        ticket:Ticket(
          id,
          ticketNumber,
          checkedIn,
          checkinTime,
          qrCode
        )
      `
      )
      .order("createdAt", { ascending: false });

    if (registrationsError) {
      console.error("Error fetching registrations:", registrationsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch registrations" },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      total: registrations?.length || 0,
      confirmed: registrations?.filter((r) => r.status === "CONFIRMED").length || 0,
      pending: registrations?.filter((r) => r.status === "PENDING").length || 0,
      cancelled: registrations?.filter((r) => r.status === "CANCELLED").length || 0,
      checkedIn: registrations?.filter((r) => r.ticket && r.ticket.checkedIn).length || 0,
      totalRevenue: 0, // Will need to calculate based on ticket prices
    };

    // Format the data
    const formattedRegistrations =
      registrations?.map((reg) => ({
        ...reg,
        ticketNumber: reg.ticket?.ticketNumber || null,
      })) || [];

    return NextResponse.json({
      success: true,
      registrations: formattedRegistrations,
      stats,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
