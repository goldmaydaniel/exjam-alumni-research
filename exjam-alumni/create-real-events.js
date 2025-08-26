const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createRealEvents() {
  console.log("Creating real AFMS/AFGMS events in database...");

  try {
    // Delete any existing test events
    const deleted = await prisma.event.deleteMany({});
    console.log(`Removed ${deleted.count} existing events`);

    // Create President General's Conference 2025
    const pgConference = await prisma.event.create({
      data: {
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
        price: 50000,
        earlyBirdPrice: 40000,
        earlyBirdDeadline: new Date("2025-10-31T23:59:59"),
        status: "PUBLISHED",
        tags: ["Conference", "Annual Event", "Networking", "PG2025", "Abuja"],
      },
    });

    // Create AFMS/AFGMS Joint Passing Out Parade
    const passingOut = await prisma.event.create({
      data: {
        id: uuidv4(),
        title: "AFMS/AFGMS Joint Passing Out Parade 2025",
        shortDescription: "Celebrating the graduation of the newest junior airmen and airwomen",
        description:
          "Join The ExJAM Association at the AFMS/AFGMS Joint Passing Out Parade 2025. This historic event celebrates the graduation of new junior airmen and airwomen from the Air Force Military School.\n\nEvent Schedule:\n\nWEDNESDAY, 23rd July 2025\n• Speech and Prize Giving Day\n• Venue: Nsikak Eduok Hall\n• Time: 10:00 AM\n\nFRIDAY, 25th July 2025\n• Beating of the Retreat\n• Venue: AFMS Parade Ground\n• Time: 5:00 PM\n\nSATURDAY, 26th July 2025\n• Passing Out Parade\n• Venue: AFMS Parade Ground\n• Time: 9:00 AM\n\n• ExJAM Annual General Meeting (AGM)\n• Venue: Nsikak Eduok Hall\n• Time: 2:00 PM\n\nThis is a unique opportunity to witness the next generation of airmen and airwomen as they complete their training and to reconnect with fellow alumni.",
        startDate: new Date("2025-07-23T09:00:00"),
        endDate: new Date("2025-07-26T18:00:00"),
        venue: "Air Force Military School",
        address: "AFMS Jos, Plateau State, Nigeria",
        capacity: 1000,
        price: 25000,
        earlyBirdPrice: 20000,
        earlyBirdDeadline: new Date("2025-06-30T23:59:59"),
        status: "PUBLISHED",
        tags: ["Passing Out", "AFMS", "Jos", "AGM", "Graduation", "Parade"],
      },
    });

    console.log("✅ Successfully created real events:\n");
    console.log(`1. ${pgConference.title}`);
    console.log(`   ID: ${pgConference.id}`);
    console.log(
      `   Date: ${pgConference.startDate.toLocaleDateString()} - ${pgConference.endDate.toLocaleDateString()}`
    );
    console.log(`   Venue: ${pgConference.venue}`);
    console.log(
      `   Price: ₦${pgConference.price.toLocaleString()} (Early Bird: ₦${pgConference.earlyBirdPrice?.toLocaleString()})\n`
    );

    console.log(`2. ${passingOut.title}`);
    console.log(`   ID: ${passingOut.id}`);
    console.log(
      `   Date: ${passingOut.startDate.toLocaleDateString()} - ${passingOut.endDate.toLocaleDateString()}`
    );
    console.log(`   Venue: ${passingOut.venue}`);
    console.log(
      `   Price: ₦${passingOut.price.toLocaleString()} (Early Bird: ₦${passingOut.earlyBirdPrice?.toLocaleString()})`
    );
  } catch (err) {
    console.error("Error creating events:", err);
  } finally {
    await prisma.$disconnect();
  }
}

createRealEvents();
