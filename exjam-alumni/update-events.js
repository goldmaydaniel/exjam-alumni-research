const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const prisma = new PrismaClient();

async function updateEvents() {
  console.log("Updating events with correct pricing and adding past events...");

  try {
    // Delete all existing events
    await prisma.event.deleteMany({});
    console.log("Cleared existing events");

    // Create updated events
    const events = [
      // UPCOMING EVENTS
      {
        id: uuidv4(),
        title: "President General's Conference 2025",
        shortDescription: "The flagship annual gathering of all ExJAM members worldwide",
        description:
          "Join us for the President General's Conference 2025 at the NAF Conference Centre, Abuja. This is our premier annual event bringing together ExJAM alumni from across the globe for three days of networking, celebration, and strategic planning for our association's future.\n\nHighlights:\n• Opening ceremony with distinguished guests\n• Strategic planning sessions\n• Squadron reunions\n• Awards and recognition night\n• Business networking forum\n• Gala dinner",
        startDate: new Date("2025-11-28T09:00:00"),
        endDate: new Date("2025-11-30T18:00:00"),
        venue: "NAF Conference Centre",
        address: "Nigerian Air Force Base, Abuja, FCT, Nigeria",
        capacity: 500,
        price: 20000, // Updated to 20,000
        earlyBirdPrice: 15000, // Early bird at 15,000
        earlyBirdDeadline: new Date("2025-10-31T23:59:59"),
        status: "PUBLISHED",
        tags: ["Conference", "Annual Event", "Networking", "PG2025", "Abuja"],
      },
      {
        id: uuidv4(),
        title: "AFMS/AFGMS Joint Passing Out Parade 2025",
        shortDescription: "Celebrating the graduation of the newest junior airmen and airwomen",
        description:
          "Join The ExJAM Association at the AFMS/AFGMS Joint Passing Out Parade 2025. This historic event celebrates the graduation of new junior airmen and airwomen from the Air Force Military School.\n\n📅 Event Schedule:\n\nWEDNESDAY, 23rd July 2025\n• Speech and Prize Giving Day\n• Venue: Nsikak Eduok Hall\n• Time: 10:00 AM\n\nFRIDAY, 25th July 2025\n• Beating of the Retreat\n• Venue: AFMS Parade Ground\n• Time: 5:00 PM\n\nSATURDAY, 26th July 2025\n• Passing Out Parade\n• Venue: AFMS Parade Ground\n• Time: 9:00 AM\n\n• ExJAM Annual General Meeting (AGM)\n• Venue: Nsikak Eduok Hall\n• Time: 2:00 PM\n\n🎯 FREE ENTRY for all ExJAM members and their families!",
        startDate: new Date("2025-07-23T09:00:00"),
        endDate: new Date("2025-07-26T18:00:00"),
        venue: "Air Force Military School",
        address: "AFMS Jos, Plateau State, Nigeria",
        capacity: 1000,
        price: 0, // FREE
        earlyBirdPrice: null,
        earlyBirdDeadline: null,
        status: "PUBLISHED",
        tags: ["FREE", "Passing Out", "AFMS", "Jos", "AGM", "Graduation", "Parade"],
      },

      // PAST EVENTS
      {
        id: uuidv4(),
        title: "AFMS/AFGMS Joint Passing Out Parade 2024",
        shortDescription: "The 2024 graduation ceremony for new junior airmen and airwomen",
        description:
          "A memorable ceremony celebrating the graduation of Set 2024 junior airmen and airwomen. The event featured the traditional passing out parade, awards ceremony, and ExJAM AGM.",
        startDate: new Date("2024-07-24T09:00:00"),
        endDate: new Date("2024-07-27T18:00:00"),
        venue: "Air Force Military School",
        address: "AFMS Jos, Plateau State, Nigeria",
        capacity: 1000,
        price: 0,
        earlyBirdPrice: null,
        earlyBirdDeadline: null,
        status: "COMPLETED",
        tags: ["FREE", "Past Event", "AFMS", "Jos", "Graduation", "2024"],
      },
      {
        id: uuidv4(),
        title: "President General's Conference 2024",
        shortDescription: "The 2024 annual conference held in Lagos",
        description:
          "The successful 2024 President General's Conference brought together over 300 ExJAM members from across Nigeria and the diaspora. The conference featured keynote speeches, networking sessions, and strategic planning for the association's future.",
        startDate: new Date("2024-12-13T09:00:00"),
        endDate: new Date("2024-12-15T18:00:00"),
        venue: "Eko Hotels & Suites",
        address: "Victoria Island, Lagos, Nigeria",
        capacity: 400,
        price: 15000,
        earlyBirdPrice: 12000,
        earlyBirdDeadline: new Date("2024-11-30T23:59:59"),
        status: "COMPLETED",
        tags: ["Past Event", "Conference", "Lagos", "PG2024", "Networking"],
      },
      {
        id: uuidv4(),
        title: "ExJAM Northern Chapter Reunion 2024",
        shortDescription: "Regional gathering for ExJAM members in Northern Nigeria",
        description:
          "A successful regional reunion bringing together ExJAM members from the northern states. The event featured networking, cultural displays, and planning for future chapter activities.",
        startDate: new Date("2024-09-14T10:00:00"),
        endDate: new Date("2024-09-14T18:00:00"),
        venue: "Transcorp Hilton Abuja",
        address: "1 Aguiyi Ironsi St, Maitama, Abuja",
        capacity: 200,
        price: 0,
        earlyBirdPrice: null,
        earlyBirdDeadline: null,
        status: "COMPLETED",
        tags: ["FREE", "Past Event", "Regional", "Abuja", "Northern Chapter"],
      },
      {
        id: uuidv4(),
        title: "AFMS Founders Day Celebration 2024",
        shortDescription: "Commemorating the founding of Air Force Military School",
        description:
          "A special celebration marking the 44th anniversary of the establishment of Air Force Military School Jos. The event included a memorial service, cultural displays, and alumni testimonials.",
        startDate: new Date("2024-08-18T09:00:00"),
        endDate: new Date("2024-08-18T17:00:00"),
        venue: "AFMS Chapel",
        address: "Air Force Military School, Jos, Plateau State",
        capacity: 300,
        price: 0,
        earlyBirdPrice: null,
        earlyBirdDeadline: null,
        status: "COMPLETED",
        tags: ["FREE", "Past Event", "Founders Day", "AFMS", "Jos", "Anniversary"],
      },
    ];

    // Create all events
    const createdEvents = await Promise.all(
      events.map((event) => prisma.event.create({ data: event }))
    );

    console.log(`✅ Successfully created ${createdEvents.length} events:\n`);

    // Group and display events
    const upcomingEvents = createdEvents.filter((e) => e.status === "PUBLISHED");
    const pastEvents = createdEvents.filter((e) => e.status === "COMPLETED");

    console.log("🔮 UPCOMING EVENTS:");
    upcomingEvents.forEach((event) => {
      const priceText = event.price === 0 ? "FREE" : `₦${event.price.toLocaleString()}`;
      const earlyBirdText = event.earlyBirdPrice
        ? ` (Early Bird: ₦${event.earlyBirdPrice.toLocaleString()})`
        : "";
      console.log(`  • ${event.title}`);
      console.log(
        `    Date: ${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`
      );
      console.log(`    Venue: ${event.venue}`);
      console.log(`    Price: ${priceText}${earlyBirdText}\n`);
    });

    console.log("📚 PAST EVENTS:");
    pastEvents.forEach((event) => {
      console.log(`  • ${event.title} (${event.startDate.getFullYear()})`);
      console.log(`    Venue: ${event.venue}`);
    });
  } catch (err) {
    console.error("Error updating events:", err);
  } finally {
    await prisma.$disconnect();
  }
}

updateEvents();
