-- Comprehensive Database Setup for ExJAM Alumni
-- Generated: 2025-08-26T12:56:40.931Z
-- Run this in Supabase SQL Editor


-- ============================================
-- From: setup-admin-tables.sql
-- ============================================

-- Create ContactMessage table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ContactMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ContactMessage
CREATE INDEX IF NOT EXISTS "ContactMessage_status_idx" ON "ContactMessage" (status);
CREATE INDEX IF NOT EXISTS "ContactMessage_email_idx" ON "ContactMessage" (email);
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage" ("createdAt");

-- Enable RLS for ContactMessage
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ContactMessage
-- Policy for admins to view all messages
CREATE POLICY "Admins can view all contact messages" ON "ContactMessage"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Policy for admins to update messages
CREATE POLICY "Admins can update contact messages" ON "ContactMessage"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Policy for admins to delete messages
CREATE POLICY "Admins can delete contact messages" ON "ContactMessage"
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Policy for anyone to insert messages (public contact form)
CREATE POLICY "Anyone can submit contact messages" ON "ContactMessage"
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create updated_at trigger for ContactMessage
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ContactMessage_updated_at
    BEFORE UPDATE ON "ContactMessage"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure SiteConfig table exists with proper structure
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS social_twitter TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS enable_registration BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS enable_events BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS enable_payments BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'paystack';
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS smtp_host TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS smtp_user TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS smtp_from TEXT;

-- Insert default SiteConfig if it doesn't exist
INSERT INTO "SiteConfig" (id, site_name)
VALUES (1, 'ExJAM Alumni Association')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for SiteConfig
ALTER TABLE "SiteConfig" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for SiteConfig
-- Policy for anyone to view site config
CREATE POLICY "Anyone can view site config" ON "SiteConfig"
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy for admins to update site config
CREATE POLICY "Admins can update site config" ON "SiteConfig"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Create AuditLog table for tracking admin actions
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    "entityId" TEXT,
    metadata JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create indexes for AuditLog
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog" ("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_idx" ON "AuditLog" (entity);
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");

-- Enable RLS for AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view audit logs
CREATE POLICY "Admins can view audit logs" ON "AuditLog"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Policy for system to insert audit logs
CREATE POLICY "System can insert audit logs" ON "AuditLog"
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "User"
        WHERE id = user_id
        AND role IN ('ADMIN', 'ORGANIZER')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_entity TEXT,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    INSERT INTO "AuditLog" (
        "userId",
        action,
        entity,
        "entityId",
        metadata,
        "createdAt"
    )
    VALUES (
        auth.uid(),
        p_action,
        p_entity,
        p_entity_id,
        p_metadata,
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM "User") as total_users,
    (SELECT COUNT(*) FROM "User" WHERE "emailVerified" = true) as verified_users,
    (SELECT COUNT(*) FROM "Event" WHERE status = 'PUBLISHED') as active_events,
    (SELECT COUNT(*) FROM "Registration") as total_registrations,
    (SELECT COUNT(*) FROM "ContactMessage" WHERE status = 'pending') as pending_messages,
    (SELECT COUNT(*) FROM "Payment" WHERE status = 'SUCCESS') as successful_payments,
    (SELECT COALESCE(SUM(amount), 0) FROM "Payment" WHERE status = 'SUCCESS') as total_revenue;

-- Grant access to the view
GRANT SELECT ON admin_dashboard_stats TO authenticated;

COMMENT ON TABLE "ContactMessage" IS 'Stores contact form submissions from the website';
COMMENT ON TABLE "AuditLog" IS 'Tracks all admin actions for security and compliance';
COMMENT ON VIEW admin_dashboard_stats IS 'Aggregated statistics for the admin dashboard';


-- ============================================
-- From: create-alumni-tables.sql
-- ============================================

-- Alumni connections/networking table
CREATE TABLE IF NOT EXISTS alumni_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  connection_type VARCHAR(50) DEFAULT 'professional',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_connection UNIQUE (requester_id, receiver_id)
);

-- Alumni profile directory with enhanced search capabilities
CREATE TABLE IF NOT EXISTS alumni_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE UNIQUE,
  graduation_year INTEGER,
  course_of_study VARCHAR(255),
  current_company VARCHAR(255),
  job_title VARCHAR(255),
  industry VARCHAR(100),
  location_city VARCHAR(100),
  location_country VARCHAR(100) DEFAULT 'Nigeria',
  linkedin_profile VARCHAR(500),
  website_url VARCHAR(500),
  bio TEXT,
  skills TEXT[],
  interests TEXT[],
  is_public BOOLEAN DEFAULT true,
  is_available_for_mentoring BOOLEAN DEFAULT false,
  is_seeking_mentorship BOOLEAN DEFAULT false,
  is_available_for_networking BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation system for messaging
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants TEXT[] NOT NULL,
  conversation_type VARCHAR(20) DEFAULT 'direct',
  title VARCHAR(255),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for real-time messaging
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  read_by TEXT[] DEFAULT '{}',
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================
-- From: create-badge-system.sql
-- ============================================

-- Badge templates for different event types
CREATE TABLE IF NOT EXISTS badge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  canvas_design_url VARCHAR(500), -- URL to Canva design or uploaded template
  template_data JSONB, -- Store design elements, positioning, colors, etc.
  template_type VARCHAR(50) DEFAULT 'event', -- event, conference, workshop, vip
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES "User"(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated badges for specific events and users
CREATE TABLE IF NOT EXISTS event_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  registration_id TEXT REFERENCES "Registration"(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  template_id UUID REFERENCES badge_templates(id),
  
  -- Badge content
  display_name VARCHAR(255),
  title VARCHAR(255), -- job title or role
  company VARCHAR(255),
  badge_type VARCHAR(50) DEFAULT 'attendee', -- attendee, speaker, vip, organizer, sponsor
  
  -- QR code data
  qr_code_data TEXT NOT NULL, -- JSON with user/event/registration info
  qr_code_url VARCHAR(500), -- Generated QR code image URL
  
  -- Badge file URLs
  badge_image_url VARCHAR(500), -- Final badge image
  badge_pdf_url VARCHAR(500), -- Printable PDF version
  
  -- Status and tracking
  status VARCHAR(20) DEFAULT 'generated', -- generated, printed, distributed, scanned
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  distributed_at TIMESTAMP WITH TIME ZONE,
  first_scan_at TIMESTAMP WITH TIME ZONE,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  scan_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_event_user_badge UNIQUE (event_id, user_id)
);

-- Badge check-in/scan logs
CREATE TABLE IF NOT EXISTS badge_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID REFERENCES event_badges(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  session_id UUID REFERENCES event_sessions(id), -- Optional: specific session check-in
  
  -- Scan details
  scan_type VARCHAR(50) DEFAULT 'checkin', -- checkin, checkout, session_entry, session_exit
  scan_location VARCHAR(255), -- entrance, session_hall_a, networking_area, etc.
  scanned_by TEXT REFERENCES "User"(id), -- Admin/volunteer who scanned
  
  -- Device/location info
  scanner_device VARCHAR(255),
  scanner_location JSONB, -- GPS coordinates if available
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timing
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional data
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Badge design elements (for custom Canva-like editor)
CREATE TABLE IF NOT EXISTS badge_design_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES badge_templates(id) ON DELETE CASCADE,
  
  -- Element properties
  element_type VARCHAR(50) NOT NULL, -- text, image, qr_code, logo, shape
  element_name VARCHAR(100), -- name, title, company, qr_code, etc.
  
  -- Position and size
  x_position INTEGER DEFAULT 0,
  y_position INTEGER DEFAULT 0,
  width INTEGER DEFAULT 100,
  height INTEGER DEFAULT 50,
  z_index INTEGER DEFAULT 1,
  
  -- Styling
  font_family VARCHAR(100),
  font_size INTEGER,
  font_weight VARCHAR(20),
  color VARCHAR(7), -- hex color
  background_color VARCHAR(7),
  border_width INTEGER DEFAULT 0,
  border_color VARCHAR(7),
  border_radius INTEGER DEFAULT 0,
  
  -- Content
  static_content TEXT, -- For static text elements
  dynamic_field VARCHAR(100), -- Maps to user fields: firstName, lastName, company, etc.
  
  -- Image/asset URLs
  asset_url VARCHAR(500),
  
  -- Visibility and conditions
  is_visible BOOLEAN DEFAULT true,
  display_conditions JSONB, -- Show/hide based on badge_type, user_role, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badge generation queue for batch processing
CREATE TABLE IF NOT EXISTS badge_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  template_id UUID REFERENCES badge_templates(id),
  
  -- Batch info
  batch_name VARCHAR(255),
  total_badges INTEGER DEFAULT 0,
  processed_badges INTEGER DEFAULT 0,
  failed_badges INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  badge_types TEXT[], -- Filter by badge types
  user_roles TEXT[], -- Filter by user roles
  include_unregistered BOOLEAN DEFAULT false,
  
  -- Results
  generated_badge_urls TEXT[],
  error_log TEXT,
  
  created_by TEXT REFERENCES "User"(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_badge_templates_type ON badge_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_badge_templates_active ON badge_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_event_badges_event ON event_badges(event_id);
CREATE INDEX IF NOT EXISTS idx_event_badges_user ON event_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_event_badges_registration ON event_badges(registration_id);
CREATE INDEX IF NOT EXISTS idx_event_badges_status ON event_badges(status);
CREATE INDEX IF NOT EXISTS idx_event_badges_type ON event_badges(badge_type);

CREATE INDEX IF NOT EXISTS idx_badge_scans_badge ON badge_scans(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_scans_event ON badge_scans(event_id);
CREATE INDEX IF NOT EXISTS idx_badge_scans_session ON badge_scans(session_id);
CREATE INDEX IF NOT EXISTS idx_badge_scans_type ON badge_scans(scan_type);
CREATE INDEX IF NOT EXISTS idx_badge_scans_time ON badge_scans(scanned_at);

CREATE INDEX IF NOT EXISTS idx_badge_elements_template ON badge_design_elements(template_id);
CREATE INDEX IF NOT EXISTS idx_badge_elements_type ON badge_design_elements(element_type);

CREATE INDEX IF NOT EXISTS idx_badge_queue_event ON badge_generation_queue(event_id);
CREATE INDEX IF NOT EXISTS idx_badge_queue_status ON badge_generation_queue(status);


-- ============================================
-- From: create-event-enhancements.sql
-- ============================================

-- Event feedback system
CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  feedback_type VARCHAR(50) DEFAULT 'general', -- general, speaker, venue, content
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event resources (documents, presentations, recordings)
CREATE TABLE IF NOT EXISTS event_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL, -- presentation, document, video, audio, link
  resource_url VARCHAR(500),
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  is_public BOOLEAN DEFAULT true,
  requires_registration BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  uploaded_by TEXT REFERENCES "User"(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event sessions/agenda items
CREATE TABLE IF NOT EXISTS event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  speaker_name VARCHAR(255),
  speaker_bio TEXT,
  speaker_photo VARCHAR(500),
  session_type VARCHAR(50) DEFAULT 'presentation', -- presentation, workshop, panel, break
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255),
  max_attendees INTEGER,
  is_mandatory BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event attendance tracking for sessions
CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  registration_id TEXT REFERENCES "Registration"(id) ON DELETE CASCADE,
  attendance_status VARCHAR(20) DEFAULT 'registered', -- registered, attended, no_show
  checked_in_at TIMESTAMP WITH TIME ZONE,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_session_user UNIQUE (session_id, user_id)
);

-- Event Q&A system
CREATE TABLE IF NOT EXISTS event_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  session_id UUID REFERENCES event_sessions(id),
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by TEXT REFERENCES "User"(id),
  answered_at TIMESTAMP WITH TIME ZONE,
  is_anonymous BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending', -- pending, answered, dismissed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_rating ON event_feedback(rating);

CREATE INDEX IF NOT EXISTS idx_event_resources_event_id ON event_resources(event_id);
CREATE INDEX IF NOT EXISTS idx_event_resources_type ON event_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_event_resources_public ON event_resources(is_public);

CREATE INDEX IF NOT EXISTS idx_event_sessions_event_id ON event_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sessions_start_time ON event_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_user ON session_attendance(user_id);

CREATE INDEX IF NOT EXISTS idx_event_qa_event_id ON event_qa(event_id);
CREATE INDEX IF NOT EXISTS idx_event_qa_session_id ON event_qa(session_id);
CREATE INDEX IF NOT EXISTS idx_event_qa_status ON event_qa(status);


-- ============================================
-- From: create-messaging-tables.sql
-- ============================================

-- Messaging system tables
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants TEXT[] NOT NULL,
  conversation_type VARCHAR(20) DEFAULT 'direct',
  title VARCHAR(255),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  read_by TEXT[] DEFAULT '{}',
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);


-- ============================================
-- From: create-site-config.sql
-- ============================================

-- Create SiteConfig table for ExJAM Alumni application

-- Create SiteConfig table with proper structure
CREATE TABLE IF NOT EXISTS "SiteConfig" (
    id INT PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(255) DEFAULT 'ExJAM Alumni Association',
    main_logo_url TEXT,
    footer_logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1e40af',
    secondary_color VARCHAR(7) DEFAULT '#3b82f6',
    hero_title TEXT DEFAULT 'Welcome to ExJAM Alumni',
    hero_subtitle TEXT DEFAULT 'Connecting Nigerian Air Force Academy Alumni',
    contact_email TEXT,
    contact_phone TEXT,
    social_facebook TEXT,
    social_twitter TEXT,
    social_linkedin TEXT,
    social_instagram TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO "SiteConfig" (
    id, site_name, hero_title, hero_subtitle,
    primary_color, secondary_color,
    contact_email, contact_phone
) VALUES (
    1, 'ExJAM Alumni Association',
    'Welcome to ExJAM Alumni',
    'Connecting Nigerian Air Force Academy Alumni',
    '#1e40af', '#3b82f6',
    'info@exjamalumni.org',
    '+234 801 234 5678'
) ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Enable RLS
ALTER TABLE "SiteConfig" ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view site config" ON "SiteConfig"
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON "SiteConfig" TO postgres;
GRANT SELECT ON "SiteConfig" TO authenticated, anon;

-- Set ownership
ALTER TABLE "SiteConfig" OWNER TO postgres;

SELECT 'SiteConfig table created successfully!' as status;


-- ============================================
-- From: create-waitlist-table.sql
-- ============================================

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


-- ============================================
-- From: setup-alumni-networking-schema.sql
-- ============================================

-- Alumni Networking Features Schema
-- Run this to add alumni directory and networking capabilities

-- Alumni connections/networking table
CREATE TABLE IF NOT EXISTS alumni_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, blocked
  connection_type VARCHAR(50) DEFAULT 'professional', -- professional, personal, mentor-mentee
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_connection UNIQUE (requester_id, receiver_id)
);

-- Alumni profile directory with enhanced search capabilities
CREATE TABLE IF NOT EXISTS alumni_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE UNIQUE,
  graduation_year INTEGER,
  course_of_study VARCHAR(255),
  current_company VARCHAR(255),
  job_title VARCHAR(255),
  industry VARCHAR(100),
  location_city VARCHAR(100),
  location_country VARCHAR(100) DEFAULT 'Nigeria',
  linkedin_profile VARCHAR(500),
  website_url VARCHAR(500),
  bio TEXT,
  skills TEXT[], -- Array of skills
  interests TEXT[], -- Array of interests
  is_public BOOLEAN DEFAULT true,
  is_available_for_mentoring BOOLEAN DEFAULT false,
  is_seeking_mentorship BOOLEAN DEFAULT false,
  is_available_for_networking BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation system for messaging
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants TEXT[] NOT NULL, -- Array of user IDs
  conversation_type VARCHAR(20) DEFAULT 'direct', -- direct, group, event
  title VARCHAR(255),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for real-time messaging
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system
  metadata JSONB DEFAULT '{}', -- For storing additional data like file URLs, etc.
  read_by TEXT[] DEFAULT '{}', -- Array of user IDs who have read the message
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alumni_connections_requester ON alumni_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_receiver ON alumni_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_status ON alumni_connections(status);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_created_at ON alumni_connections(created_at);

CREATE INDEX IF NOT EXISTS idx_alumni_profiles_user_id ON alumni_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_graduation_year ON alumni_profiles(graduation_year);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_industry ON alumni_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_location_city ON alumni_profiles(location_city);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_is_public ON alumni_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_mentoring ON alumni_profiles(is_available_for_mentoring);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_seeking_mentorship ON alumni_profiles(is_seeking_mentorship);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_by ON messages USING GIN(read_by);

-- Add RLS policies for alumni networking tables
ALTER TABLE alumni_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Alumni connections policies
CREATE POLICY "Users can view connections involving them" ON alumni_connections
  FOR SELECT USING (
    auth.uid()::text = requester_id OR 
    auth.uid()::text = receiver_id OR
    auth.uid()::text IN (SELECT id FROM "User" WHERE role = 'ADMIN')
  );

CREATE POLICY "Users can create connection requests" ON alumni_connections
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id);

CREATE POLICY "Users can update connections involving them" ON alumni_connections
  FOR UPDATE USING (
    auth.uid()::text = requester_id OR 
    auth.uid()::text = receiver_id
  );

-- Alumni profiles policies
CREATE POLICY "Public profiles are visible to everyone" ON alumni_profiles
  FOR SELECT USING (
    is_public = true OR 
    auth.uid()::text = user_id OR
    auth.uid()::text IN (SELECT id FROM "User" WHERE role = 'ADMIN')
  );

CREATE POLICY "Users can manage their own profile entry" ON alumni_profiles
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all profile entries" ON alumni_profiles
  FOR ALL USING (
    auth.uid()::text IN (SELECT id FROM "User" WHERE role = 'ADMIN')
  );

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (auth.uid()::text = ANY(participants));

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid()::text = ANY(participants));

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (auth.uid()::text = ANY(participants));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE auth.uid()::text = ANY(participants)
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE auth.uid()::text = ANY(participants)
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid()::text = sender_id);

-- Grant permissions
GRANT ALL ON alumni_connections TO authenticated;
GRANT ALL ON alumni_profiles TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;

GRANT ALL ON alumni_connections TO service_role;
GRANT ALL ON alumni_profiles TO service_role;
GRANT ALL ON conversations TO service_role;
GRANT ALL ON messages TO service_role;


-- ============================================
-- From: fix-permissions.sql
-- ============================================

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


-- ============================================
-- From: fix-admin-tables.sql
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all contact messages" ON "ContactMessage";
DROP POLICY IF EXISTS "Admins can update contact messages" ON "ContactMessage";
DROP POLICY IF EXISTS "Admins can delete contact messages" ON "ContactMessage";
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON "ContactMessage";

-- Create RLS policies for ContactMessage with proper UUID casting
CREATE POLICY "Admins can view all contact messages" ON "ContactMessage"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

CREATE POLICY "Admins can update contact messages" ON "ContactMessage"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

CREATE POLICY "Admins can delete contact messages" ON "ContactMessage"
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

CREATE POLICY "Anyone can submit contact messages" ON "ContactMessage"
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create SiteConfig table properly
CREATE TABLE IF NOT EXISTS "SiteConfig" (
    id INTEGER PRIMARY KEY DEFAULT 1,
    site_name TEXT DEFAULT 'ExJAM Alumni Association',
    main_logo_url TEXT,
    footer_logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#1e40af',
    secondary_color TEXT DEFAULT '#3b82f6',
    hero_title TEXT DEFAULT 'Welcome to ExJAM Alumni',
    hero_subtitle TEXT,
    about_text TEXT,
    contact_email TEXT DEFAULT 'info@exjam.org.ng',
    contact_phone TEXT,
    social_facebook TEXT,
    social_twitter TEXT,
    social_linkedin TEXT,
    enable_registration BOOLEAN DEFAULT true,
    enable_events BOOLEAN DEFAULT true,
    enable_payments BOOLEAN DEFAULT true,
    payment_provider TEXT DEFAULT 'paystack',
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_from TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT site_config_single_row CHECK (id = 1)
);

-- Insert default SiteConfig if it doesn't exist
INSERT INTO "SiteConfig" (id, site_name)
VALUES (1, 'ExJAM Alumni Association')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for SiteConfig
ALTER TABLE "SiteConfig" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view site config" ON "SiteConfig";
DROP POLICY IF EXISTS "Admins can update site config" ON "SiteConfig";

-- Create RLS policies for SiteConfig
CREATE POLICY "Anyone can view site config" ON "SiteConfig"
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admins can update site config" ON "SiteConfig"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Fix AuditLog table
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view audit logs" ON "AuditLog";
DROP POLICY IF EXISTS "System can insert audit logs" ON "AuditLog";

-- Create RLS policies for AuditLog with proper UUID casting
CREATE POLICY "Admins can view audit logs" ON "AuditLog"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

CREATE POLICY "System can insert audit logs" ON "AuditLog"
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Recreate the admin check function with proper UUID handling
CREATE OR REPLACE FUNCTION is_admin(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "User"
        WHERE id = user_id
        AND role IN ('ADMIN', 'ORGANIZER')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the audit log function with proper UUID handling
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_entity TEXT,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    INSERT INTO "AuditLog" (
        "userId",
        action,
        entity,
        "entityId",
        metadata,
        "createdAt"
    )
    VALUES (
        auth.uid()::text,
        p_action,
        p_entity,
        p_entity_id,
        p_metadata,
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ContactMessage', 'SiteConfig', 'AuditLog');

