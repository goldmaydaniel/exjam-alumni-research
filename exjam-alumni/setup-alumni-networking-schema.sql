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