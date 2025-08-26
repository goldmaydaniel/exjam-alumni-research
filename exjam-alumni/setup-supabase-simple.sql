-- ============================================
-- SIMPLE SUPABASE SETUP FOR PG CONFERENCE 2025
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a custom table for PG Conference registrations with all AFMS fields
CREATE TABLE IF NOT EXISTS "PGConferenceRegistration" (
  id TEXT PRIMARY KEY DEFAULT ('pgr_' || uuid_generate_v4()::text),
  "fullName" TEXT NOT NULL,
  "serviceNumber" TEXT,
  "graduationYear" TEXT NOT NULL,
  squadron TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  chapter TEXT NOT NULL,
  "currentLocation" TEXT NOT NULL,
  "emergencyContact" TEXT NOT NULL,
  "arrivalDate" TEXT NOT NULL,
  "departureDate" TEXT NOT NULL,
  expectations TEXT,
  "profilePhotoUrl" TEXT,
  "badgeStatus" TEXT DEFAULT 'PENDING' CHECK ("badgeStatus" IN ('PENDING', 'FULL')),
  "paymentStatus" TEXT DEFAULT 'UNPAID' CHECK ("paymentStatus" IN ('UNPAID', 'PAID', 'REFUNDED')),
  "paymentReference" TEXT,
  "registrationDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Connect to main registration system
  "registrationId" TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_pg_conference_email" ON "PGConferenceRegistration"(email);
CREATE INDEX IF NOT EXISTS "idx_pg_conference_badge_status" ON "PGConferenceRegistration"("badgeStatus");
CREATE INDEX IF NOT EXISTS "idx_pg_conference_payment_status" ON "PGConferenceRegistration"("paymentStatus");
CREATE INDEX IF NOT EXISTS "idx_pg_conference_payment_ref" ON "PGConferenceRegistration"("paymentReference");
CREATE INDEX IF NOT EXISTS "idx_pg_conference_graduation_year" ON "PGConferenceRegistration"("graduationYear");
CREATE INDEX IF NOT EXISTS "idx_pg_conference_squadron" ON "PGConferenceRegistration"(squadron);

-- Add RLS to PG Conference Registration table
ALTER TABLE "PGConferenceRegistration" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access for PG Conference registrations
DROP POLICY IF EXISTS "Allow read access for PG Conference registrations" ON "PGConferenceRegistration";
CREATE POLICY "Allow read access for PG Conference registrations"
  ON "PGConferenceRegistration"
  FOR SELECT
  USING (true);

-- Policy: Allow insert for new registrations
DROP POLICY IF EXISTS "Allow insert for PG Conference registrations" ON "PGConferenceRegistration";
CREATE POLICY "Allow insert for PG Conference registrations"
  ON "PGConferenceRegistration"
  FOR INSERT
  WITH CHECK (true);

-- Create table for payment bank details
CREATE TABLE IF NOT EXISTS "EventPaymentDetails" (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "eventId" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  currency TEXT DEFAULT 'NGN',
  amount DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert PG Conference payment details
INSERT INTO "EventPaymentDetails" (
  "eventId",
  "bankName", 
  "accountName",
  "accountNumber",
  amount,
  currency
) VALUES (
  'pg-conference-2025',
  'First Bank of Nigeria',
  'EXJAM Alumni Association',
  '2034567890',
  25000.00,
  'NGN'
) ON CONFLICT DO NOTHING;

-- Create function to update badge status after payment
CREATE OR REPLACE FUNCTION update_pg_conference_badge_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status changes to PAID, update badge status to FULL
  IF NEW."paymentStatus" = 'PAID' AND OLD."paymentStatus" != 'PAID' THEN
    NEW."badgeStatus" = 'FULL';
    NEW."updatedAt" = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic badge status update
DROP TRIGGER IF EXISTS trigger_update_badge_status ON "PGConferenceRegistration";
CREATE TRIGGER trigger_update_badge_status
  BEFORE UPDATE ON "PGConferenceRegistration"
  FOR EACH ROW
  EXECUTE FUNCTION update_pg_conference_badge_status();

-- Create view for registration dashboard
CREATE OR REPLACE VIEW "PGConferenceRegistrationView" AS
SELECT 
  pcr.id,
  pcr."fullName",
  pcr.email,
  pcr.phone,
  pcr."serviceNumber",
  pcr."graduationYear" || ' Set' AS "graduationSet",
  pcr.squadron,
  pcr.chapter,
  pcr."currentLocation",
  pcr."arrivalDate",
  pcr."departureDate",
  pcr."badgeStatus",
  pcr."paymentStatus",
  pcr."paymentReference",
  pcr."profilePhotoUrl",
  pcr."registrationDate",
  epd."bankName",
  epd."accountName", 
  epd."accountNumber",
  epd.amount as "registrationFee"
FROM "PGConferenceRegistration" pcr
LEFT JOIN "EventPaymentDetails" epd ON epd."eventId" = 'pg-conference-2025'
ORDER BY pcr."registrationDate" DESC;