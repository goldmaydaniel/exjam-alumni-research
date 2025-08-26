const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createEvents() {
  console.log("Creating AFMS/AFGMS events...");

  try {
    // Delete existing events
    await prisma.event.deleteMany({});
    console.log("Cleared existing events");

    // Create new events
    const events = await prisma.event.createMany({
      data: [
        {
          title: "President General's Conference 2025",
          shortDescription: "The flagship annual gathering of all ExJAM members worldwide",
          description:
            "Join us for the President General's Conference 2025 at the NAF Conference Centre, Abuja. This is our premier annual event bringing together ExJAM alumni from across the globe for three days of networking, celebration, and strategic planning for our association's future.",
          startDate: new Date("2025-11-28T09:00:00"),
          endDate: new Date("2025-11-30T18:00:00"),
          venue: "NAF Conference Centre, Abuja",
          address: "Abuja, FCT, Nigeria",
          capacity: 500,
          price: 50000,
          earlyBirdPrice: 40000,
          earlyBirdDeadline: new Date("2025-10-31T23:59:59"),
          status: "PUBLISHED",
          tags: ["Conference", "Annual Event", "Networking", "PG2025"],
          maxAttendees: 500,
        },
        {
          title: "AFMS/AFGMS Joint Passing Out Parade 2025",
          shortDescription: "Celebrating the graduation of the newest junior airmen and airwomen",
          description:
            "Join The ExJAM Association at the AFMS/AFGMS Joint Passing Out Parade 2025. This historic event celebrates the graduation of new junior airmen and airwomen.\n\nSchedule:\n• Wednesday, 23rd July: Speech and Prize Giving Day at Nsikak Eduok Hall\n• Friday, 25th July: Beating of the Retreat at AFMS Parade Ground\n• Saturday, 26th July: Passing Out Parade at AFMS Parade Ground\n• Saturday, 26th July: ExJAM AGM at Nsikak Eduok Hall",
          startDate: new Date("2025-07-23T09:00:00"),
          endDate: new Date("2025-07-26T18:00:00"),
          venue: "AFMS Parade Ground",
          address: "Air Force Military School, Jos, Plateau State",
          capacity: 1000,
          price: 25000,
          earlyBirdPrice: 20000,
          earlyBirdDeadline: new Date("2025-06-30T23:59:59"),
          status: "PUBLISHED",
          tags: ["Passing Out Parade", "AFMS", "Jos", "AGM", "Graduation"],
          maxAttendees: 1000,
        },
      ],
    });

    console.log(`✅ Successfully created ${events.count} events`);

    // Fetch and display the events
    const allEvents = await prisma.event.findMany({
      orderBy: { startDate: "asc" },
    });

    console.log("\nCreated events:");
    allEvents.forEach((event) => {
      console.log(`\n📅 ${event.title}`);
      console.log(
        `   Date: ${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`
      );
      console.log(`   Venue: ${event.venue}`);
      console.log(`   Price: ₦${event.price.toLocaleString()}`);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

createEvents();
