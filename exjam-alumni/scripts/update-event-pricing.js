const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function updateEventPricing() {
  try {
    console.log("Updating all event prices to ₦20,000...");

    // Update all events to have ₦20,000 price
    const result = await prisma.event.updateMany({
      data: {
        price: 20000,
        earlyBirdPrice: 15000, // Early bird at ₦15,000
        capacity: 999999, // Effectively unlimited
      },
    });

    console.log(`✅ Updated ${result.count} events with new pricing`);

    // Fetch and display updated events
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        earlyBirdPrice: true,
        capacity: true,
      },
    });

    console.log("\n📋 Updated Events:");
    events.forEach((event) => {
      console.log(`- ${event.title}`);
      console.log(`  Price: ₦${event.price.toLocaleString()}`);
      console.log(`  Early Bird: ₦${event.earlyBirdPrice?.toLocaleString() || "N/A"}`);
    });
  } catch (error) {
    console.error("Error updating prices:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEventPricing();
