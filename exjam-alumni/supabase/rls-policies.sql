-- Row Level Security (RLS) Policies for ExJAM Alumni Platform
-- These policies ensure data security and proper access control

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Waitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM "User" WHERE id = auth.uid()),
    'GUEST_MEMBER'::text
  );
$$;

-- Helper function to check if user is admin or organizer
CREATE OR REPLACE FUNCTION auth.is_admin_or_organizer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.user_role() IN ('ADMIN', 'ORGANIZER');
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.user_role() = 'ADMIN';
$$;

-- Helper function to check if user is verified member or above
CREATE OR REPLACE FUNCTION auth.is_verified_member()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.user_role() IN ('VERIFIED_MEMBER', 'ATTENDEE', 'SPEAKER', 'ORGANIZER', 'ADMIN');
$$;

-- ==========================================
-- USER TABLE POLICIES
-- ==========================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON "User"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Verified members can read other users' public profiles
CREATE POLICY "Verified members can read public profiles" ON "User"
  FOR SELECT
  TO authenticated
  USING (
    auth.is_verified_member() 
    AND status = 'ACTIVE'
    AND (
      -- Allow reading basic profile info
      true
    )
  );

-- Admins and organizers can read all user profiles
CREATE POLICY "Admins can read all user profiles" ON "User"
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_organizer());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- Prevent role escalation by regular users
      role = (SELECT role FROM "User" WHERE id = auth.uid())
      OR auth.is_admin_or_organizer()
    )
  );

-- Admins can update any user profile
CREATE POLICY "Admins can update any user" ON "User"
  FOR UPDATE
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Only admins can insert new users (via signup API)
CREATE POLICY "Allow user signup" ON "User"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR auth.is_admin()
  );

-- Only admins can delete users
CREATE POLICY "Only admins can delete users" ON "User"
  FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- ==========================================
-- EVENT TABLE POLICIES
-- ==========================================

-- Everyone can read published events
CREATE POLICY "Everyone can read published events" ON "Event"
  FOR SELECT
  TO authenticated
  USING (status IN ('PUBLISHED', 'COMPLETED'));

-- Organizers and admins can read all events
CREATE POLICY "Organizers can read all events" ON "Event"
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_organizer());

-- Event organizers can read their own events
CREATE POLICY "Organizers can read own events" ON "Event"
  FOR SELECT
  TO authenticated
  USING (organizerId = auth.uid());

-- Organizers and admins can create events
CREATE POLICY "Organizers can create events" ON "Event"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.is_admin_or_organizer()
    AND (organizerId = auth.uid() OR auth.is_admin())
  );

-- Event organizers can update their own events, admins can update any
CREATE POLICY "Organizers can update own events" ON "Event"
  FOR UPDATE
  TO authenticated
  USING (
    (organizerId = auth.uid() AND auth.user_role() IN ('ORGANIZER', 'SPEAKER'))
    OR auth.is_admin()
  )
  WITH CHECK (
    (organizerId = auth.uid() AND auth.user_role() IN ('ORGANIZER', 'SPEAKER'))
    OR auth.is_admin()
  );

-- Only admins can delete events
CREATE POLICY "Only admins can delete events" ON "Event"
  FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- ==========================================
-- REGISTRATION TABLE POLICIES
-- ==========================================

-- Users can read their own registrations
CREATE POLICY "Users can read own registrations" ON "Registration"
  FOR SELECT
  TO authenticated
  USING (userId = auth.uid());

-- Organizers can read registrations for their events
CREATE POLICY "Organizers can read event registrations" ON "Registration"
  FOR SELECT
  TO authenticated
  USING (
    auth.is_admin_or_organizer()
    OR EXISTS (
      SELECT 1 FROM "Event" 
      WHERE id = "Registration".eventId 
      AND organizerId = auth.uid()
    )
  );

-- Users can create their own registrations
CREATE POLICY "Users can create registrations" ON "Registration"
  FOR INSERT
  TO authenticated
  WITH CHECK (userId = auth.uid());

-- Users can update their own registrations (limited)
CREATE POLICY "Users can update own registrations" ON "Registration"
  FOR UPDATE
  TO authenticated
  USING (userId = auth.uid())
  WITH CHECK (
    userId = auth.uid()
    AND (
      -- Prevent status changes by regular users
      status = (SELECT status FROM "Registration" WHERE id = "Registration".id)
      OR auth.is_admin_or_organizer()
    )
  );

-- Organizers can update registrations for their events
CREATE POLICY "Organizers can update event registrations" ON "Registration"
  FOR UPDATE
  TO authenticated
  USING (
    auth.is_admin_or_organizer()
    OR EXISTS (
      SELECT 1 FROM "Event" 
      WHERE id = "Registration".eventId 
      AND organizerId = auth.uid()
    )
  );

-- Users can cancel their own registrations
CREATE POLICY "Users can cancel own registrations" ON "Registration"
  FOR DELETE
  TO authenticated
  USING (userId = auth.uid());

-- ==========================================
-- PAYMENT TABLE POLICIES
-- ==========================================

-- Users can read their own payments
CREATE POLICY "Users can read own payments" ON "Payment"
  FOR SELECT
  TO authenticated
  USING (userId = auth.uid());

-- Admins and organizers can read all payments
CREATE POLICY "Admins can read all payments" ON "Payment"
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_organizer());

-- System can create payments (via API)
CREATE POLICY "System can create payments" ON "Payment"
  FOR INSERT
  TO authenticated
  WITH CHECK (userId = auth.uid() OR auth.is_admin_or_organizer());

-- Only system and admins can update payments
CREATE POLICY "Only system can update payments" ON "Payment"
  FOR UPDATE
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ==========================================
-- TICKET TABLE POLICIES
-- ==========================================

-- Users can read their own tickets
CREATE POLICY "Users can read own tickets" ON "Ticket"
  FOR SELECT
  TO authenticated
  USING (userId = auth.uid());

-- Organizers can read tickets for their events
CREATE POLICY "Organizers can read event tickets" ON "Ticket"
  FOR SELECT
  TO authenticated
  USING (
    auth.is_admin_or_organizer()
    OR EXISTS (
      SELECT 1 FROM "Event" 
      WHERE id = "Ticket".eventId 
      AND organizerId = auth.uid()
    )
  );

-- System creates tickets automatically
CREATE POLICY "System can create tickets" ON "Ticket"
  FOR INSERT
  TO authenticated
  WITH CHECK (userId = auth.uid() OR auth.is_admin_or_organizer());

-- Organizers can update tickets (check-in, etc.)
CREATE POLICY "Organizers can update tickets" ON "Ticket"
  FOR UPDATE
  TO authenticated
  USING (
    auth.is_admin_or_organizer()
    OR EXISTS (
      SELECT 1 FROM "Event" 
      WHERE id = "Ticket".eventId 
      AND organizerId = auth.uid()
    )
  );

-- ==========================================
-- WAITLIST TABLE POLICIES
-- ==========================================

-- Users can read their own waitlist entries
CREATE POLICY "Users can read own waitlist" ON "Waitlist"
  FOR SELECT
  TO authenticated
  USING (userId = auth.uid());

-- Organizers can read waitlist for their events
CREATE POLICY "Organizers can read event waitlist" ON "Waitlist"
  FOR SELECT
  TO authenticated
  USING (
    auth.is_admin_or_organizer()
    OR EXISTS (
      SELECT 1 FROM "Event" 
      WHERE id = "Waitlist".eventId 
      AND organizerId = auth.uid()
    )
  );

-- Users can join waitlists
CREATE POLICY "Users can join waitlist" ON "Waitlist"
  FOR INSERT
  TO authenticated
  WITH CHECK (userId = auth.uid());

-- System and organizers can update waitlist
CREATE POLICY "System can update waitlist" ON "Waitlist"
  FOR UPDATE
  TO authenticated
  USING (
    userId = auth.uid()
    OR auth.is_admin_or_organizer()
  );

-- Users can remove themselves from waitlist
CREATE POLICY "Users can leave waitlist" ON "Waitlist"
  FOR DELETE
  TO authenticated
  USING (userId = auth.uid());

-- ==========================================
-- NOTIFICATION TABLE POLICIES
-- ==========================================

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON "Notification"
  FOR SELECT
  TO authenticated
  USING (userId = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON "Notification"
  FOR UPDATE
  TO authenticated
  USING (userId = auth.uid())
  WITH CHECK (userId = auth.uid());

-- System and admins can create notifications
CREATE POLICY "System can create notifications" ON "Notification"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin_or_organizer());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON "Notification"
  FOR DELETE
  TO authenticated
  USING (userId = auth.uid());

-- ==========================================
-- AUDIT LOG TABLE POLICIES
-- ==========================================

-- Only admins can read audit logs
CREATE POLICY "Only admins can read audit logs" ON "AuditLog"
  FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- System creates audit logs automatically
CREATE POLICY "System can create audit logs" ON "AuditLog"
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- System handles creation

-- No updates or deletes on audit logs
-- (Audit logs are immutable for security)

-- ==========================================
-- CONTACT MESSAGE TABLE POLICIES
-- ==========================================

-- Admins can read all contact messages
CREATE POLICY "Admins can read contact messages" ON "ContactMessage"
  FOR SELECT
  TO authenticated
  USING (auth.is_admin_or_organizer());

-- Anyone can create contact messages
CREATE POLICY "Anyone can create contact messages" ON "ContactMessage"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update contact messages (status, etc.)
CREATE POLICY "Admins can update contact messages" ON "ContactMessage"
  FOR UPDATE
  TO authenticated
  USING (auth.is_admin_or_organizer())
  WITH CHECK (auth.is_admin_or_organizer());

-- Only admins can delete contact messages
CREATE POLICY "Only admins can delete contact messages" ON "ContactMessage"
  FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- ==========================================
-- SITE CONFIG TABLE POLICIES
-- ==========================================

-- Everyone can read site config
CREATE POLICY "Everyone can read site config" ON "SiteConfig"
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update site config
CREATE POLICY "Only admins can update site config" ON "SiteConfig"
  FOR UPDATE
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ==========================================
-- GRANTS AND PERMISSIONS
-- ==========================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant appropriate permissions on tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant sequence usage for auto-incrementing IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_user_auth_uid ON "User" (id) WHERE id = auth.uid();
CREATE INDEX IF NOT EXISTS idx_registration_user_id ON "Registration" (userId);
CREATE INDEX IF NOT EXISTS idx_event_organizer_id ON "Event" (organizerId);
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON "Payment" (userId);
CREATE INDEX IF NOT EXISTS idx_ticket_user_id ON "Ticket" (userId);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON "Waitlist" (userId);
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON "Notification" (userId);

-- Create function to refresh user role cache
CREATE OR REPLACE FUNCTION refresh_user_role_cache()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear any caching if implemented
  RETURN NEW;
END;
$$;

-- Trigger to refresh role cache when user role changes
CREATE TRIGGER refresh_user_role_cache_trigger
  AFTER UPDATE OF role ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION refresh_user_role_cache();

-- Add comments for documentation
COMMENT ON POLICY "Users can read own profile" ON "User" IS 'Users can view their own profile information';
COMMENT ON POLICY "Verified members can read public profiles" ON "User" IS 'Verified members can view other users public profile information';
COMMENT ON POLICY "Everyone can read published events" ON "Event" IS 'All authenticated users can view published events';
COMMENT ON POLICY "Users can read own registrations" ON "Registration" IS 'Users can view their own event registrations';