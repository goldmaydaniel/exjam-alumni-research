const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');
require('dotenv').config();

async function createTables() {
  const prisma = new PrismaClient().$extends(withAccelerate());

  try {
    console.log('Creating database tables...\n');

    // Create ENUMs first
    console.log('Creating ENUM types...');
    await prisma.$executeRaw`
      CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
    `;
    await prisma.$executeRaw`
      CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
    `;
    await prisma.$executeRaw`
      CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED');
    `;
    await prisma.$executeRaw`
      CREATE TYPE "Squadron" AS ENUM ('GREEN', 'RED', 'PURPLE', 'YELLOW', 'DORNIER', 'PUMA');
    `;
    await prisma.$executeRaw`
      CREATE TYPE "TicketType" AS ENUM ('REGULAR', 'VIP', 'STUDENT');
    `;
    await prisma.$executeRaw`
      CREATE TYPE "UserRole" AS ENUM ('GUEST_MEMBER', 'VERIFIED_MEMBER', 'ATTENDEE', 'SPEAKER', 'ORGANIZER', 'ADMIN');
    `;
    await prisma.$executeRaw`
      CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
    `;
    await prisma.$executeRaw`
      CREATE TYPE "NotificationType" AS ENUM ('EVENT_REMINDER', 'PAYMENT_CONFIRMATION', 'REGISTRATION_CONFIRMED', 'EVENT_CANCELLED', 'EVENT_UPDATED', 'SYSTEM_ANNOUNCEMENT', 'ADMIN_MESSAGE', 'WAITLIST_NOTIFICATION', 'WAITLIST_CONVERTED');
    `;
    await prisma.$executeRaw`
      CREATE TYPE "WaitlistStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'EXPIRED', 'CANCELLED');
    `;
    console.log('✅ ENUM types created');

    // Create User table
    console.log('Creating User table...');
    await prisma.$executeRaw`
      CREATE TABLE "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "fullName" TEXT,
        "serviceNumber" TEXT,
        "set" TEXT,
        "squadron" "Squadron",
        "phone" TEXT,
        "chapter" TEXT,
        "currentLocation" TEXT,
        "emergencyContact" TEXT,
        "graduationYear" TEXT,
        "currentOccupation" TEXT,
        "company" TEXT,
        "role" "UserRole" NOT NULL DEFAULT 'GUEST_MEMBER',
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "bio" TEXT,
        "emailVerificationExpiry" TIMESTAMP(3),
        "emailVerificationToken" TEXT,
        "lastLogin" TIMESTAMP(3),
        "profilePhoto" TEXT,
        "profilePhotoPath" TEXT,
        "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Create User indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX "User_email_key" ON "User"("email");`;
    await prisma.$executeRaw`CREATE INDEX "User_serviceNumber_idx" ON "User"("serviceNumber");`;
    await prisma.$executeRaw`CREATE INDEX "User_role_idx" ON "User"("role");`;
    await prisma.$executeRaw`CREATE INDEX "User_status_idx" ON "User"("status");`;
    await prisma.$executeRaw`CREATE INDEX "User_squadron_idx" ON "User"("squadron");`;
    await prisma.$executeRaw`CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");`;
    console.log('✅ User table created');

    // Create Event table
    console.log('Creating Event table...');
    await prisma.$executeRaw`
      CREATE TABLE "Event" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "shortDescription" TEXT,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "venue" TEXT NOT NULL,
        "address" TEXT,
        "capacity" INTEGER NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "earlyBirdPrice" DECIMAL(10,2),
        "earlyBirdDeadline" TIMESTAMP(3),
        "imageUrl" TEXT,
        "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "organizerId" TEXT,
        "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
        CONSTRAINT "Event_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `;
    
    // Create Event indexes
    await prisma.$executeRaw`CREATE INDEX "Event_status_idx" ON "Event"("status");`;
    await prisma.$executeRaw`CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");`;
    await prisma.$executeRaw`CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");`;
    console.log('✅ Event table created');

    // Create Registration table
    console.log('Creating Registration table...');
    await prisma.$executeRaw`
      CREATE TABLE "Registration" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "eventId" TEXT NOT NULL,
        "ticketType" "TicketType" NOT NULL DEFAULT 'REGULAR',
        "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
        "arrivalDate" TIMESTAMP(3),
        "departureDate" TIMESTAMP(3),
        "expectations" TEXT,
        "specialRequests" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "photoUrl" TEXT,
        CONSTRAINT "Registration_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    // Create Registration indexes
    await prisma.$executeRaw`CREATE INDEX "Registration_userId_idx" ON "Registration"("userId");`;
    await prisma.$executeRaw`CREATE INDEX "Registration_eventId_idx" ON "Registration"("eventId");`;
    await prisma.$executeRaw`CREATE INDEX "Registration_status_idx" ON "Registration"("status");`;
    console.log('✅ Registration table created');

    // Create Payment table
    console.log('Creating Payment table...');
    await prisma.$executeRaw`
      CREATE TABLE "Payment" (
        "id" TEXT NOT NULL,
        "registrationId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "provider" TEXT NOT NULL DEFAULT 'paystack',
        "reference" TEXT NOT NULL,
        "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    // Create Payment indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX "Payment_registrationId_key" ON "Payment"("registrationId");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");`;
    await prisma.$executeRaw`CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");`;
    await prisma.$executeRaw`CREATE INDEX "Payment_status_idx" ON "Payment"("status");`;
    console.log('✅ Payment table created');

    // Create Ticket table
    console.log('Creating Ticket table...');
    await prisma.$executeRaw`
      CREATE TABLE "Ticket" (
        "id" TEXT NOT NULL,
        "registrationId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "eventId" TEXT NOT NULL,
        "ticketNumber" TEXT NOT NULL,
        "qrCode" TEXT NOT NULL,
        "checkedIn" BOOLEAN NOT NULL DEFAULT false,
        "checkedInAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Ticket_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    // Create Ticket indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX "Ticket_registrationId_key" ON "Ticket"("registrationId");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");`;
    await prisma.$executeRaw`CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");`;
    await prisma.$executeRaw`CREATE INDEX "Ticket_eventId_idx" ON "Ticket"("eventId");`;
    console.log('✅ Ticket table created');

    // Create AuditLog table
    console.log('Creating AuditLog table...');
    await prisma.$executeRaw`
      CREATE TABLE "AuditLog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "userId" TEXT,
        "action" TEXT NOT NULL,
        "entity" TEXT NOT NULL,
        "entityId" TEXT,
        "changes" JSONB,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `;
    
    await prisma.$executeRaw`CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");`;
    await prisma.$executeRaw`CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");`;
    console.log('✅ AuditLog table created');

    // Create Notification table
    console.log('Creating Notification table...');
    await prisma.$executeRaw`
      CREATE TABLE "Notification" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        "type" "NotificationType" NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "readAt" TIMESTAMP(3),
        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    await prisma.$executeRaw`CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");`;
    await prisma.$executeRaw`CREATE INDEX "Notification_read_idx" ON "Notification"("read");`;
    console.log('✅ Notification table created');

    // Create Waitlist table
    console.log('Creating Waitlist table...');
    await prisma.$executeRaw`
      CREATE TABLE "Waitlist" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        "eventId" TEXT NOT NULL,
        "position" INTEGER NOT NULL,
        "status" "WaitlistStatus" NOT NULL DEFAULT 'ACTIVE',
        "ticketType" "TicketType" NOT NULL DEFAULT 'REGULAR',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "notifiedAt" TIMESTAMP(3),
        "convertedAt" TIMESTAMP(3),
        CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Waitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Waitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    await prisma.$executeRaw`CREATE UNIQUE INDEX "Waitlist_userId_eventId_key" ON "Waitlist"("userId", "eventId");`;
    await prisma.$executeRaw`CREATE INDEX "Waitlist_eventId_idx" ON "Waitlist"("eventId");`;
    console.log('✅ Waitlist table created');

    // Create ContactMessage table
    console.log('Creating ContactMessage table...');
    await prisma.$executeRaw`
      CREATE TABLE "ContactMessage" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
      );
    `;
    
    await prisma.$executeRaw`CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");`;
    await prisma.$executeRaw`CREATE INDEX "ContactMessage_email_idx" ON "ContactMessage"("email");`;
    console.log('✅ ContactMessage table created');

    // Create SiteConfig table
    console.log('Creating SiteConfig table...');
    await prisma.$executeRaw`
      CREATE TABLE "site_config" (
        "id" INTEGER NOT NULL DEFAULT 1,
        "site_name" TEXT NOT NULL DEFAULT 'ExJAM Alumni Association',
        "main_logo_url" TEXT,
        "footer_logo_url" TEXT,
        "favicon_url" TEXT,
        "primary_color" TEXT DEFAULT '#1e40af',
        "secondary_color" TEXT DEFAULT '#3b82f6',
        "hero_title" TEXT DEFAULT 'Welcome to ExJAM Alumni',
        "hero_subtitle" TEXT DEFAULT 'Connecting Nigerian Air Force Academy Alumni',
        "contact_email" TEXT,
        "contact_phone" TEXT,
        "social_facebook" TEXT,
        "social_twitter" TEXT,
        "social_linkedin" TEXT,
        "social_instagram" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ SiteConfig table created');

    // Add triggers for updatedAt
    console.log('Creating update triggers...');
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    const tablesWithUpdatedAt = ['User', 'Event', 'Registration', 'Payment', 'Ticket', 'Waitlist', 'ContactMessage', 'site_config'];
    for (const table of tablesWithUpdatedAt) {
      const updatedAtColumn = table === 'site_config' ? 'updated_at' : 'updatedAt';
      await prisma.$executeRaw`
        CREATE TRIGGER update_${Prisma.raw(table)}_updated_at BEFORE UPDATE ON "${Prisma.raw(table)}"
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
      `;
    }
    console.log('✅ Update triggers created');

    console.log('\n✅ All tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error.message);
    if (error.code === 'P2010') {
      console.log('\n💡 Some tables or types may already exist. This is normal if running multiple times.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTables();