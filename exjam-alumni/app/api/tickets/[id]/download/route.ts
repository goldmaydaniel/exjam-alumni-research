import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: ticketId } = params;
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ticket details
    const { data: ticket, error: fetchError } = await supabase
      .from("Ticket")
      .select(
        `
        *,
        Registration(
          id, status,
          User(firstName, lastName, email)
        ),
        Event(
          id, title, description, startDate, endDate,
          venue, address, imageUrl
        )
      `
      )
      .eq("ticketNumber", ticketId)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if user owns this ticket or is admin
    const { data: dbUser } = await supabase.from("User").select("role").eq("id", user.id).single();

    const isOwner = ticket.userId === user.id;
    const isAdmin = dbUser?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate ticket PDF/image data
    const ticketData = {
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.qrCode,
      attendee: {
        name: `${ticket.Registration.User.firstName} ${ticket.Registration.User.lastName}`,
        email: ticket.Registration.User.email,
      },
      event: {
        title: ticket.Event.title,
        date: new Date(ticket.Event.startDate).toLocaleDateString(),
        time: new Date(ticket.Event.startDate).toLocaleTimeString(),
        venue: ticket.Event.venue,
        address: ticket.Event.address,
      },
      status: ticket.Registration.status,
      checkedIn: ticket.checkedIn,
      checkedInAt: ticket.checkedInAt,
    };

    // Generate simple HTML ticket (in production, you might use a PDF library)
    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket - ${ticket.Event.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .ticket { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #1e40af, #3b82f6); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .content { padding: 30px; }
          .qr-code { text-align: center; margin: 20px 0; }
          .details { margin: 20px 0; }
          .details h3 { color: #1e40af; margin-bottom: 10px; }
          .details p { margin: 5px 0; }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            border-top: 1px solid #dee2e6; 
          }
          @media print {
            body { background: white; }
            .ticket { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>The ExJAM Association</h1>
            <h2>${ticket.Event.title}</h2>
          </div>
          
          <div class="content">
            <div class="qr-code">
              <img src="data:image/svg+xml;base64,${Buffer.from(generateQRSVG(ticket.qrCode)).toString("base64")}" 
                   alt="QR Code" width="150" height="150">
              <p><strong>Ticket #${ticket.ticketNumber}</strong></p>
            </div>
            
            <div class="details">
              <h3>Attendee Information</h3>
              <p><strong>Name:</strong> ${ticketData.attendee.name}</p>
              <p><strong>Email:</strong> ${ticketData.attendee.email}</p>
            </div>
            
            <div class="details">
              <h3>Event Information</h3>
              <p><strong>Event:</strong> ${ticketData.event.title}</p>
              <p><strong>Date:</strong> ${ticketData.event.date}</p>
              <p><strong>Time:</strong> ${ticketData.event.time}</p>
              <p><strong>Venue:</strong> ${ticketData.event.venue}</p>
              ${ticketData.event.address ? `<p><strong>Address:</strong> ${ticketData.event.address}</p>` : ""}
            </div>
            
            <div class="details">
              <h3>Ticket Status</h3>
              <p><strong>Registration:</strong> ${ticketData.status}</p>
              <p><strong>Check-in:</strong> ${ticket.checkedIn ? `Checked in on ${new Date(ticket.checkedInAt).toLocaleString()}` : "Not checked in"}</p>
            </div>
          </div>
          
          <div class="footer">
            <p>Please present this ticket at the event entrance</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Return HTML response that can be printed/saved as PDF
    return new NextResponse(ticketHtml, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="ticket-${ticket.ticketNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Download ticket error:", error);
    return NextResponse.json({ error: "Failed to download ticket" }, { status: 500 });
  }
}

// Simple QR code SVG generator (basic implementation)
function generateQRSVG(data: string): string {
  // In production, use a proper QR code library like 'qrcode'
  // This is a placeholder SVG
  return `
    <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="150" fill="white"/>
      <rect x="10" y="10" width="130" height="130" fill="black"/>
      <rect x="20" y="20" width="110" height="110" fill="white"/>
      <text x="75" y="75" text-anchor="middle" font-size="12" fill="black">QR</text>
      <text x="75" y="90" text-anchor="middle" font-size="8" fill="black">${data.substring(0, 10)}...</text>
    </svg>
  `;
}
