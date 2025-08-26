-- QUICK ADMIN SETUP FOR GOLDMAY@GMAIL.COM
-- Run this in your Supabase SQL Editor

-- Step 1: Create the admin role
DO $$ BEGIN
    CREATE ROLE exjam_admin_role;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Grant all necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO exjam_admin_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO exjam_admin_role;
GRANT CREATE ON SCHEMA public TO exjam_admin_role;
GRANT USAGE ON SCHEMA public TO exjam_admin_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO exjam_admin_role;
GRANT USAGE ON SCHEMA storage TO exjam_admin_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO exjam_admin_role;
GRANT USAGE ON SCHEMA auth TO exjam_admin_role;

-- Step 3: Grant access to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO exjam_admin_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO exjam_admin_role;

-- Step 4: Assign role to goldmay@gmail.com
GRANT exjam_admin_role TO "goldmay@gmail.com";

-- Step 5: Create admin dashboard view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.events) as total_events,
    (SELECT COUNT(*) FROM public.registrations) as total_registrations,
    (SELECT COUNT(*) FROM public.events WHERE status = 'published') as published_events,
    (SELECT COUNT(*) FROM public.registrations WHERE status = 'confirmed') as confirmed_registrations;

GRANT SELECT ON admin_dashboard_stats TO exjam_admin_role;

-- Step 6: Verify the setup
SELECT 
    r.rolname as role_name,
    u.rolname as user_name
FROM pg_roles r
JOIN pg_auth_members m ON m.roleid = r.oid
JOIN pg_roles u ON u.oid = m.member
WHERE r.rolname = 'exjam_admin_role'
AND u.rolname = 'goldmay@gmail.com';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin setup completed successfully!';
    RAISE NOTICE '🎯 goldmay@gmail.com now has admin access';
    RAISE NOTICE '🔗 Visit: /admin-dashboard to access admin panel';
END $$;
