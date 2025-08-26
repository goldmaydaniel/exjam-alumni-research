-- Minimal Alumni networking tables setup
-- Only create tables that don't exist

-- Alumni profile directory 
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

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_user_id ON alumni_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_is_public ON alumni_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_requester ON alumni_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_receiver ON alumni_connections(receiver_id);