-- Enable RLS on alumni_profiles if not already enabled
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Alumni profiles are viewable by everyone" ON alumni_profiles;
DROP POLICY IF EXISTS "Users can insert own alumni profile" ON alumni_profiles;
DROP POLICY IF EXISTS "Users can update own alumni profile" ON alumni_profiles;

-- Create new policies
CREATE POLICY "Alumni profiles are viewable by everyone"
ON alumni_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert own alumni profile"
ON alumni_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alumni profile"
ON alumni_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON alumni_profiles TO anon;
GRANT SELECT ON alumni_profiles TO authenticated;
GRANT ALL ON alumni_profiles TO service_role;
