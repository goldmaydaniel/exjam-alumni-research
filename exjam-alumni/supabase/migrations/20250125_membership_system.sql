-- Migration to support both membership and basic signup
-- This creates tables for different user types and membership management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for fresh migration)
DROP TABLE IF EXISTS membership_payments CASCADE;
DROP TABLE IF EXISTS user_memberships CASCADE;
DROP TABLE IF EXISTS membership_tiers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('basic', 'alumni_member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_type AS ENUM ('annual', 'lifetime', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE squadron_type AS ENUM ('GREEN', 'RED', 'PURPLE', 'YELLOW', 'DORNIER', 'PUMA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type user_type NOT NULL DEFAULT 'basic',
    is_verified BOOLEAN DEFAULT false,
    profile_photo_url TEXT,
    bio TEXT,
    current_location VARCHAR(200),
    country VARCHAR(100) DEFAULT 'Nigeria',
    occupation VARCHAR(200),
    company VARCHAR(200),
    linkedin_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_id UNIQUE (user_id),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Alumni profiles table (for alumni members only)
CREATE TABLE alumni_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_number VARCHAR(50) NOT NULL,
    squadron squadron_type NOT NULL,
    set_number VARCHAR(10) NOT NULL,
    graduation_year VARCHAR(4) NOT NULL,
    chapter VARCHAR(100) NOT NULL,
    achievements TEXT[],
    interests TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_alumni_user UNIQUE (user_id),
    CONSTRAINT unique_service_number UNIQUE (service_number),
    CONSTRAINT valid_service_number CHECK (service_number ~* '^AFMS\s?\d{2,4}\/\d{4}$'),
    CONSTRAINT valid_graduation_year CHECK (graduation_year ~ '^\d{4}$')
);

-- Membership tiers table
CREATE TABLE membership_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_type membership_type NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_ngn INTEGER NOT NULL, -- Price in kobo
    duration_months INTEGER, -- NULL for lifetime
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User memberships table
CREATE TABLE user_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES membership_tiers(id),
    membership_type membership_type NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT false,
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'expired', 'suspended', 'cancelled'))
);

-- Membership payments table
CREATE TABLE membership_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES user_memberships(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_ngn INTEGER NOT NULL, -- Amount in kobo
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(200),
    provider_reference VARCHAR(200),
    status payment_status NOT NULL DEFAULT 'pending',
    provider_response JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('card', 'transfer', 'cash'))
);

-- Alumni connections table
CREATE TABLE alumni_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message TEXT,
    connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT no_self_connection CHECK (requester_id != receiver_id),
    CONSTRAINT unique_connection UNIQUE (requester_id, receiver_id),
    CONSTRAINT valid_connection_status CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'))
);

-- Alumni activities table (for activity feed)
CREATE TABLE alumni_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumni_id UUID NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_activity_type CHECK (activity_type IN ('joined', 'connection_request', 'connection_accepted', 'profile_updated', 'event_attended'))
);

-- Insert default membership tiers
INSERT INTO membership_tiers (tier_type, name, description, price_ngn, duration_months, features) VALUES
(
    'student',
    'Student Membership',
    'For recent graduates (within 2 years)',
    500000, -- ₦5,000 in kobo
    12,
    '[
        "Alumni directory access",
        "Career resources",
        "Networking events",
        "Mentorship matching",
        "Job board access"
    ]'::jsonb
),
(
    'annual',
    'Annual Membership',
    'Perfect for staying connected',
    1000000, -- ₦10,000 in kobo
    12,
    '[
        "Full alumni directory access",
        "Event invitations",
        "Verified profile badge",
        "Chapter participation",
        "Quarterly newsletter",
        "Voting rights"
    ]'::jsonb
),
(
    'lifetime',
    'Lifetime Membership',
    'Best value for committed alumni',
    15000000, -- ₦150,000 in kobo
    NULL, -- Lifetime
    '[
        "All annual benefits",
        "Lifetime verification",
        "Priority event booking",
        "Special recognition",
        "Guest passes to events",
        "Legacy member status",
        "Exclusive lifetime badge",
        "Mentorship opportunities"
    ]'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_type ON user_profiles(user_type);

CREATE INDEX idx_alumni_profiles_user_id ON alumni_profiles(user_id);
CREATE INDEX idx_alumni_profiles_squadron ON alumni_profiles(squadron);
CREATE INDEX idx_alumni_profiles_chapter ON alumni_profiles(chapter);
CREATE INDEX idx_alumni_profiles_set ON alumni_profiles(set_number);
CREATE INDEX idx_alumni_profiles_service_number ON alumni_profiles(service_number);

CREATE INDEX idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX idx_user_memberships_status ON user_memberships(status);
CREATE INDEX idx_user_memberships_type ON user_memberships(membership_type);

CREATE INDEX idx_membership_payments_user_id ON membership_payments(user_id);
CREATE INDEX idx_membership_payments_status ON membership_payments(status);
CREATE INDEX idx_membership_payments_reference ON membership_payments(payment_reference);

CREATE INDEX idx_alumni_connections_requester ON alumni_connections(requester_id);
CREATE INDEX idx_alumni_connections_receiver ON alumni_connections(receiver_id);
CREATE INDEX idx_alumni_connections_status ON alumni_connections(status);

CREATE INDEX idx_alumni_activities_alumni_id ON alumni_activities(alumni_id);
CREATE INDEX idx_alumni_activities_type ON alumni_activities(activity_type);
CREATE INDEX idx_alumni_activities_created_at ON alumni_activities(created_at DESC);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alumni_profiles_updated_at BEFORE UPDATE ON alumni_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_tiers_updated_at BEFORE UPDATE ON membership_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at BEFORE UPDATE ON user_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_payments_updated_at BEFORE UPDATE ON membership_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alumni_connections_updated_at BEFORE UPDATE ON alumni_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_activities ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by authenticated users" ON user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Alumni profiles policies
CREATE POLICY "Alumni can view their own profile" ON alumni_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Alumni can update their own profile" ON alumni_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Alumni can insert their own profile" ON alumni_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Alumni profiles viewable by all authenticated" ON alumni_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Membership tiers policies (public read)
CREATE POLICY "Membership tiers are publicly readable" ON membership_tiers
    FOR SELECT USING (true);

-- User memberships policies
CREATE POLICY "Users can view their own memberships" ON user_memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships" ON user_memberships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Membership payments policies
CREATE POLICY "Users can view their own payments" ON membership_payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON membership_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Alumni connections policies
CREATE POLICY "Users can view their connections" ON alumni_connections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM alumni_profiles ap 
            WHERE ap.user_id = auth.uid() 
            AND (ap.id = requester_id OR ap.id = receiver_id)
        )
    );

CREATE POLICY "Users can create connection requests" ON alumni_connections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM alumni_profiles ap 
            WHERE ap.user_id = auth.uid() 
            AND ap.id = requester_id
        )
    );

CREATE POLICY "Users can update their connection responses" ON alumni_connections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM alumni_profiles ap 
            WHERE ap.user_id = auth.uid() 
            AND ap.id = receiver_id
        )
    );

-- Alumni activities policies
CREATE POLICY "Public activities are viewable by all" ON alumni_activities
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own activities" ON alumni_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM alumni_profiles ap 
            WHERE ap.user_id = auth.uid() 
            AND ap.id = alumni_id
        )
    );

CREATE POLICY "Users can insert their own activities" ON alumni_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM alumni_profiles ap 
            WHERE ap.user_id = auth.uid() 
            AND ap.id = alumni_id
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON alumni_profiles TO authenticated;
GRANT SELECT ON membership_tiers TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON user_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON membership_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON alumni_connections TO authenticated;
GRANT SELECT, INSERT ON alumni_activities TO authenticated;

-- Grant permissions to service role for admin operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Create view for alumni directory (combines profiles and user data)
CREATE OR REPLACE VIEW alumni_directory AS
SELECT 
    ap.id,
    ap.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    ap.service_number,
    ap.squadron,
    ap.set_number,
    ap.graduation_year,
    ap.chapter,
    up.current_location,
    up.country,
    up.occupation,
    up.company,
    up.linkedin_url,
    up.profile_photo_url,
    ap.achievements,
    ap.interests,
    up.is_verified,
    ap.is_active,
    ap.last_active,
    up.created_at,
    up.updated_at,
    -- Membership info
    um.membership_type,
    um.status as membership_status,
    um.end_date as membership_expires
FROM alumni_profiles ap
JOIN user_profiles up ON ap.user_id = up.user_id
LEFT JOIN user_memberships um ON ap.user_id = um.user_id AND um.status = 'active'
WHERE ap.is_active = true AND up.user_type = 'alumni_member';

-- Grant access to the view
GRANT SELECT ON alumni_directory TO authenticated, anon;

-- Create function to get user's full profile
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    user_type user_type,
    is_alumni_member BOOLEAN,
    has_active_membership BOOLEAN,
    membership_type membership_type,
    membership_expires TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.first_name,
        up.last_name,
        up.email,
        up.user_type,
        (ap.id IS NOT NULL) as is_alumni_member,
        (um.status = 'active') as has_active_membership,
        um.membership_type,
        um.end_date as membership_expires
    FROM user_profiles up
    LEFT JOIN alumni_profiles ap ON up.user_id = ap.user_id
    LEFT JOIN user_memberships um ON up.user_id = um.user_id AND um.status = 'active'
    WHERE up.user_id = user_uuid;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated, anon;