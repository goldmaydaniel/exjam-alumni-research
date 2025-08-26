-- Create Alumni Profiles in Supabase Database
-- This inserts the frontend demo alumni into the real database

-- First, create auth users (mock UUIDs for demo purposes)
-- Note: In production, these would be created through Supabase Auth

-- Create user profiles first
INSERT INTO user_profiles (id, user_id, first_name, last_name, email, phone, user_type, is_verified, current_location, country, occupation, company, linkedin_url, profile_photo_url, created_at, updated_at) VALUES 
(gen_random_uuid(), gen_random_uuid(), 'Wing Cdr', 'Adeyemi', 'w.adeyemi@email.com', '+234 801 234 5678', 'alumni_member', true, 'Abuja, FCT', 'Nigeria', 'Wing Commander', 'Nigerian Air Force', null, '/api/placeholder/150/150', '2024-01-15T10:00:00Z', '2024-01-15T10:00:00Z'),
(gen_random_uuid(), gen_random_uuid(), 'Dr. Samuel', 'Adebayo', 'samuel.adebayo@email.com', '+234 802 345 6789', 'alumni_member', true, 'Lagos, Lagos State', 'Nigeria', 'Aviation Consultant', 'AeroTech Solutions', 'linkedin.com/in/samueladebayo', '/api/placeholder/150/150', '2024-02-20T10:00:00Z', '2024-02-20T10:00:00Z'),
(gen_random_uuid(), gen_random_uuid(), 'Engr. Ibrahim', 'Mohammed', 'ibrahim.m@email.com', null, 'alumni_member', true, 'Kaduna, Kaduna State', 'Nigeria', 'Aerospace Engineer', 'NAF Research & Development', null, '/api/placeholder/150/150', '2024-03-10T10:00:00Z', '2024-03-10T10:00:00Z'),
(gen_random_uuid(), gen_random_uuid(), 'Captain', 'Okonkwo', 'p.okonkwo@email.com', '+234 803 456 7890', 'alumni_member', true, 'Port Harcourt, Rivers', 'Nigeria', 'Airline Pilot', 'Air Peace', null, '/api/placeholder/150/150', '2024-04-05T10:00:00Z', '2024-04-05T10:00:00Z'),
(gen_random_uuid(), gen_random_uuid(), 'James', 'Williams', 'j.williams@email.com', null, 'alumni_member', true, 'London', 'United Kingdom', 'Investment Banker', 'Barclays Capital', 'linkedin.com/in/jwilliams', '/api/placeholder/150/150', '2024-05-12T10:00:00Z', '2024-05-12T10:00:00Z'),
(gen_random_uuid(), gen_random_uuid(), 'Col. Fatima', 'Usman', 'f.usman@email.com', '+234 805 678 9012', 'alumni_member', true, 'Jos, Plateau State', 'Nigeria', 'Military Strategist', 'Defence HQ', null, '/api/placeholder/150/150', '2024-06-20T10:00:00Z', '2024-06-20T10:00:00Z'),
(gen_random_uuid(), gen_random_uuid(), 'David', 'Chen', 'd.chen@email.com', null, 'alumni_member', true, 'Dubai', 'UAE', 'Tech CEO', 'SkyTech Innovations', 'linkedin.com/in/davidchen', '/api/placeholder/150/150', '2024-07-15T10:00:00Z', '2024-07-15T10:00:00Z'),
(gen_random_uuid(), gen_random_uuid(), 'Grace', 'Adeleke', 'g.adeleke@email.com', '+234 806 789 0123', 'alumni_member', true, 'Victoria Island, Lagos', 'Nigeria', 'Legal Advisor', 'Adeleke & Associates', null, '/api/placeholder/150/150', '2024-08-10T10:00:00Z', '2024-08-10T10:00:00Z');

-- Now create corresponding alumni profiles
-- We need to get the user_ids from the user_profiles we just created
WITH user_data AS (
  SELECT user_id, email, first_name, last_name FROM user_profiles 
  WHERE user_type = 'alumni_member' 
  ORDER BY created_at
)
INSERT INTO alumni_profiles (id, user_id, service_number, squadron, set_number, graduation_year, chapter, achievements, interests, last_active, created_at, updated_at) 
SELECT 
  gen_random_uuid(),
  ud.user_id,
  CASE 
    WHEN ud.email = 'w.adeyemi@email.com' THEN 'AFMS85/1990'
    WHEN ud.email = 'samuel.adebayo@email.com' THEN 'AFMS92/1997'
    WHEN ud.email = 'ibrahim.m@email.com' THEN 'AFMS88/1993'
    WHEN ud.email = 'p.okonkwo@email.com' THEN 'AFMS90/1995'
    WHEN ud.email = 'j.williams@email.com' THEN 'AFMS87/1992'
    WHEN ud.email = 'f.usman@email.com' THEN 'AFMS89/1994'
    WHEN ud.email = 'd.chen@email.com' THEN 'AFMS95/2000'
    WHEN ud.email = 'g.adeleke@email.com' THEN 'AFMS93/1998'
  END,
  CASE 
    WHEN ud.email = 'w.adeyemi@email.com' THEN 'GREEN'
    WHEN ud.email = 'samuel.adebayo@email.com' THEN 'RED'
    WHEN ud.email = 'ibrahim.m@email.com' THEN 'PURPLE'
    WHEN ud.email = 'p.okonkwo@email.com' THEN 'YELLOW'
    WHEN ud.email = 'j.williams@email.com' THEN 'DORNIER'
    WHEN ud.email = 'f.usman@email.com' THEN 'PUMA'
    WHEN ud.email = 'd.chen@email.com' THEN 'GREEN'
    WHEN ud.email = 'g.adeleke@email.com' THEN 'RED'
  END,
  CASE 
    WHEN ud.email = 'w.adeyemi@email.com' THEN '85'
    WHEN ud.email = 'samuel.adebayo@email.com' THEN '92'
    WHEN ud.email = 'ibrahim.m@email.com' THEN '88'
    WHEN ud.email = 'p.okonkwo@email.com' THEN '90'
    WHEN ud.email = 'j.williams@email.com' THEN '87'
    WHEN ud.email = 'f.usman@email.com' THEN '89'
    WHEN ud.email = 'd.chen@email.com' THEN '95'
    WHEN ud.email = 'g.adeleke@email.com' THEN '93'
  END,
  CASE 
    WHEN ud.email = 'w.adeyemi@email.com' THEN '1990'
    WHEN ud.email = 'samuel.adebayo@email.com' THEN '1997'
    WHEN ud.email = 'ibrahim.m@email.com' THEN '1993'
    WHEN ud.email = 'p.okonkwo@email.com' THEN '1995'
    WHEN ud.email = 'j.williams@email.com' THEN '1992'
    WHEN ud.email = 'f.usman@email.com' THEN '1994'
    WHEN ud.email = 'd.chen@email.com' THEN '2000'
    WHEN ud.email = 'g.adeleke@email.com' THEN '1998'
  END,
  CASE 
    WHEN ud.email = 'w.adeyemi@email.com' THEN 'Abuja Chapter'
    WHEN ud.email = 'samuel.adebayo@email.com' THEN 'Lagos Chapter'
    WHEN ud.email = 'ibrahim.m@email.com' THEN 'Kaduna Chapter'
    WHEN ud.email = 'p.okonkwo@email.com' THEN 'Port Harcourt Chapter'
    WHEN ud.email = 'j.williams@email.com' THEN 'International Chapter'
    WHEN ud.email = 'f.usman@email.com' THEN 'Jos Chapter'
    WHEN ud.email = 'd.chen@email.com' THEN 'International Chapter'
    WHEN ud.email = 'g.adeleke@email.com' THEN 'Lagos Chapter'
  END,
  CASE 
    WHEN ud.email = 'w.adeyemi@email.com' THEN ARRAY['Distinguished Service Medal', 'Best Squadron Leader']
    WHEN ud.email = 'samuel.adebayo@email.com' THEN ARRAY['Academic Excellence', 'Squadron Captain']
    WHEN ud.email = 'ibrahim.m@email.com' THEN ARRAY['Innovation Award', 'Best Technical Officer']
    WHEN ud.email = 'p.okonkwo@email.com' THEN ARRAY['Flight Safety Award', '10,000 Flight Hours']
    WHEN ud.email = 'j.williams@email.com' THEN ARRAY['International Excellence']
    WHEN ud.email = 'f.usman@email.com' THEN ARRAY['Leadership Excellence', 'Peace Medal']
    WHEN ud.email = 'd.chen@email.com' THEN ARRAY['Entrepreneur of the Year', 'Innovation Leader']
    WHEN ud.email = 'g.adeleke@email.com' THEN ARRAY['Legal Excellence Award']
  END,
  CASE 
    WHEN ud.email = 'w.adeyemi@email.com' THEN ARRAY['Leadership', 'Aviation', 'Community Service']
    WHEN ud.email = 'samuel.adebayo@email.com' THEN ARRAY['Technology', 'Consulting', 'Innovation']
    WHEN ud.email = 'ibrahim.m@email.com' THEN ARRAY['Engineering', 'Research', 'Development']
    WHEN ud.email = 'p.okonkwo@email.com' THEN ARRAY['Aviation', 'Safety', 'Training']
    WHEN ud.email = 'j.williams@email.com' THEN ARRAY['Finance', 'Investment', 'Global Markets']
    WHEN ud.email = 'f.usman@email.com' THEN ARRAY['Strategy', 'Leadership', 'Peace Building']
    WHEN ud.email = 'd.chen@email.com' THEN ARRAY['Technology', 'Innovation', 'Entrepreneurship']
    WHEN ud.email = 'g.adeleke@email.com' THEN ARRAY['Law', 'Justice', 'Corporate Advisory']
  END,
  '2025-01-25T12:00:00Z',
  NOW(),
  NOW()
FROM user_data ud;

-- Create memberships for the alumni
WITH user_data AS (
  SELECT user_id, email FROM user_profiles 
  WHERE user_type = 'alumni_member' 
), membership_data AS (
  SELECT id as tier_id, tier_type FROM membership_tiers
)
INSERT INTO user_memberships (id, user_id, tier_id, membership_type, status, start_date, end_date, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ud.user_id,
  md.tier_id,
  CASE 
    WHEN ud.email IN ('w.adeyemi@email.com', 'p.okonkwo@email.com', 'f.usman@email.com') THEN 'lifetime'::membership_type
    ELSE 'annual'::membership_type
  END,
  'active',
  '2024-01-01T00:00:00Z',
  CASE 
    WHEN ud.email IN ('w.adeyemi@email.com', 'p.okonkwo@email.com', 'f.usman@email.com') THEN NULL
    ELSE '2025-12-31T23:59:59Z'
  END,
  NOW(),
  NOW()
FROM user_data ud
CROSS JOIN membership_data md
WHERE (
  (ud.email IN ('w.adeyemi@email.com', 'p.okonkwo@email.com', 'f.usman@email.com') AND md.tier_type = 'lifetime') OR
  (ud.email NOT IN ('w.adeyemi@email.com', 'p.okonkwo@email.com', 'f.usman@email.com') AND md.tier_type = 'annual')
);

-- Verify the data
SELECT 'Alumni Directory Count' as info, COUNT(*) as count FROM alumni_directory;
SELECT 'User Profiles Count' as info, COUNT(*) as count FROM user_profiles WHERE user_type = 'alumni_member';
SELECT 'Alumni Profiles Count' as info, COUNT(*) as count FROM alumni_profiles;
SELECT 'Memberships Count' as info, COUNT(*) as count FROM user_memberships WHERE status = 'active';