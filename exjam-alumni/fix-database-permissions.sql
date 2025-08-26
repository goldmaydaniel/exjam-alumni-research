-- Fix Database Permissions for Supabase
-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all privileges on all tables to service_role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
DROP POLICY IF EXISTS "Service role has full access" ON "User";

-- Create RLS policies for User table
CREATE POLICY "Users can view their own profile" 
  ON "User" FOR SELECT 
  TO authenticated 
  USING (id = auth.uid()::text);

CREATE POLICY "Users can update their own profile" 
  ON "User" FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid()::text);

CREATE POLICY "Service role has full access" 
  ON "User" FOR ALL 
  TO service_role 
  USING (true);

-- Success
SELECT 'Permissions fixed successfully!' as message;
