-- ============================================
-- SUPABASE SETUP FOR PG CONFERENCE 2025
-- ============================================

-- 1. CREATE STORAGE BUCKET FOR EVENT PHOTOS
-- ============================================

-- Create the event-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[];

-- Set up RLS policies for the event-photos bucket
-- Allow public read access for event photos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for event photos'
  ) THEN
    CREATE POLICY "Public read access for event photos"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'event-photos');
  END IF;
END $$;

-- Allow authenticated users to upload event photos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to upload event photos'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload event photos"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'event-photos');
  END IF;
END $$;

-- Allow users to update their own event photos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow users to update event photos'
  ) THEN
    CREATE POLICY "Allow users to update event photos"
      ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'event-photos');
  END IF;
END $$;

-- 2. CREATE PG CONFERENCE EVENT RECORD
-- ============================================

-- Insert the PG Conference event if it doesn't exist
INSERT INTO "Event" (
  id,
  title,
  description,
  "shortDescription",
  "startDate",
  "endDate",
  venue,
  address,
  capacity,
  price,
  "imageUrl",
  status,
  "createdAt",
  "updatedAt",
  tags
) VALUES (
  'pg-conference-2025',
  'President General''s Conference - Maiden Flight',
  'Join us for the inaugural President General''s Conference of The EXJAM Association. This milestone event brings together Air Force Military School alumni from around the world for networking, professional development, and celebration of our shared heritage.',
  'PG Conference 2025 - Maiden Flight',
  '2025-11-28T09:00:00Z',
  '2025-11-30T18:00:00Z',
  'NAF Conference Centre',
  'FCT, Abuja, Nigeria',
  500,
  25000.00,
  '/images/pg-conference-2025.jpg',
  'PUBLISHED',
  NOW(),
  NOW(),
  ARRAY['conference', 'networking', 'alumni', 'maiden-flight', 'pg-2025']
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "shortDescription" = EXCLUDED."shortDescription",
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  capacity = EXCLUDED.capacity,
  price = EXCLUDED.price,
  status = EXCLUDED.status,
  "updatedAt" = NOW(),
  tags = EXCLUDED.tags;

-- 3. CREATE CUSTOM TABLES FOR PG CONFERENCE DATA
-- ============================================

-- Create a custom table for PG Conference registrations with all AFMS fields
CREATE TABLE IF NOT EXISTS "PGConferenceRegistration" (
  id TEXT PRIMARY KEY DEFAULT ('pgr_' || generate_random_uuid()::text),
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
  "registrationId" TEXT,
  FOREIGN KEY ("registrationId") REFERENCES "Registration"(id) ON DELETE SET NULL
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

-- Policy: Users can view all registrations (for admin dashboard)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'PGConferenceRegistration' 
    AND policyname = 'Allow read access for PG Conference registrations'
  ) THEN
    CREATE POLICY "Allow read access for PG Conference registrations"
      ON "PGConferenceRegistration"
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Policy: Allow insert for new registrations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'PGConferenceRegistration' 
    AND policyname = 'Allow insert for PG Conference registrations'
  ) THEN
    CREATE POLICY "Allow insert for PG Conference registrations"
      ON "PGConferenceRegistration"
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- 4. CREATE FUNCTION TO UPDATE BADGE STATUS AFTER PAYMENT
-- ============================================

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

-- 5. INSERT SAMPLE BANK DETAILS FOR PAYMENT
-- ============================================

-- Create a table for payment bank details
CREATE TABLE IF NOT EXISTS "EventPaymentDetails" (
  id TEXT PRIMARY KEY DEFAULT generate_random_uuid()::text,
  "eventId" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  currency TEXT DEFAULT 'NGN',
  amount DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("eventId") REFERENCES "Event"(id) ON DELETE CASCADE
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

-- 6. CREATE VIEW FOR REGISTRATION DASHBOARD
-- ============================================

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

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ PG Conference 2025 Supabase setup completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📁 Storage bucket "event-photos" created with 10MB limit';
  RAISE NOTICE '🎯 Event "pg-conference-2025" created';
  RAISE NOTICE '🗃️  PGConferenceRegistration table created';
  RAISE NOTICE '💳 Payment details configured';
  RAISE NOTICE '🔒 RLS policies applied';
  RAISE NOTICE '⚡ Triggers and functions created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to accept registrations!';
END $$;