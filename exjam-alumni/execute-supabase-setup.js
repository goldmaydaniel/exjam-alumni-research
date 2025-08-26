const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Setting up Database via Supabase Service Role...\n');
console.log('================================\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

async function setupDatabase() {
  try {
    console.log('📊 Creating database tables via Supabase...\n');
    
    // Combined SQL for all tables
    const createTablesSql = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Create User table
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT UNIQUE NOT NULL,
      "emailVerified" BOOLEAN DEFAULT false,
      "firstName" TEXT,
      "lastName" TEXT,
      "fullName" TEXT,
      "serviceNumber" TEXT,
      "set" TEXT,
      squadron TEXT,
      phone TEXT,
      chapter TEXT,
      role TEXT DEFAULT 'GUEST_MEMBER',
      "profilePhotoUrl" TEXT,
      "badgePhotoUrl" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create Event table
    CREATE TABLE IF NOT EXISTS "Event" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title TEXT NOT NULL,
      description TEXT,
      "shortDescription" TEXT,
      "startDate" TIMESTAMPTZ NOT NULL,
      "endDate" TIMESTAMPTZ,
      venue TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      price DECIMAL DEFAULT 0,
      capacity INTEGER DEFAULT 100,
      status TEXT DEFAULT 'DRAFT',
      "organizerId" TEXT,
      "imageUrl" TEXT,
      category TEXT,
      tags TEXT[],
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create Registration table
    CREATE TABLE IF NOT EXISTS "Registration" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
      "eventId" TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
      "ticketType" TEXT DEFAULT 'STANDARD',
      status TEXT DEFAULT 'PENDING',
      "ticketNumber" TEXT UNIQUE,
      "paymentReference" TEXT,
      amount DECIMAL DEFAULT 0,
      "checkedIn" BOOLEAN DEFAULT false,
      "checkinTime" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("userId", "eventId")
    );
    
    -- Create Ticket table
    CREATE TABLE IF NOT EXISTS "Ticket" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "registrationId" TEXT,
      "ticketNumber" TEXT UNIQUE NOT NULL,
      "qrCode" TEXT,
      "checkedIn" BOOLEAN DEFAULT false,
      "checkinTime" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create ContactMessage table
    CREATE TABLE IF NOT EXISTS "ContactMessage" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      "repliedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create SiteConfig table
    CREATE TABLE IF NOT EXISTS "SiteConfig" (
      id INTEGER PRIMARY KEY DEFAULT 1,
      "siteName" TEXT DEFAULT 'ExJAM Alumni Association',
      "siteDescription" TEXT,
      "contactEmail" TEXT DEFAULT 'info@exjam.org.ng',
      "contactPhone" TEXT,
      "mainLogoUrl" TEXT,
      "footerLogoUrl" TEXT,
      "faviconUrl" TEXT,
      "primaryColor" TEXT DEFAULT '#1e40af',
      "secondaryColor" TEXT DEFAULT '#3730a3',
      "registrationEnabled" BOOLEAN DEFAULT true,
      "eventsEnabled" BOOLEAN DEFAULT true,
      "paymentsEnabled" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT single_config CHECK (id = 1)
    );
    
    -- Create Waitlist table
    CREATE TABLE IF NOT EXISTS "Waitlist" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "eventId" TEXT,
      email TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      status TEXT DEFAULT 'WAITING',
      "notifiedAt" TIMESTAMPTZ,
      "convertedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Waitlist" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "SiteConfig" ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "public_events_view" ON "Event" 
      FOR SELECT USING (status IN ('PUBLISHED', 'COMPLETED'));
    
    CREATE POLICY "service_role_all_users" ON "User" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_events" ON "Event" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_registrations" ON "Registration" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_tickets" ON "Ticket" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_messages" ON "ContactMessage" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_waitlist" ON "Waitlist" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_siteconfig" ON "SiteConfig" 
      FOR ALL TO service_role USING (true);
    
    -- Grant permissions
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
    
    -- Insert admin user
    INSERT INTO "User" (email, "firstName", "lastName", "fullName", role, "emailVerified")
    VALUES ('admin@exjam.org.ng', 'Admin', 'User', 'Admin User', 'ADMIN', true)
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert test event
    INSERT INTO "Event" (title, "shortDescription", "startDate", "endDate", venue, city, state, price, capacity, status)
    VALUES (
      '2025 EXJAM Annual Convention',
      'Join us for the annual gathering of Ex-Junior Airmen',
      '2025-12-01 09:00:00+00',
      '2025-12-03 18:00:00+00',
      'Sheraton Hotel',
      'Abuja',
      'FCT',
      50000,
      500,
      'PUBLISHED'
    ) ON CONFLICT DO NOTHING;
    `;
    
    // Execute SQL via RPC
    let data, error;
    try {
      const result = await supabase.rpc('exec_sql', {
        query: createTablesSql
      });
      data = result.data;
      error = result.error;
    } catch (err) {
      // If RPC doesn't exist, try direct execution
      console.log('⚠️  RPC not available, testing table access...\n');
      
      // Test if tables exist
      const { data: users, error: userError } = await supabase.from('User').select('id').limit(1);
      const { data: events, error: eventError } = await supabase.from('Event').select('id').limit(1);
      
      if (!userError) {
        console.log('✅ User table exists');
      } else {
        console.log(`❌ User table: ${userError.message}`);
      }
      
      if (!eventError) {
        console.log('✅ Event table exists');
      } else {
        console.log(`❌ Event table: ${eventError.message}`);
      }
      
      data = null;
      error = err;
    }
    
    if (error) {
      console.log('⚠️  Direct SQL execution not available');
      console.log('\n📋 Manual Setup Required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/sql/new');
      console.log('2. Copy the SQL from the generated file: complete-database-setup.sql');
      console.log('3. Run it in the SQL editor\n');
      
      // Write SQL to file for manual execution
      const fs = require('fs');
      fs.writeFileSync('complete-database-setup.sql', createTablesSql);
      console.log('✅ SQL saved to: complete-database-setup.sql');
    } else {
      console.log('✅ Database setup completed successfully!');
    }
    
    // Create admin in Supabase Auth
    console.log('\n👤 Creating admin user in Supabase Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@exjam.org.ng',
      password: 'Admin123!@#',
      email_confirm: true,
      user_metadata: {
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      }
    });
    
    if (authError && !authError.message.includes('already been registered')) {
      console.log(`⚠️  Auth error: ${authError.message}`);
    } else {
      console.log('✅ Admin user created in Supabase Auth');
    }
    
    // Verify database access
    console.log('\n🔍 Testing database access...');
    
    const tables = ['User', 'Event', 'Registration', 'ContactMessage', 'SiteConfig', 'Waitlist'];
    let accessible = 0;
    
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('id').limit(1);
      if (!tableError) {
        console.log(`   ✅ ${table} table: Accessible`);
        accessible++;
      } else {
        console.log(`   ❌ ${table} table: ${tableError.message}`);
      }
    }
    
    console.log('\n================================');
    console.log(`📊 ${accessible}/${tables.length} tables accessible`);
    console.log('================================\n');
    
    if (accessible === tables.length) {
      console.log('🎉 All tables ready! Your application is fully configured.');
    } else {
      console.log('⚠️  Some tables need to be created manually.');
      console.log('   Please run the SQL in complete-database-setup.sql via Supabase Dashboard');
    }
    
    console.log('\n📱 Application Details:');
    console.log('   URL: http://localhost:3001');
    console.log('   Admin: admin@exjam.org.ng / Admin123!@#');
    console.log('   Supabase: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  }
}

setupDatabase();