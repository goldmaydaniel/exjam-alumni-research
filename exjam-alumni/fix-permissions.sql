-- Fix RLS permissions for PG Conference Registration

-- Disable RLS temporarily to fix permissions
ALTER TABLE "PGConferenceRegistration" DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON TABLE "PGConferenceRegistration" TO authenticated;
GRANT ALL ON TABLE "PGConferenceRegistration" TO anon;
GRANT ALL ON TABLE "EventPaymentDetails" TO authenticated;
GRANT ALL ON TABLE "EventPaymentDetails" TO anon;

-- Re-enable RLS with proper policies
ALTER TABLE "PGConferenceRegistration" ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for development
DROP POLICY IF EXISTS "Allow read access for PG Conference registrations" ON "PGConferenceRegistration";
CREATE POLICY "Allow read access for PG Conference registrations"
  ON "PGConferenceRegistration"
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Allow insert for PG Conference registrations" ON "PGConferenceRegistration";
CREATE POLICY "Allow insert for PG Conference registrations"
  ON "PGConferenceRegistration"
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow updates as well
DROP POLICY IF EXISTS "Allow update for PG Conference registrations" ON "PGConferenceRegistration";
CREATE POLICY "Allow update for PG Conference registrations"
  ON "PGConferenceRegistration"
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);