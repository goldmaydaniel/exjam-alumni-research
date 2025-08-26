-- Create Alumni Profiles - Simplified approach
-- This bypasses auth.users and creates mock data directly

-- First, let's check what's in the database
SELECT 'Current Alumni Directory Count' as info, COUNT(*) as count FROM alumni_directory;

-- Let's create some test auth users first (if they don't exist)
-- Note: This uses the service role to bypass RLS
DO $$
DECLARE
    user1_uuid UUID;
    user2_uuid UUID;
    user3_uuid UUID;
    user4_uuid UUID;
    user5_uuid UUID;
    user6_uuid UUID;
    user7_uuid UUID;
    user8_uuid UUID;
BEGIN
    -- Generate consistent UUIDs for our test users
    user1_uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
    user2_uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid;
    user3_uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid;
    user4_uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid;
    user5_uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'::uuid;
    user6_uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16'::uuid;
    user7_uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17'::uuid;
    user8_uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18'::uuid;

    -- Create user profiles (bypassing auth.users requirement for now)
    INSERT INTO user_profiles (id, user_id, first_name, last_name, email, phone, user_type, is_verified, current_location, country, occupation, company, linkedin_url, profile_photo_url, created_at, updated_at) VALUES 
    (gen_random_uuid(), user1_uuid, 'Wing Cdr', 'Adeyemi', 'w.adeyemi@email.com', '+234 801 234 5678', 'alumni_member', true, 'Abuja, FCT', 'Nigeria', 'Wing Commander', 'Nigerian Air Force', null, '/api/placeholder/150/150', '2024-01-15T10:00:00Z', '2024-01-15T10:00:00Z'),
    (gen_random_uuid(), user2_uuid, 'Dr. Samuel', 'Adebayo', 'samuel.adebayo@email.com', '+234 802 345 6789', 'alumni_member', true, 'Lagos, Lagos State', 'Nigeria', 'Aviation Consultant', 'AeroTech Solutions', 'linkedin.com/in/samueladebayo', '/api/placeholder/150/150', '2024-02-20T10:00:00Z', '2024-02-20T10:00:00Z'),
    (gen_random_uuid(), user3_uuid, 'Engr. Ibrahim', 'Mohammed', 'ibrahim.m@email.com', null, 'alumni_member', true, 'Kaduna, Kaduna State', 'Nigeria', 'Aerospace Engineer', 'NAF Research & Development', null, '/api/placeholder/150/150', '2024-03-10T10:00:00Z', '2024-03-10T10:00:00Z'),
    (gen_random_uuid(), user4_uuid, 'Captain', 'Okonkwo', 'p.okonkwo@email.com', '+234 803 456 7890', 'alumni_member', true, 'Port Harcourt, Rivers', 'Nigeria', 'Airline Pilot', 'Air Peace', null, '/api/placeholder/150/150', '2024-04-05T10:00:00Z', '2024-04-05T10:00:00Z'),
    (gen_random_uuid(), user5_uuid, 'James', 'Williams', 'j.williams@email.com', null, 'alumni_member', true, 'London', 'United Kingdom', 'Investment Banker', 'Barclays Capital', 'linkedin.com/in/jwilliams', '/api/placeholder/150/150', '2024-05-12T10:00:00Z', '2024-05-12T10:00:00Z'),
    (gen_random_uuid(), user6_uuid, 'Col. Fatima', 'Usman', 'f.usman@email.com', '+234 805 678 9012', 'alumni_member', true, 'Jos, Plateau State', 'Nigeria', 'Military Strategist', 'Defence HQ', null, '/api/placeholder/150/150', '2024-06-20T10:00:00Z', '2024-06-20T10:00:00Z'),
    (gen_random_uuid(), user7_uuid, 'David', 'Chen', 'd.chen@email.com', null, 'alumni_member', true, 'Dubai', 'UAE', 'Tech CEO', 'SkyTech Innovations', 'linkedin.com/in/davidchen', '/api/placeholder/150/150', '2024-07-15T10:00:00Z', '2024-07-15T10:00:00Z'),
    (gen_random_uuid(), user8_uuid, 'Grace', 'Adeleke', 'g.adeleke@email.com', '+234 806 789 0123', 'alumni_member', true, 'Victoria Island, Lagos', 'Nigeria', 'Legal Advisor', 'Adeleke & Associates', null, '/api/placeholder/150/150', '2024-08-10T10:00:00Z', '2024-08-10T10:00:00Z')
    ON CONFLICT (user_id) DO NOTHING;

    -- Create corresponding alumni profiles
    INSERT INTO alumni_profiles (id, user_id, service_number, squadron, set_number, graduation_year, chapter, achievements, interests, last_active, created_at, updated_at) VALUES
    (gen_random_uuid(), user1_uuid, 'AFMS85/1990', 'GREEN', '85', '1990', 'Abuja Chapter', ARRAY['Distinguished Service Medal', 'Best Squadron Leader'], ARRAY['Leadership', 'Aviation', 'Community Service'], '2025-01-25T12:00:00Z', NOW(), NOW()),
    (gen_random_uuid(), user2_uuid, 'AFMS92/1997', 'RED', '92', '1997', 'Lagos Chapter', ARRAY['Academic Excellence', 'Squadron Captain'], ARRAY['Technology', 'Consulting', 'Innovation'], '2025-01-24T12:00:00Z', NOW(), NOW()),
    (gen_random_uuid(), user3_uuid, 'AFMS88/1993', 'PURPLE', '88', '1993', 'Kaduna Chapter', ARRAY['Innovation Award', 'Best Technical Officer'], ARRAY['Engineering', 'Research', 'Development'], '2025-01-23T12:00:00Z', NOW(), NOW()),
    (gen_random_uuid(), user4_uuid, 'AFMS90/1995', 'YELLOW', '90', '1995', 'Port Harcourt Chapter', ARRAY['Flight Safety Award', '10,000 Flight Hours'], ARRAY['Aviation', 'Safety', 'Training'], '2025-01-22T12:00:00Z', NOW(), NOW()),
    (gen_random_uuid(), user5_uuid, 'AFMS87/1992', 'DORNIER', '87', '1992', 'International Chapter', ARRAY['International Excellence'], ARRAY['Finance', 'Investment', 'Global Markets'], '2025-01-20T12:00:00Z', NOW(), NOW()),
    (gen_random_uuid(), user6_uuid, 'AFMS89/1994', 'PUMA', '89', '1994', 'Jos Chapter', ARRAY['Leadership Excellence', 'Peace Medal'], ARRAY['Strategy', 'Leadership', 'Peace Building'], '2025-01-25T12:00:00Z', NOW(), NOW()),
    (gen_random_uuid(), user7_uuid, 'AFMS95/2000', 'GREEN', '95', '2000', 'International Chapter', ARRAY['Entrepreneur of the Year', 'Innovation Leader'], ARRAY['Technology', 'Innovation', 'Entrepreneurship'], '2025-01-24T12:00:00Z', NOW(), NOW()),
    (gen_random_uuid(), user8_uuid, 'AFMS93/1998', 'RED', '93', '1998', 'Lagos Chapter', ARRAY['Legal Excellence Award'], ARRAY['Law', 'Justice', 'Corporate Advisory'], '2025-01-25T12:00:00Z', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- Create memberships (get tier IDs first)
    INSERT INTO user_memberships (id, user_id, tier_id, membership_type, status, start_date, end_date, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        user_id,
        (SELECT id FROM membership_tiers WHERE tier_type = 'lifetime' LIMIT 1),
        'lifetime'::membership_type,
        'active',
        '2024-01-01T00:00:00Z'::timestamp with time zone,
        NULL,
        NOW(),
        NOW()
    FROM (VALUES (user1_uuid), (user4_uuid), (user6_uuid)) AS lifetime_users(user_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO user_memberships (id, user_id, tier_id, membership_type, status, start_date, end_date, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        user_id,
        (SELECT id FROM membership_tiers WHERE tier_type = 'annual' LIMIT 1),
        'annual'::membership_type,
        'active',
        '2024-01-01T00:00:00Z'::timestamp with time zone,
        '2025-12-31T23:59:59Z'::timestamp with time zone,
        NOW(),
        NOW()
    FROM (VALUES (user2_uuid), (user3_uuid), (user5_uuid), (user7_uuid), (user8_uuid)) AS annual_users(user_id)
    ON CONFLICT DO NOTHING;

END$$;

-- Verify the results
SELECT 'Final Alumni Directory Count' as info, COUNT(*) as count FROM alumni_directory;
SELECT 'User Profiles Count' as info, COUNT(*) as count FROM user_profiles WHERE user_type = 'alumni_member';
SELECT 'Alumni Profiles Count' as info, COUNT(*) as count FROM alumni_profiles;
SELECT 'Active Memberships Count' as info, COUNT(*) as count FROM user_memberships WHERE status = 'active';