-- Setup Events Table for ExJAM Alumni Platform
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create event status enum
DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create events table
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

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    registration_data JSONB DEFAULT '{}',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_reference VARCHAR(255),
    amount_paid INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (status = 'published');

CREATE POLICY "Events can be created by authenticated users" ON events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Events can be updated by creator or admin" ON events
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM pg_roles r
            JOIN pg_auth_members m ON m.roleid = r.oid
            JOIN pg_roles u ON u.oid = m.member
            WHERE r.rolname = 'exjam_admin_role'
            AND u.rolname = auth.jwt() ->> 'email'
        )
    );

-- Create RLS policies for registrations
CREATE POLICY "Users can view their own registrations" ON registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create registrations" ON registrations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own registrations" ON registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions to admin role (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exjam_admin_role') THEN
        GRANT ALL PRIVILEGES ON events TO exjam_admin_role;
        GRANT ALL PRIVILEGES ON registrations TO exjam_admin_role;
        GRANT USAGE ON SEQUENCE events_id_seq TO exjam_admin_role;
        GRANT USAGE ON SEQUENCE registrations_id_seq TO exjam_admin_role;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Events and registrations tables created successfully!';
    RAISE NOTICE '🎯 You can now create events and manage registrations';
    RAISE NOTICE '🔗 Run the create-pg-conference-event.js script to add the PG Conference';
END $$;
