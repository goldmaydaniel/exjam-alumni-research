// Create a test event for payment testing
const BASE_URL = "http://localhost:3001";

async function createTestEvent() {
  console.log("🎪 Creating Test Event for Payment Testing...");

  // Login first
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@exjamalumni.org",
      password: "Admin@2025!",
    }),
  });

  if (!loginResponse.ok) {
    console.log("❌ Login failed");
    return;
  }

  const { token } = await loginResponse.json();
  console.log("✅ Login successful");

  // Create event
  const eventData = {
    title: "PGCON 2025 Conference",
    description:
      "Premier technology conference for professionals and alumni. Join us for a day of learning, networking, and innovation with industry leaders and experts.",
    type: "CONFERENCE",
    startDate: "2025-03-15T09:00:00.000Z",
    endDate: "2025-03-15T18:00:00.000Z",
    venue: "Lagos Continental Hotel, Victoria Island",
    capacity: 500,
    price: 25000,
    featured: true,
    registrationDeadline: "2025-03-10T23:59:59.000Z",
    tags: ["conference", "technology", "networking", "professional-development"],
  };

  const createResponse = await fetch(`${BASE_URL}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });

  if (createResponse.ok) {
    const event = await createResponse.json();
    console.log("✅ Test event created successfully!");
    console.log(`   📅 Event: ${event.title}`);
    console.log(`   💰 Price: ₦${event.price.toLocaleString()}`);
    console.log(`   🏢 Venue: ${event.venue}`);
    console.log(`   🎫 Capacity: ${event.capacity}`);
    console.log(`   📍 Event ID: ${event.id}`);

    console.log("\n🚀 Ready for payment testing!");
    console.log("   Run: node test-paystack-integration.js");
  } else {
    console.log("❌ Failed to create event");
    const error = await createResponse.text();
    console.log("Error:", error);
  }
}

createTestEvent().catch(console.error);
