const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PG_CONFERENCE_EVENT = {
  title: "President General's Conference - Maiden Flight",
  shortDescription: "A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association",
  longDescription: `This groundbreaking event marks a new milestone in the history of the ExJAM Association. For the first time ever, we are bringing together our members, leaders, and stakeholders to share ideas, build relationships, and shape the future of our association.

**Event Highlights:**
• Opening Ceremony with Past President General Muhammed Sani Abdullahi
• Leadership Development Sessions
• Networking Opportunities
• Strategic Planning Workshops
• Gala Dinner & Awards Ceremony

**Theme:** "Strive to Excel" - Continuing the legacy of excellence from AFMS Jos

This is not just a conference; it's the beginning of a new chapter in ExJAM's journey toward greater unity, leadership, and impact.`,
  startDate: new Date("2025-11-28T09:00:00.000Z"),
  endDate: new Date("2025-11-30T18:00:00.000Z"),
  venue: "NAF Conference Centre, FCT, ABUJA",
  address: "Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria",
  price: 20000,
  currentAttendees: 0,
  status: "PUBLISHED",
  category: "CONFERENCE",
  organizer: "ExJAM Association",
  contactEmail: "info@exjam.org.ng",
  contactPhone: "+234 901 234 5678",
  imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop",
  tags: ["conference", "leadership", "networking", "alumni", "maiden-flight"],
  featured: true,
  registrationDeadline: new Date("2025-11-25T23:59:59.000Z"),
  refundPolicy: "Full refund available until November 20, 2025",
  includes: [
    "Conference materials and welcome package",
    "All sessions and workshops",
    "Networking lunch and coffee breaks",
    "Gala dinner on November 29th",
    "Certificate of participation",
    "Digital badge for social media"
  ],
  schedule: [
    {
      day: "November 28, 2025",
      events: [
        { time: "09:00 - 10:00", title: "Registration & Welcome Coffee" },
        { time: "10:00 - 11:00", title: "Opening Ceremony" },
        { time: "11:00 - 12:30", title: "Keynote: Past President General Muhammed Sani Abdullahi" },
        { time: "12:30 - 14:00", title: "Networking Lunch" },
        { time: "14:00 - 16:00", title: "Leadership Development Workshop" },
        { time: "16:00 - 18:00", title: "Strategic Planning Session" }
      ]
    },
    {
      day: "November 29, 2025", 
      events: [
        { time: "09:00 - 10:30", title: "Alumni Success Stories Panel" },
        { time: "10:30 - 12:00", title: "Professional Development Workshop" },
        { time: "12:00 - 13:30", title: "Lunch & Networking" },
        { time: "13:30 - 16:00", title: "Chapter Development & Collaboration" },
        { time: "16:00 - 18:00", title: "Free Time / Optional Activities" },
        { time: "19:00 - 22:00", title: "Gala Dinner & Awards Ceremony" }
      ]
    },
    {
      day: "November 30, 2025",
      events: [
        { time: "09:00 - 10:30", title: "Future Vision & Action Planning" },
        { time: "10:30 - 12:00", title: "Closing Ceremony & Commitments" },
        { time: "12:00 - 13:00", title: "Farewell Lunch" },
        { time: "13:00 - 14:00", title: "Group Photo & Departure" }
      ]
    }
  ]
};

async function createPGConferenceEvent() {
  console.log("🚀 Creating President General's Conference Event...");
  
  try {
    // First, let's check if the event already exists
    const existingEvent = await prisma.event.findFirst({
      where: {
        title: {
          contains: "President General's Conference"
        }
      }
    });

    if (existingEvent) {
      console.log("✅ Event already exists!");
      console.log("Event ID:", existingEvent.id);
      console.log("Title:", existingEvent.title);
      console.log("Status:", existingEvent.status);
      return;
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        ...PG_CONFERENCE_EVENT,
        tags: PG_CONFERENCE_EVENT.tags,
        includes: PG_CONFERENCE_EVENT.includes,
        schedule: PG_CONFERENCE_EVENT.schedule
      }
    });

    console.log("✅ Event created successfully!");
    console.log("Event ID:", event.id);
    console.log("Title:", event.title);
    console.log("Status:", event.status);
    console.log("\n🌐 View event at: https://exjam-alumni-kso1t0ehf-gms-projects-06b0f5db.vercel.app/events");
    console.log("🏠 Check homepage: https://exjam-alumni-kso1t0ehf-gms-projects-06b0f5db.vercel.app");

  } catch (error) {
    console.log("❌ Error creating event:", error.message);
    console.log("Error details:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createPGConferenceEvent();
