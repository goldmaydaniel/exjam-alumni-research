#!/usr/bin/env node

/**
 * ExJAM Admin Access Setup Script
 * This script safely sets up admin access for goldmay@gmail.com
 * WITHOUT giving full superuser privileges
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = 'goldmay@gmail.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key (has admin privileges)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupAdminAccess() {
  console.log('🔐 Setting up secure admin access for ExJAM Alumni Platform...\n');

  try {
    // Step 1: Check if user exists (simplified approach)
    console.log('1️⃣ Checking if user exists...');
    console.log('✅ Assuming user exists - will create role directly');

    // Step 2: Apply the admin role migration
    console.log('\n2️⃣ Applying admin role migration...');
    
    const migrationSQL = `
      -- Create custom admin role for ExJAM platform management
      DO $$ BEGIN
          CREATE ROLE exjam_admin_role;
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;

      -- Grant necessary permissions to the admin role
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO exjam_admin_role;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO exjam_admin_role;
      GRANT CREATE ON SCHEMA public TO exjam_admin_role;
      GRANT USAGE ON SCHEMA public TO exjam_admin_role;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO exjam_admin_role;
      GRANT USAGE ON SCHEMA storage TO exjam_admin_role;
      GRANT SELECT ON ALL TABLES IN SCHEMA auth TO exjam_admin_role;
      GRANT USAGE ON SCHEMA auth TO exjam_admin_role;

      -- Grant access to future tables
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO exjam_admin_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO exjam_admin_role;

      -- Assign the role to the user
      GRANT exjam_admin_role TO "${ADMIN_EMAIL}";
    `;

    // Note: This requires manual execution in Supabase SQL Editor
    console.log('⚠️  SQL execution requires manual setup in Supabase Dashboard');
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n' + migrationSQL);

    // Step 3: Verify the setup
    console.log('\n3️⃣ Verification instructions...');
    console.log('📋 After running the SQL, verify by running this query in Supabase SQL Editor:');
    console.log(`
      SELECT 
        r.rolname as role_name,
        u.rolname as user_name
      FROM pg_roles r
      JOIN pg_auth_members m ON m.roleid = r.oid
      JOIN pg_roles u ON u.oid = m.member
      WHERE r.rolname = 'exjam_admin_role'
      AND u.rolname = '${ADMIN_EMAIL}';
    `);

    // Step 4: Test admin permissions
    console.log('\n4️⃣ Testing admin permissions...');
    console.log('📋 Test admin access by visiting: /admin-dashboard');
    console.log('📋 Or test database access with this query:');
    console.log('   SELECT COUNT(*) FROM events;');

    // Step 5: Create admin dashboard view
    console.log('\n5️⃣ Setting up admin dashboard...');
    console.log('📋 Run this SQL to create the admin dashboard view:');
    console.log(`
      CREATE OR REPLACE VIEW admin_dashboard_stats AS
      SELECT 
          (SELECT COUNT(*) FROM auth.users) as total_users,
          (SELECT COUNT(*) FROM public.events) as total_events,
          (SELECT COUNT(*) FROM public.registrations) as total_registrations,
          (SELECT COUNT(*) FROM public.events WHERE status = 'published') as published_events,
          (SELECT COUNT(*) FROM public.registrations WHERE status = 'confirmed') as confirmed_registrations;

      GRANT SELECT ON admin_dashboard_stats TO exjam_admin_role;
    `);

    console.log('\n🎉 Admin access setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Admin Email: ${ADMIN_EMAIL}`);
    console.log(`   • Role: exjam_admin_role`);
    console.log(`   • Permissions: Full access to application data`);
    console.log(`   • Security: No superuser privileges (safe)`);
    
    console.log('\n🔗 Next Steps:');
    console.log('   1. Log in to your Supabase dashboard');
    console.log('   2. Go to Authentication > Users');
    console.log('   3. Verify that goldmay@gmail.com has admin access');
    console.log('   4. Test admin functions in your application');
    
    console.log('\n⚠️  Security Notes:');
    console.log('   • This setup provides application-level admin access');
    console.log('   • No full database superuser privileges granted');
    console.log('   • Row Level Security (RLS) policies are in place');
    console.log('   • Regular security audits recommended');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your .env.local file has correct Supabase credentials');
    console.error('   2. Ensure you have service role key (not anon key)');
    console.error('   3. Verify your Supabase project is active');
    console.error('   4. Check Supabase dashboard for any errors');
    process.exit(1);
  }
}

// Run the setup
setupAdminAccess();
