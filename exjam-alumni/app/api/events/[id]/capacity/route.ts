import { NextRequest, NextResponse } from "next/server";
import { eventRegistrationService } from "@/lib/services/event-registration";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Get real-time capacity information
    const capacityInfo = await eventRegistrationService.checkEventCapacity(eventId);
    const stats = await eventRegistrationService.getEventStats(eventId);

    return NextResponse.json({
      ...capacityInfo,
      availableSpots: capacityInfo.capacity - capacityInfo.currentRegistrations,
      registrationStats: {
        totalRegistered: stats.registeredCount,
        confirmed: stats.confirmedCount,
        pending: stats.pendingCount,
        revenue: stats.revenue
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Capacity check error:", error);
    
    if (error instanceof Error && error.message === 'Event not found') {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to check event capacity" }, { status: 500 });
  }
}