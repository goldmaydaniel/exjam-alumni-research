-- EXJAM Admin Role Setup Migration
-- This migration creates a secure admin role and assigns it to goldmay@gmail.com
-- WITHOUT giving full superuser access

-- Create custom admin role for ExJAM platform management
DO $$ BEGIN
    CREATE ROLE exjam_admin_role;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant necessary permissions to the admin role
-- This gives control over the application data without full database access

-- Grant access to all tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO exjam_admin_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO exjam_admin_role;

-- Grant ability to create new tables and modify schema
GRANT CREATE ON SCHEMA public TO exjam_admin_role;
GRANT USAGE ON SCHEMA public TO exjam_admin_role;

-- Grant access to future tables (important for new migrations)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO exjam_admin_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO exjam_admin_role;

-- Grant access to storage (for file uploads)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO exjam_admin_role;
GRANT USAGE ON SCHEMA storage TO exjam_admin_role;

-- Grant access to auth schema (for user management)
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO exjam_admin_role;
GRANT USAGE ON SCHEMA auth TO exjam_admin_role;

-- Create a function to safely assign the admin role to a user
CREATE OR REPLACE FUNCTION assign_exjam_admin_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    result TEXT;
BEGIN
    -- Find the user by email
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        result := 'User with email ' || user_email || ' not found';
        RAISE NOTICE '%', result;
        RETURN result;
    END IF;
    
    -- Grant the admin role to the user
    EXECUTE 'GRANT exjam_admin_role TO ' || quote_ident(user_email);
    
    result := 'Successfully assigned exjam_admin_role to ' || user_email;
    RAISE NOTICE '%', result;
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := 'Error assigning role: ' || SQLERRM;
        RAISE NOTICE '%', result;
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check admin permissions
CREATE OR REPLACE FUNCTION is_exjam_admin(user_email TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_email TEXT;
    is_admin BOOLEAN := FALSE;
BEGIN
    -- If no email provided, use current user
    IF user_email IS NULL THEN
        current_user_email := auth.jwt() ->> 'email';
    ELSE
        current_user_email := user_email;
    END IF;
    
    -- Check if user has the admin role
    SELECT EXISTS(
        SELECT 1 
        FROM pg_roles r
        JOIN pg_auth_members m ON m.roleid = r.oid
        JOIN pg_roles u ON u.oid = m.member
        WHERE r.rolname = 'exjam_admin_role'
        AND u.rolname = current_user_email
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Row Level Security (RLS) policies for admin access
-- This ensures only admins can access certain operations

-- Example: Admin-only access to user management
CREATE POLICY "Admin can manage all users" ON auth.users
    FOR ALL
    TO exjam_admin_role
    USING (true)
    WITH CHECK (true);

-- Example: Admin can manage all events
CREATE POLICY "Admin can manage all events" ON public.events
    FOR ALL
    TO exjam_admin_role
    USING (true)
    WITH CHECK (true);

-- Example: Admin can manage all registrations
CREATE POLICY "Admin can manage all registrations" ON public.registrations
    FOR ALL
    TO exjam_admin_role
    USING (true)
    WITH CHECK (true);

-- Create a view for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.events) as total_events,
    (SELECT COUNT(*) FROM public.registrations) as total_registrations,
    (SELECT COUNT(*) FROM public.events WHERE status = 'published') as published_events,
    (SELECT COUNT(*) FROM public.registrations WHERE status = 'confirmed') as confirmed_registrations;

-- Grant access to admin dashboard view
GRANT SELECT ON admin_dashboard_stats TO exjam_admin_role;

-- Create a function to get admin audit log
CREATE OR REPLACE FUNCTION get_admin_audit_log(
    start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
    action_type TEXT,
    table_name TEXT,
    record_id UUID,
    user_email TEXT,
    action_timestamp TIMESTAMP,
    details JSONB
) AS $$
BEGIN
    -- This would typically query a proper audit log table
    -- For now, return empty result as audit logging needs to be implemented
    RETURN QUERY
    SELECT 
        'audit_not_implemented'::TEXT as action_type,
        'none'::TEXT as table_name,
        NULL::UUID as record_id,
        'system'::TEXT as user_email,
        NOW()::TIMESTAMP as action_timestamp,
        '{"message": "Audit logging not yet implemented"}'::JSONB as details
    WHERE FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to audit function
GRANT EXECUTE ON FUNCTION get_admin_audit_log(TIMESTAMP, TIMESTAMP) TO exjam_admin_role;

-- Create a function to safely revoke admin role
CREATE OR REPLACE FUNCTION revoke_exjam_admin_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Revoke the admin role from the user
    EXECUTE 'REVOKE exjam_admin_role FROM ' || quote_ident(user_email);
    
    result := 'Successfully revoked exjam_admin_role from ' || user_email;
    RAISE NOTICE '%', result;
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := 'Error revoking role: ' || SQLERRM;
        RAISE NOTICE '%', result;
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial admin user (goldmay@gmail.com) - this will be executed manually
-- DO $$
-- BEGIN
--     PERFORM assign_exjam_admin_role('goldmay@gmail.com');
-- END $$;

-- Create a comment documenting the admin role setup
COMMENT ON ROLE exjam_admin_role IS 'ExJAM Alumni Platform Admin Role - Provides application-level admin access without full database superuser privileges';

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'ExJAM Admin Role Setup Migration Completed Successfully';
    RAISE NOTICE 'To assign admin role to goldmay@gmail.com, run: SELECT assign_exjam_admin_role(''goldmay@gmail.com'');';
    RAISE NOTICE 'To check if a user is admin, run: SELECT is_exjam_admin(''goldmay@gmail.com'');';
END $$;
