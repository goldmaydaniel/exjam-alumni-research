-- Create waitlist table
CREATE TABLE IF NOT EXISTS "Waitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ticketType" TEXT NOT NULL DEFAULT 'REGULAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for user-event combination
CREATE UNIQUE INDEX IF NOT EXISTS "Waitlist_userId_eventId_key" ON "Waitlist"("userId", "eventId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "Waitlist_eventId_idx" ON "Waitlist"("eventId");
CREATE INDEX IF NOT EXISTS "Waitlist_userId_idx" ON "Waitlist"("userId");
CREATE INDEX IF NOT EXISTS "Waitlist_status_idx" ON "Waitlist"("status");
CREATE INDEX IF NOT EXISTS "Waitlist_position_idx" ON "Waitlist"("position");
CREATE INDEX IF NOT EXISTS "Waitlist_eventId_status_position_idx" ON "Waitlist"("eventId", "status", "position");
CREATE INDEX IF NOT EXISTS "Waitlist_createdAt_idx" ON "Waitlist"("createdAt");

-- Add foreign key constraints
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add check constraints for valid status and ticket type values
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_status_check" CHECK ("status" IN ('ACTIVE', 'CONVERTED', 'EXPIRED', 'CANCELLED'));
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_ticketType_check" CHECK ("ticketType" IN ('REGULAR', 'VIP', 'STUDENT'));