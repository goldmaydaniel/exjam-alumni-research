import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { sendEmail } from "@/lib/email";
import { generateTicketNumber, generateTicketQR } from "@/lib/ticket";

const bulkActionSchema = z.object({
  action: z.enum(["approve", "reject", "sendEmail", "generateTickets", "export"]),
  registrationIds: z.array(z.string()),
  emailContent: z
    .object({
      subject: z.string(),
      message: z.string(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { action, registrationIds, emailContent } = bulkActionSchema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let results: Record<string, any> = {};

    switch (action) {
      case "approve":
        results = await bulkApproveRegistrations(registrationIds);
        break;

      case "reject":
        results = await bulkRejectRegistrations(registrationIds);
        break;

      case "sendEmail":
        if (!emailContent) {
          return NextResponse.json({ error: "Email content required" }, { status: 400 });
        }
        results = await bulkSendEmails(registrationIds, emailContent);
        break;

      case "generateTickets":
        results = await bulkGenerateTickets(registrationIds);
        break;

      case "export":
        results = await exportRegistrations(registrationIds);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Bulk operation error:", error);
    return NextResponse.json({ error: "Bulk operation failed" }, { status: 500 });
  }
}

async function bulkApproveRegistrations(registrationIds: string[]) {
  const updated = await prisma.registration.updateMany({
    where: {
      id: { in: registrationIds },
      status: "PENDING",
    },
    data: {
      status: "CONFIRMED",
    },
  });

  // Update related payments
  await prisma.payment.updateMany({
    where: {
      registrationId: { in: registrationIds },
      status: "PENDING",
    },
    data: {
      status: "SUCCESS",
    },
  });

  return {
    updated: updated.count,
    message: `Approved ${updated.count} registrations`,
  };
}

async function bulkRejectRegistrations(registrationIds: string[]) {
  const updated = await prisma.registration.updateMany({
    where: {
      id: { in: registrationIds },
    },
    data: {
      status: "CANCELLED",
    },
  });

  // Update related payments
  await prisma.payment.updateMany({
    where: {
      registrationId: { in: registrationIds },
    },
    data: {
      status: "REFUNDED",
    },
  });

  return {
    updated: updated.count,
    message: `Rejected ${updated.count} registrations`,
  };
}

async function bulkSendEmails(
  registrationIds: string[],
  emailContent: { subject: string; message: string }
) {
  const registrations = await prisma.registration.findMany({
    where: { id: { in: registrationIds } },
    include: {
      User: true,
      Event: true,
    },
  });

  const emailPromises = registrations.map(async (registration) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${emailContent.subject}</h2>
        <p>Dear ${registration.User.firstName},</p>
        <div>${emailContent.message}</div>
        <hr style="margin: 20px 0;" />
        <p style="color: #666;">
          Event: ${registration.Event.title}<br>
          Registration ID: ${registration.id}
        </p>
      </div>
    `;

    return sendEmail({
      to: registration.User.email,
      subject: emailContent.subject,
      html,
    });
  });

  const results = await Promise.allSettled(emailPromises);
  const successful = results.filter((r) => r.status === "fulfilled").length;

  return {
    sent: successful,
    failed: results.length - successful,
    message: `Sent ${successful} emails`,
  };
}

async function bulkGenerateTickets(registrationIds: string[]) {
  const registrations = await prisma.registration.findMany({
    where: {
      id: { in: registrationIds },
      status: "CONFIRMED",
      Ticket: null,
    },
    include: {
      User: true,
      Event: true,
    },
  });

  const ticketPromises = registrations.map(async (registration) => {
    const ticketNumber = await generateTicketNumber();
    const qrCode = await generateTicketQR({
      ticketNumber,
      eventId: registration.Event.id,
      userId: registration.User.id,
      eventTitle: registration.Event.title,
      userName: `${registration.User.firstName} ${registration.User.lastName}`,
      eventDate: registration.Event.startDate.toISOString(),
      venue: registration.Event.venue,
    });

    return prisma.ticket.create({
      data: {
        id: crypto.randomUUID(),
        registrationId: registration.id,
        userId: registration.userId,
        eventId: registration.eventId,
        ticketNumber,
        qrCode,
        updatedAt: new Date(),
      },
    });
  });

  const results = await Promise.allSettled(ticketPromises);
  const successful = results.filter((r) => r.status === "fulfilled").length;

  return {
    generated: successful,
    failed: results.length - successful,
    message: `Generated ${successful} tickets`,
  };
}

async function exportRegistrations(registrationIds: string[]) {
  const registrations = await prisma.registration.findMany({
    where: { id: { in: registrationIds } },
    include: {
      User: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          graduationYear: true,
          company: true,
        },
      },
      Event: {
        select: {
          title: true,
          startDate: true,
          venue: true,
        },
      },
      Payment: {
        select: {
          amount: true,
          status: true,
          createdAt: true,
        },
      },
      Ticket: {
        select: {
          ticketNumber: true,
          checkedIn: true,
          checkedInAt: true,
        },
      },
    },
  });

  // Format data for CSV export
  const csvData = registrations.map((reg) => ({
    "Registration ID": reg.id,
    "First Name": reg.User.firstName,
    "Last Name": reg.User.lastName,
    Email: reg.User.email,
    Phone: reg.User.phone || "",
    "Graduation Year": reg.User.graduationYear || "",
    Company: reg.User.company || "",
    Event: reg.Event.title,
    "Event Date": reg.Event.startDate.toISOString(),
    Venue: reg.Event.venue,
    "Ticket Type": reg.ticketType,
    Status: reg.status,
    "Payment Amount": reg.Payment?.amount || 0,
    "Payment Status": reg.Payment?.status || "N/A",
    "Ticket Number": reg.Ticket?.ticketNumber || "N/A",
    "Checked In": reg.Ticket?.checkedIn ? "Yes" : "No",
    "Check-in Time": reg.Ticket?.checkedInAt?.toISOString() || "",
    "Special Requests": reg.specialRequests || "",
    "Registration Date": reg.createdAt.toISOString(),
  }));

  return {
    data: csvData,
    count: csvData.length,
    message: `Exported ${csvData.length} registrations`,
  };
}
