-- Complete EXJAM Alumni Application Database Schema
-- This migration adds all the missing tables identified in the comprehensive analysis

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing enum types
DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled', 'attended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_type AS ENUM ('free', 'paid', 'vip', 'student', 'alumni');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(255),
    address TEXT,
    location_coordinates POINT,
    max_attendees INTEGER,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    price_ngn INTEGER DEFAULT 0,
    early_bird_price_ngn INTEGER,
    early_bird_deadline TIMESTAMP WITH TIME ZONE,
    is_virtual BOOLEAN DEFAULT false,
    meeting_url TEXT,
    streaming_url TEXT,
    recording_url TEXT,
    image_url TEXT,
    banner_url TEXT,
    status event_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    registration_fields JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_price CHECK (price_ngn >= 0)
);

-- Event categories
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    parent_id UUID REFERENCES event_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event tags
CREATE TABLE event_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6B7280',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event-tag associations
CREATE TABLE event_tag_associations (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES event_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);

-- Event speakers
CREATE TABLE event_speakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    bio TEXT,
    photo_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event agenda
CREATE TABLE event_agenda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    speaker_id UUID REFERENCES event_speakers(id),
    location VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_agenda_times CHECK (end_time >= start_time)
);

-- Event registrations
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_data JSONB NOT NULL DEFAULT '{}',
    status registration_status DEFAULT 'pending',
    ticket_type ticket_type DEFAULT 'free',
    amount_paid_ngn INTEGER DEFAULT 0,
    payment_reference VARCHAR(200),
    payment_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_user_event_registration UNIQUE (event_id, user_id),
    CONSTRAINT valid_amount CHECK (amount_paid_ngn >= 0)
);

-- Event tickets (QR codes)
CREATE TABLE event_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID REFERENCES event_registrations(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    qr_code_data TEXT NOT NULL,
    qr_code_url TEXT,
    is_checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES event_registrations(id),
    membership_id UUID REFERENCES user_memberships(id),
    amount_ngn INTEGER NOT NULL,
    processing_fee_ngn INTEGER DEFAULT 0,
    net_amount_ngn INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50) DEFAULT 'paystack',
    gateway_transaction_id VARCHAR(200),
    payment_reference VARCHAR(200) NOT NULL UNIQUE,
    provider_reference VARCHAR(200),
    status payment_status DEFAULT 'pending',
    provider_response JSONB,
    receipt_url TEXT,
    refund_amount_ngn INTEGER DEFAULT 0,
    refund_status VARCHAR(20) DEFAULT 'none',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_payment_amounts CHECK (amount_ngn >= 0 AND net_amount_ngn >= 0)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Storage files table
CREATE TABLE storage_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_name VARCHAR(500) NOT NULL,
    stored_path VARCHAR(1000) NOT NULL,
    bucket VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(200),
    file_hash VARCHAR(64), -- For deduplication
    uploaded_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_file_size CHECK (file_size >= 0)
);

-- File associations (link files to entities)
CREATE TABLE file_associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES storage_files(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'event', 'payment', etc.
    entity_id UUID NOT NULL,
    association_type VARCHAR(50) NOT NULL, -- 'profile_photo', 'event_image', 'receipt', etc.
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communications system
CREATE TABLE communications_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject_template TEXT NOT NULL,
    content_template TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'notification'
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE communications_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES communications_templates(id),
    subject VARCHAR(500),
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'notification', 'bulk'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
    recipient_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    audience_filter JSONB, -- Criteria for recipients
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE communications_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES communications_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    CONSTRAINT unique_message_user UNIQUE (message_id, user_id)
);

-- Digital badges system
CREATE TABLE digital_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type VARCHAR(100) NOT NULL, -- 'event_attendance', 'membership', 'achievement', etc.
    badge_name VARCHAR(255) NOT NULL,
    badge_description TEXT,
    image_url TEXT,
    event_id UUID REFERENCES events(id),
    metadata JSONB DEFAULT '{}',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    verification_code VARCHAR(100) UNIQUE
);

-- Analytics and tracking
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'user', 'event', 'payment', etc.
    entity_id UUID,
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    page_url TEXT,
    referrer_url TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs and monitoring
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
    message TEXT NOT NULL,
    component VARCHAR(100),
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    context JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error logging
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL DEFAULT 'error',
    message TEXT NOT NULL,
    stack_trace TEXT,
    component VARCHAR(100),
    user_id UUID REFERENCES auth.users(id),
    url TEXT,
    user_agent TEXT,
    ip_address INET,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_preference UNIQUE (user_id, preference_key)
);

-- User sessions tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL UNIQUE,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Audit logs for important actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export jobs tracking
CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL, -- 'users', 'events', 'registrations', etc.
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    filters JSONB DEFAULT '{}',
    file_name VARCHAR(500),
    file_url TEXT,
    record_count INTEGER,
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE -- When to delete the export file
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status_featured ON events(status, is_featured, start_date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_location ON events(venue, address);

CREATE INDEX idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_registrations_status ON event_registrations(status);
CREATE INDEX idx_registrations_payment_status ON event_registrations(payment_status);

CREATE INDEX idx_tickets_registration_id ON event_tickets(registration_id);
CREATE INDEX idx_tickets_number ON event_tickets(ticket_number);
CREATE INDEX idx_tickets_checked_in ON event_tickets(is_checked_in);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_reference ON payments(payment_reference);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_gateway ON payments(payment_gateway);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_expires ON notifications(expires_at);

CREATE INDEX idx_storage_files_bucket ON storage_files(bucket);
CREATE INDEX idx_storage_files_uploaded_by ON storage_files(uploaded_by);
CREATE INDEX idx_storage_files_hash ON storage_files(file_hash);

CREATE INDEX idx_file_associations_entity ON file_associations(entity_type, entity_id);
CREATE INDEX idx_file_associations_file_id ON file_associations(file_id);

CREATE INDEX idx_communications_messages_status ON communications_messages(status);
CREATE INDEX idx_communications_messages_created_by ON communications_messages(created_by);
CREATE INDEX idx_communications_recipients_message ON communications_recipients(message_id);
CREATE INDEX idx_communications_recipients_user ON communications_recipients(user_id);

CREATE INDEX idx_badges_user_id ON digital_badges(user_id);
CREATE INDEX idx_badges_type ON digital_badges(badge_type);
CREATE INDEX idx_badges_verification ON digital_badges(verification_code);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_entity ON analytics_events(entity_type, entity_id);

CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX idx_system_logs_component ON system_logs(component);

CREATE INDEX idx_error_logs_level ON error_logs(level);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);

CREATE INDEX idx_user_preferences_user_key ON user_preferences(user_id, preference_key);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

CREATE INDEX idx_export_jobs_created_by ON export_jobs(created_by);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);

-- Create updated_at triggers for all tables
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communications_templates_updated_at BEFORE UPDATE ON communications_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO event_categories (name, description, color, icon) VALUES
('Conference', 'Large scale professional conferences', '#3B82F6', 'users'),
('Workshop', 'Skills development workshops', '#10B981', 'wrench'),
('Networking', 'Social networking events', '#F59E0B', 'coffee'),
('Reunion', 'Alumni reunion gatherings', '#EF4444', 'heart'),
('Webinar', 'Online educational sessions', '#8B5CF6', 'monitor'),
('Awards', 'Recognition and awards ceremonies', '#F97316', 'trophy');

INSERT INTO event_tags (name, color) VALUES
('Alumni', '#3B82F6'),
('Professional', '#10B981'),
('Social', '#F59E0B'),
('Educational', '#8B5CF6'),
('Virtual', '#6B7280'),
('Free', '#059669'),
('Premium', '#DC2626'),
('Networking', '#7C3AED'),
('Career', '#0891B2'),
('Leadership', '#BE185D');

-- Insert default communication templates
INSERT INTO communications_templates (name, description, subject_template, content_template, template_type, variables) VALUES
('Welcome Email', 'Welcome new users to the platform', 'Welcome to EXJAM Alumni Association, {{firstName}}!', 
 'Dear {{firstName}} {{lastName}},\n\nWelcome to the EXJAM Alumni Association! We''re excited to have you join our community of distinguished alumni.\n\nYour account has been successfully created. You can now:\n- Connect with fellow alumni\n- Register for events\n- Access exclusive content\n\nBest regards,\nThe EXJAM Team', 
 'email', '["firstName", "lastName", "email"]'::jsonb),

('Event Registration Confirmation', 'Confirm event registration', 'Registration Confirmed: {{eventTitle}}', 
 'Dear {{firstName}},\n\nYour registration for {{eventTitle}} has been confirmed!\n\nEvent Details:\n- Date: {{eventDate}}\n- Location: {{eventLocation}}\n- Ticket: {{ticketType}}\n\nWe look forward to seeing you there!\n\nBest regards,\nThe EXJAM Events Team', 
 'email', '["firstName", "eventTitle", "eventDate", "eventLocation", "ticketType"]'::jsonb),

('Payment Receipt', 'Payment confirmation receipt', 'Payment Receipt - {{paymentReference}}', 
 'Dear {{firstName}},\n\nThank you for your payment of ₦{{amount}}.\n\nPayment Details:\n- Reference: {{paymentReference}}\n- Date: {{paymentDate}}\n- Method: {{paymentMethod}}\n\nYour receipt has been attached to this email.\n\nBest regards,\nThe EXJAM Finance Team', 
 'email', '["firstName", "amount", "paymentReference", "paymentDate", "paymentMethod"]'::jsonb);

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tag_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
-- Events - public read, authenticated create/update for own events
CREATE POLICY "Events are publicly readable" ON events FOR SELECT USING (true);
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (auth.uid() = created_by);

-- Event categories and tags - public read
CREATE POLICY "Event categories are publicly readable" ON event_categories FOR SELECT USING (true);
CREATE POLICY "Event tags are publicly readable" ON event_tags FOR SELECT USING (true);

-- Registrations - users can manage their own
CREATE POLICY "Users can view own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own registrations" ON event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own registrations" ON event_registrations FOR UPDATE USING (auth.uid() = user_id);

-- Tickets - users can view their own tickets
CREATE POLICY "Users can view own tickets" ON event_tickets 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM event_registrations er 
        WHERE er.id = registration_id AND er.user_id = auth.uid()
    )
);

-- Payments - users can view their own payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications - users can view their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Storage files - users can view public files or own files
CREATE POLICY "Users can view accessible files" ON storage_files 
FOR SELECT USING (is_public = true OR auth.uid() = uploaded_by);
CREATE POLICY "Users can upload files" ON storage_files 
FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- User preferences - users can manage their own
CREATE POLICY "Users can manage own preferences" ON user_preferences 
FOR ALL USING (auth.uid() = user_id);

-- Digital badges - users can view their own badges
CREATE POLICY "Users can view own badges" ON digital_badges 
FOR SELECT USING (auth.uid() = user_id);

-- User sessions - users can view their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions 
FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Create helpful views
CREATE OR REPLACE VIEW event_summary AS
SELECT 
    e.*,
    ec.name as category_name,
    ec.color as category_color,
    COUNT(DISTINCT er.id) as registration_count,
    COUNT(DISTINCT er.id) FILTER (WHERE er.status = 'confirmed') as confirmed_count,
    COALESCE(SUM(er.amount_paid_ngn), 0) as total_revenue
FROM events e
LEFT JOIN event_categories ec ON e.id = ec.id  -- Note: This needs to be fixed with proper category_id field
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id, ec.name, ec.color;

CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    up.user_id,
    COUNT(DISTINCT er.id) as events_registered,
    COUNT(DISTINCT er.id) FILTER (WHERE er.status = 'attended') as events_attended,
    COUNT(DISTINCT db.id) as badges_earned,
    COUNT(DISTINCT ac.id) FILTER (WHERE ac.status = 'accepted') as connections_count,
    COALESCE(SUM(p.amount_ngn), 0) as total_spent_ngn
FROM user_profiles up
LEFT JOIN event_registrations er ON up.user_id = er.user_id
LEFT JOIN digital_badges db ON up.user_id = db.user_id
LEFT JOIN alumni_connections ac ON (
    EXISTS (SELECT 1 FROM alumni_profiles ap WHERE ap.user_id = up.user_id AND (ap.id = ac.requester_id OR ap.id = ac.receiver_id))
)
LEFT JOIN payments p ON up.user_id = p.user_id
WHERE up.user_type = 'alumni_member'
GROUP BY up.user_id;

GRANT SELECT ON event_summary TO authenticated, anon;
GRANT SELECT ON user_dashboard_stats TO authenticated;