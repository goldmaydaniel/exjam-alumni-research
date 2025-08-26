import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { eventFilter, statusFilter, searchTerm } = await req.json();
    const supabase = await createClient();

    // Build query based on filters
    let query = supabase
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
          startDate,
          venue,
          address
        ),
        ticket:Ticket(
          id,
          ticketNumber,
          checkedIn,
          checkinTime
        )
      `
      )
      .order("createdAt", { ascending: false });

    // Apply filters
    if (eventFilter && eventFilter !== "all") {
      query = query.eq("eventId", eventFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter.toUpperCase());
    }

    const { data: registrations, error } = await query;

    if (error) {
      console.error("Error fetching registrations for export:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch registrations" },
        { status: 500 }
      );
    }

    // Filter by search term if provided
    let filteredRegistrations = registrations || [];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredRegistrations = filteredRegistrations.filter(
        (reg) =>
          reg.user.email.toLowerCase().includes(lowerSearchTerm) ||
          reg.user.firstName.toLowerCase().includes(lowerSearchTerm) ||
          reg.user.lastName.toLowerCase().includes(lowerSearchTerm) ||
          (reg.ticket?.ticketNumber &&
            reg.ticket.ticketNumber.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      "Registration ID",
      "Ticket Number",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Service Number",
      "Regiment",
      "Rank",
      "Event Title",
      "Event Date",
      "Event Venue",
      "Ticket Type",
      "Status",
      "Payment Reference",
      "Checked In",
      "Check-in Time",
      "Registration Date",
    ];

    const csvRows = filteredRegistrations.map((reg) => [
      reg.id,
      reg.ticket?.ticketNumber || "N/A",
      reg.user.firstName || "",
      reg.user.lastName || "",
      reg.user.email,
      reg.user.phone || "",
      reg.user.serviceNumber || "",
      reg.user.regiment || "",
      reg.user.rank || "",
      reg.event.title,
      new Date(reg.event.startDate).toLocaleDateString(),
      reg.event.venue,
      reg.ticketType || "REGULAR",
      reg.status,
      reg.paymentReference || "",
      reg.ticket?.checkedIn ? "Yes" : "No",
      reg.ticket?.checkinTime ? new Date(reg.ticket.checkinTime).toLocaleString() : "",
      new Date(reg.createdAt).toLocaleString(),
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row
          .map((field) =>
            // Escape fields that contain commas, quotes, or newlines
            typeof field === "string" &&
            (field.includes(",") || field.includes('"') || field.includes("\n"))
              ? `"${field.replace(/"/g, '""')}"`
              : field
          )
          .join(",")
      ),
    ].join("\n");

    // Create response with CSV data
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="registrations-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });

    return response;
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export registrations" },
      { status: 500 }
    );
  }
}
