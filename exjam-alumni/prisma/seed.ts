import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Create or update admin user
  const adminPassword = await bcrypt.hash("ExJAMAdmin@2025!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@exjam.org.ng" },
    update: {
      password: adminPassword,
      role: "ADMIN",
      emailVerified: true,
      updatedAt: new Date(),
    },
    create: {
      id: "admin-user-001",
      email: "admin@exjam.org.ng",
      password: adminPassword,
      firstName: "Association",
      lastName: "Administrator",
      fullName: "Association Administrator",
      serviceNumber: "AFMS 80/0001",
      squadron: "GREEN",
      phone: "+234 901 234 5678",
      chapter: "Abuja",
      currentLocation: "Abuja, FCT, Nigeria",
      emergencyContact: "+234 903 456 7890",
      graduationYear: "1980",
      currentOccupation: "Association Administrator",
      company: "The ExJAM Association",
      role: "ADMIN",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("Created admin user:", admin.email);

  // Create or update the main event
  const event = await prisma.event.upsert({
    where: { id: "exjam-conference-2025" },
    update: {
      updatedAt: new Date(),
    },
    create: {
      id: "exjam-conference-2025",
      title: "ExJAM Alumni Research Conference 2025",
      description:
        "Join us for the premier gathering of ExJAM Alumni featuring research presentations, networking opportunities, and keynote speeches from distinguished alumni.",
      shortDescription: "Annual ExJAM Alumni Conference with research presentations and networking",
      startDate: new Date("2025-04-15T09:00:00Z"),
      endDate: new Date("2025-04-17T17:00:00Z"),
      venue: "Lagos Conference Center",
      address: "Victoria Island, Lagos, Lagos State, Nigeria",
      capacity: 500,
      price: 20000,
      imageUrl: "/conference-banner.jpg",
      status: "PUBLISHED",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("Created event:", event.title);

  // Create or update a sample member (for testing purposes only)
  const memberPassword = await bcrypt.hash("Member@2025!", 10);
  const member = await prisma.user.upsert({
    where: { email: "member@exjam.org.ng" },
    update: {
      password: memberPassword,
      updatedAt: new Date(),
    },
    create: {
      id: "sample-member-001",
      email: "member@exjam.org.ng",
      password: memberPassword,
      firstName: "Samuel",
      lastName: "Okafor",
      fullName: "Samuel Okafor",
      serviceNumber: "AFMS 95/0234",
      squadron: "RED",
      phone: "+234 803 567 8901",
      chapter: "Abuja",
      currentLocation: "Abuja, FCT Nigeria",
      emergencyContact: "+234 804 678 9012",
      graduationYear: "1995",
      currentOccupation: "Engineer",
      company: "Federal Ministry of Defence",
      role: "ATTENDEE",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("Created sample member:", member.email);

  // Create or update a sample registration
  const registration = await prisma.registration.upsert({
    where: { id: "reg-001" },
    update: {
      updatedAt: new Date(),
    },
    create: {
      id: "reg-001",
      userId: member.id,
      eventId: event.id,
      ticketType: "REGULAR",
      status: "CONFIRMED",
      arrivalDate: "2025-04-14",
      departureDate: "2025-04-18",
      expectations: "Looking forward to networking with fellow alumni",
      specialRequests: "None",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("Created sample registration:", registration.id);

  // Create payment for the registration
  const payment = await prisma.payment.create({
    data: {
      id: "pay-001",
      registrationId: registration.id,
      userId: member.id,
      amount: 20000,
      currency: "NGN",
      provider: "paystack",
      reference: "ref_" + Date.now(),
      status: "SUCCESS",
      metadata: {
        paystack_reference: "test_reference",
        paid_at: new Date().toISOString(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("Created payment:", payment.id);

  // Create ticket for the registration
  const ticket = await prisma.ticket.create({
    data: {
      id: "ticket-001",
      registrationId: registration.id,
      userId: member.id,
      eventId: event.id,
      ticketNumber: "EXJAM2025-0001",
      qrCode:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      checkedIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("Created ticket:", ticket.ticketNumber);

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
