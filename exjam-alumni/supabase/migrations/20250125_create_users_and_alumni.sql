-- First ensure users table exists (if not already created)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  service_number TEXT,
  phone TEXT,
  role TEXT DEFAULT 'USER',
  squadron TEXT,
  chapter TEXT,
  current_location TEXT,
  profile_photo TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alumni profiles table extending the users table
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  service_number TEXT UNIQUE NOT NULL,
  set_number TEXT NOT NULL, -- e.g., "95" for Set 95
  squadron TEXT NOT NULL CHECK (squadron IN ('GREEN', 'RED', 'PURPLE', 'YELLOW', 'DORNIER', 'PUMA')),
  graduation_year TEXT NOT NULL,
  
  -- Contact & Location
  phone TEXT,
  chapter TEXT NOT NULL,
  current_location TEXT NOT NULL,
  country TEXT DEFAULT 'Nigeria',
  
  -- Professional Information
  occupation TEXT,
  company TEXT,
  linkedin_url TEXT,
  
  -- Profile
  profile_photo_url TEXT,
  bio TEXT,
  achievements TEXT[], -- Array of achievements
  interests TEXT[], -- Array of interests
  
  -- Verification & Status
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'alumni_only', 'connections_only', 'private')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create connections table for alumni networking
CREATE TABLE IF NOT EXISTS public.alumni_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  message TEXT, -- Optional message with connection request
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique connection between two alumni
  UNIQUE(requester_id, receiver_id)
);

-- Create alumni messages table
CREATE TABLE IF NOT EXISTS public.alumni_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alumni activities table for feed
CREATE TABLE IF NOT EXISTS public.alumni_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('joined', 'updated_profile', 'event_registered', 'achievement', 'post', 'connection_request', 'connection_accepted')),
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_user_id ON public.alumni_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_squadron ON public.alumni_profiles(squadron);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_chapter ON public.alumni_profiles(chapter);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_set_number ON public.alumni_profiles(set_number);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_service_number ON public.alumni_profiles(service_number);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_requester ON public.alumni_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_receiver ON public.alumni_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_alumni_connections_status ON public.alumni_connections(status);
CREATE INDEX IF NOT EXISTS idx_alumni_messages_sender ON public.alumni_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_alumni_messages_receiver ON public.alumni_messages(receiver_id);