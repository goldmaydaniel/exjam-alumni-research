const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function createTestEvents() {
  try {
    console.log("Creating test events...");

    // Create PG Conference 2025
    const pgConference = await prisma.event.upsert({
      where: { id: "pg-conference-2025" },
      update: {},
      create: {
        id: "pg-conference-2025",
        title: "PG Conference 2025",
        shortDescription: "Annual Post-Graduate Alumni Conference",
        description: `Join us for the 2025 Post-Graduate Alumni Conference! This year's theme focuses on "Leadership in the Digital Age" with distinguished speakers, networking opportunities, and squadron reunions.

Event Highlights:
• Keynote speeches from distinguished alumni
• Squadron reunion sessions
• Professional networking opportunities
• Career development workshops
• Gala dinner and awards ceremony`,
        startDate: new Date("2025-09-15T09:00:00"),
        endDate: new Date("2025-09-17T18:00:00"),
        venue: "Transcorp Hilton",
        address: "1 Aguiyi Ironsi St, Maitama, Abuja",
        capacity: 500,
        price: 50000,
        earlyBirdPrice: 40000,
        earlyBirdDeadline: new Date("2025-08-01"),
        tags: ["conference", "networking", "alumni", "leadership"],
        status: "PUBLISHED",
        organizerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Created PG Conference 2025:", pgConference.id);

    // Create Squadron Reunion
    const squadronReunion = await prisma.event.upsert({
      where: { id: "squadron-reunion-2025" },
      update: {},
      create: {
        id: "squadron-reunion-2025",
        title: "Squadron Reunion 2025",
        shortDescription: "Annual squadron get-together for all Ex-Junior Airmen",
        description:
          "Reconnect with your squadron mates at the annual reunion event featuring sports, entertainment, and memorable experiences.",
        startDate: new Date("2025-12-20T10:00:00"),
        endDate: new Date("2025-12-20T22:00:00"),
        venue: "AFMS Old Site",
        address: "Nigerian Air Force Base, Jos, Plateau",
        capacity: 1000,
        price: 25000,
        earlyBirdPrice: 20000,
        earlyBirdDeadline: new Date("2025-11-15"),
        tags: ["reunion", "squadron", "networking", "social"],
        status: "PUBLISHED",
        organizerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Created Squadron Reunion 2025:", squadronReunion.id);

    // Create Mentorship Workshop
    const mentorshipWorkshop = await prisma.event.upsert({
      where: { id: "mentorship-workshop-2025" },
      update: {},
      create: {
        id: "mentorship-workshop-2025",
        title: "Alumni Mentorship Workshop",
        shortDescription: "Career guidance and mentorship for young alumni",
        description:
          "A workshop designed to connect experienced alumni with recent graduates for career guidance, professional development, and networking.",
        startDate: new Date("2025-07-05T09:00:00"),
        endDate: new Date("2025-07-05T17:00:00"),
        venue: "Lagos Continental Hotel",
        address: "Plot 52A, Kofo Abayomi St, Victoria Island, Lagos",
        capacity: 200,
        price: 15000,
        earlyBirdPrice: 10000,
        earlyBirdDeadline: new Date("2025-06-20"),
        tags: ["mentorship", "career", "workshop", "professional"],
        status: "PUBLISHED",
        organizerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Created Mentorship Workshop:", mentorshipWorkshop.id);

    console.log("\n✅ All test events created successfully!");

    // List all events
    const allEvents = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        capacity: true,
        _count: {
          select: { Registration: true },
        },
      },
    });

    console.log("\n📋 Current Events:");
    allEvents.forEach((event) => {
      console.log(`- ${event.title} (${event.id})`);
      console.log(
        `  Status: ${event.status}, Capacity: ${event.capacity}, Registrations: ${event._count.Registration}`
      );
    });
  } catch (error) {
    console.error("Error creating test events:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestEvents();
