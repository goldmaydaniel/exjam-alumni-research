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
  activity_type TEXT NOT NULL CHECK (activity_type IN ('joined', 'updated_profile', 'event_registered', 'achievement', 'post')),
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_alumni_profiles_user_id ON public.alumni_profiles(user_id);
CREATE INDEX idx_alumni_profiles_squadron ON public.alumni_profiles(squadron);
CREATE INDEX idx_alumni_profiles_chapter ON public.alumni_profiles(chapter);
CREATE INDEX idx_alumni_profiles_set_number ON public.alumni_profiles(set_number);
CREATE INDEX idx_alumni_profiles_service_number ON public.alumni_profiles(service_number);
CREATE INDEX idx_alumni_connections_requester ON public.alumni_connections(requester_id);
CREATE INDEX idx_alumni_connections_receiver ON public.alumni_connections(receiver_id);
CREATE INDEX idx_alumni_connections_status ON public.alumni_connections(status);
CREATE INDEX idx_alumni_messages_sender ON public.alumni_messages(sender_id);
CREATE INDEX idx_alumni_messages_receiver ON public.alumni_messages(receiver_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alumni_profiles

-- Policy: Everyone can view public profiles
CREATE POLICY "Public profiles are viewable by all" ON public.alumni_profiles
  FOR SELECT
  USING (profile_visibility = 'public');

-- Policy: Alumni can view alumni-only profiles if they have a profile
CREATE POLICY "Alumni can view alumni-only profiles" ON public.alumni_profiles
  FOR SELECT
  USING (
    profile_visibility = 'alumni_only' 
    AND EXISTS (
      SELECT 1 FROM public.alumni_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can view their connections' profiles
CREATE POLICY "Users can view connected profiles" ON public.alumni_profiles
  FOR SELECT
  USING (
    profile_visibility = 'connections_only'
    AND (
      user_id = auth.uid() -- Own profile
      OR EXISTS ( -- Connected profiles
        SELECT 1 FROM public.alumni_connections
        WHERE status = 'accepted'
        AND (
          (requester_id = (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid()) 
           AND receiver_id = alumni_profiles.id)
          OR
          (receiver_id = (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid()) 
           AND requester_id = alumni_profiles.id)
        )
      )
    )
  );

-- Policy: Users can view and update their own profile
CREATE POLICY "Users can update own profile" ON public.alumni_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for alumni_connections

-- Policy: Users can view their own connections
CREATE POLICY "Users can view own connections" ON public.alumni_connections
  FOR SELECT
  USING (
    requester_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
  );

-- Policy: Users can create connection requests
CREATE POLICY "Users can create connections" ON public.alumni_connections
  FOR INSERT
  WITH CHECK (
    requester_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
  );

-- Policy: Users can update connections they're part of
CREATE POLICY "Users can update own connections" ON public.alumni_connections
  FOR UPDATE
  USING (
    receiver_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
    OR requester_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    receiver_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
    OR requester_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for alumni_messages

-- Policy: Users can view messages they sent or received
CREATE POLICY "Users can view own messages" ON public.alumni_messages
  FOR SELECT
  USING (
    sender_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
  );

-- Policy: Users can send messages
CREATE POLICY "Users can send messages" ON public.alumni_messages
  FOR INSERT
  WITH CHECK (
    sender_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
    -- Can only message connected alumni
    AND EXISTS (
      SELECT 1 FROM public.alumni_connections
      WHERE status = 'accepted'
      AND (
        (requester_id = sender_id AND receiver_id = alumni_messages.receiver_id)
        OR
        (receiver_id = sender_id AND requester_id = alumni_messages.receiver_id)
      )
    )
  );

-- Policy: Users can update their received messages (mark as read)
CREATE POLICY "Users can update received messages" ON public.alumni_messages
  FOR UPDATE
  USING (receiver_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid()))
  WITH CHECK (receiver_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid()));

-- RLS Policies for alumni_activities

-- Policy: Everyone can view public activities
CREATE POLICY "Public activities are viewable" ON public.alumni_activities
  FOR SELECT
  USING (
    alumni_id IN (
      SELECT id FROM public.alumni_profiles 
      WHERE profile_visibility IN ('public', 'alumni_only')
    )
    OR alumni_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
  );

-- Policy: Users can create their own activities
CREATE POLICY "Users can create own activities" ON public.alumni_activities
  FOR INSERT
  WITH CHECK (
    alumni_id IN (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
  );

-- Create function to automatically create alumni profile when user registers
CREATE OR REPLACE FUNCTION public.create_alumni_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract set number from service number (e.g., "AFMS 95/2000" -> "95")
  DECLARE
    set_num TEXT;
    grad_year TEXT;
  BEGIN
    -- Parse service number format "AFMS XX/YYYY"
    set_num := SUBSTRING(NEW.service_number FROM 'AFMS (\d+)/');
    grad_year := SUBSTRING(NEW.service_number FROM 'AFMS \d+/(\d{4})');
    
    INSERT INTO public.alumni_profiles (
      user_id,
      first_name,
      last_name,
      service_number,
      set_number,
      squadron,
      graduation_year,
      phone,
      chapter,
      current_location,
      country,
      profile_photo_url
    ) VALUES (
      NEW.id,
      SPLIT_PART(NEW.full_name, ' ', 1),
      SPLIT_PART(NEW.full_name, ' ', 2),
      NEW.service_number,
      COALESCE(set_num, '00'),
      COALESCE(NEW.squadron, 'GREEN'),
      COALESCE(grad_year, '2000'),
      NEW.phone,
      COALESCE(NEW.chapter, 'FCT-Abuja'),
      COALESCE(NEW.current_location, 'Abuja'),
      'Nigeria',
      NEW.profile_photo
    );
    
    -- Log the activity
    INSERT INTO public.alumni_activities (
      alumni_id,
      activity_type,
      activity_data
    ) VALUES (
      (SELECT id FROM public.alumni_profiles WHERE user_id = NEW.id),
      'joined',
      jsonb_build_object(
        'name', NEW.full_name,
        'squadron', NEW.squadron,
        'set', set_num
      )
    );
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create alumni profile
CREATE TRIGGER create_alumni_profile_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_alumni_profile_on_signup();

-- Create function to update alumni profile timestamp
CREATE OR REPLACE FUNCTION public.update_alumni_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_alumni_profile_timestamp_trigger
  BEFORE UPDATE ON public.alumni_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_alumni_profile_timestamp();

-- Create view for alumni directory with connection status
CREATE OR REPLACE VIEW public.alumni_directory AS
SELECT 
  ap.*,
  u.email,
  u.created_at as member_since,
  CASE 
    WHEN ac1.status = 'accepted' OR ac2.status = 'accepted' THEN 'connected'
    WHEN ac1.status = 'pending' OR ac2.status = 'pending' THEN 'pending'
    ELSE 'none'
  END as connection_status
FROM public.alumni_profiles ap
LEFT JOIN public.users u ON ap.user_id = u.id
LEFT JOIN public.alumni_connections ac1 
  ON ac1.requester_id = ap.id 
  AND ac1.receiver_id = (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid())
LEFT JOIN public.alumni_connections ac2 
  ON ac2.receiver_id = ap.id 
  AND ac2.requester_id = (SELECT id FROM public.alumni_profiles WHERE user_id = auth.uid());

-- Grant permissions for the view
GRANT SELECT ON public.alumni_directory TO authenticated;
GRANT SELECT ON public.alumni_directory TO anon;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO public.alumni_profiles (user_id, first_name, last_name, service_number, set_number, squadron, graduation_year, chapter, current_location)
-- VALUES 
--   (gen_random_uuid(), 'John', 'Doe', 'AFMS 95/2000', '95', 'GREEN', '2000', 'FCT-Abuja', 'Abuja'),
--   (gen_random_uuid(), 'Jane', 'Smith', 'AFMS 96/2001', '96', 'RED', '2001', 'Lagos', 'Lagos'),
--   (gen_random_uuid(), 'Mike', 'Johnson', 'AFMS 94/1999', '94', 'PURPLE', '1999', 'Kaduna', 'Kaduna');