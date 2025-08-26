-- Create ENUM types
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED');
CREATE TYPE "Squadron" AS ENUM ('GREEN', 'RED', 'PURPLE', 'YELLOW', 'DORNIER', 'PUMA');
CREATE TYPE "TicketType" AS ENUM ('REGULAR', 'VIP', 'STUDENT');
CREATE TYPE "UserRole" AS ENUM ('GUEST_MEMBER', 'VERIFIED_MEMBER', 'ATTENDEE', 'SPEAKER', 'ORGANIZER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "NotificationType" AS ENUM ('EVENT_REMINDER', 'PAYMENT_CONFIRMATION', 'REGISTRATION_CONFIRMED', 'EVENT_CANCELLED', 'EVENT_UPDATED', 'SYSTEM_ANNOUNCEMENT', 'ADMIN_MESSAGE', 'WAITLIST_NOTIFICATION', 'WAITLIST_CONVERTED');
CREATE TYPE "WaitlistStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'EXPIRED', 'CANCELLED');

-- Create User table
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "bio" TEXT,
  "emailVerificationExpiry" TIMESTAMP(3),
  "emailVerificationToken" TEXT,
  "lastLogin" TIMESTAMP(3),
  "profilePhoto" TEXT,
  "profilePhotoPath" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create User indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_serviceNumber_idx" ON "User"("serviceNumber");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_squadron_idx" ON "User"("squadron");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "User_lastLogin_idx" ON "User"("lastLogin");
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
CREATE INDEX "User_squadron_status_idx" ON "User"("squadron", "status");
CREATE INDEX "User_graduationYear_idx" ON "User"("graduationYear");
CREATE INDEX "User_currentLocation_idx" ON "User"("currentLocation");
CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");

-- Create Event table
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizerId" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create Event indexes
CREATE INDEX "Event_status_idx" ON "Event"("status");
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");
CREATE INDEX "Event_endDate_idx" ON "Event"("endDate");
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");
CREATE INDEX "Event_status_startDate_idx" ON "Event"("status", "startDate");
CREATE INDEX "Event_capacity_idx" ON "Event"("capacity");
CREATE INDEX "Event_venue_idx" ON "Event"("venue");

-- Create Registration table
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "photoUrl" TEXT,
  CONSTRAINT "Registration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Registration indexes
CREATE INDEX "Registration_userId_idx" ON "Registration"("userId");
CREATE INDEX "Registration_eventId_idx" ON "Registration"("eventId");
CREATE INDEX "Registration_status_idx" ON "Registration"("status");
CREATE INDEX "Registration_createdAt_idx" ON "Registration"("createdAt");
CREATE INDEX "Registration_eventId_status_idx" ON "Registration"("eventId", "status");
CREATE INDEX "Registration_userId_status_idx" ON "Registration"("userId", "status");
CREATE INDEX "Registration_arrivalDate_idx" ON "Registration"("arrivalDate");
CREATE INDEX "Registration_departureDate_idx" ON "Registration"("departureDate");

-- Create Payment table
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Payment indexes
CREATE UNIQUE INDEX "Payment_registrationId_key" ON "Payment"("registrationId");
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX "Payment_reference_idx" ON "Payment"("reference");
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- Create Ticket table
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Ticket_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Ticket indexes
CREATE UNIQUE INDEX "Ticket_registrationId_key" ON "Ticket"("registrationId");
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");
CREATE INDEX "Ticket_eventId_idx" ON "Ticket"("eventId");
CREATE INDEX "Ticket_ticketNumber_idx" ON "Ticket"("ticketNumber");
CREATE INDEX "Ticket_checkedIn_idx" ON "Ticket"("checkedIn");
CREATE INDEX "Ticket_eventId_checkedIn_idx" ON "Ticket"("eventId", "checkedIn");
CREATE INDEX "Ticket_checkedInAt_idx" ON "Ticket"("checkedInAt");

-- Create AuditLog table
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

-- Create AuditLog indexes
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- Create Notification table
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

-- Create Notification indexes
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- Create Waitlist table
CREATE TABLE "Waitlist" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "WaitlistStatus" NOT NULL DEFAULT 'ACTIVE',
  "ticketType" "TicketType" NOT NULL DEFAULT 'REGULAR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notifiedAt" TIMESTAMP(3),
  "convertedAt" TIMESTAMP(3),
  CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Waitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Waitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Waitlist indexes
CREATE UNIQUE INDEX "Waitlist_userId_eventId_key" ON "Waitlist"("userId", "eventId");
CREATE INDEX "Waitlist_eventId_idx" ON "Waitlist"("eventId");
CREATE INDEX "Waitlist_userId_idx" ON "Waitlist"("userId");
CREATE INDEX "Waitlist_status_idx" ON "Waitlist"("status");
CREATE INDEX "Waitlist_position_idx" ON "Waitlist"("position");
CREATE INDEX "Waitlist_eventId_status_position_idx" ON "Waitlist"("eventId", "status", "position");
CREATE INDEX "Waitlist_createdAt_idx" ON "Waitlist"("createdAt");

-- Create ContactMessage table
CREATE TABLE "ContactMessage" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- Create ContactMessage indexes
CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");
CREATE INDEX "ContactMessage_email_idx" ON "ContactMessage"("email");
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- Create SiteConfig table
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
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update trigger for tables with updatedAt
CREATE TRIGGER update_User_updated_at BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_Event_updated_at BEFORE UPDATE ON "Event"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_Registration_updated_at BEFORE UPDATE ON "Registration"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_Payment_updated_at BEFORE UPDATE ON "Payment"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_Ticket_updated_at BEFORE UPDATE ON "Ticket"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_Waitlist_updated_at BEFORE UPDATE ON "Waitlist"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ContactMessage_updated_at BEFORE UPDATE ON "ContactMessage"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create update trigger for site_config with updated_at column name
CREATE OR REPLACE FUNCTION update_site_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON "site_config"
FOR EACH ROW EXECUTE PROCEDURE update_site_config_updated_at();

-- Insert default site config
INSERT INTO "site_config" ("id") VALUES (1) ON CONFLICT DO NOTHING;