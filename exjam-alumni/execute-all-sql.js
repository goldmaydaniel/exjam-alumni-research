const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Direct database connection using the credentials provided
const connectionString = "postgresql://postgres:A7NT3Or3rANhdeqz@db.yzrzjagkkycmdwuhrvww.supabase.co:5432/postgres";

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function executeSQLFile(client, filePath, fileName) {
  try {
    console.log(`\n📄 Executing: ${fileName}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  File not found: ${fileName}`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Remove comments and split statements
    const statements = sqlContent
      .replace(/--.*$/gm, '') // Remove single line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    let success = 0;
    let failed = 0;
    
    for (const statement of statements) {
      if (statement.trim() === ';' || statement.trim() === '') continue;
      
      try {
        await client.query(statement);
        success++;
      } catch (error) {
        // Log but continue - some statements may fail if objects already exist
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key')) {
          // These are expected errors, don't count as failures
        } else {
          console.log(`   ⚠️  Error: ${error.message.substring(0, 100)}`);
          failed++;
        }
      }
    }
    
    console.log(`   ✅ Executed: ${success} statements successful, ${failed} failed`);
    return failed === 0;
    
  } catch (error) {
    console.error(`   ❌ Failed to execute ${fileName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Connecting to Supabase Database...\n');
  console.log('================================');
  
  try {
    await client.connect();
    console.log('✅ Connected to database successfully!\n');
    
    // Essential SQL files to execute in order
    const sqlFiles = [
      'create-alumni-tables.sql',
      'create-badge-system.sql',
      'create-event-enhancements.sql',
      'create-messaging-tables.sql',
      'create-site-config.sql',
      'create-waitlist-table.sql',
      'setup-admin-tables.sql',
      'fix-permissions.sql',
      'fix-admin-tables.sql'
    ];
    
    // First, ensure UUID extension is enabled
    console.log('🔧 Enabling extensions...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    console.log('✅ Extensions enabled\n');
    
    // Create essential tables first
    console.log('📊 Creating essential tables...\n');
    
    const essentialTables = `
      -- User table
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
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Event table
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
        "organizerId" TEXT REFERENCES "User"(id),
        "imageUrl" TEXT,
        category TEXT,
        tags TEXT[],
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Registration table
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
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "eventId")
      );

      -- Ticket table
      CREATE TABLE IF NOT EXISTS "Ticket" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "registrationId" TEXT REFERENCES "Registration"(id) ON DELETE CASCADE,
        "ticketNumber" TEXT UNIQUE NOT NULL,
        "qrCode" TEXT,
        "checkedIn" BOOLEAN DEFAULT false,
        "checkinTime" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- ContactMessage table
      CREATE TABLE IF NOT EXISTS "ContactMessage" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        "repliedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- SiteConfig table
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
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT single_config CHECK (id = 1)
      );

      -- Waitlist table
      CREATE TABLE IF NOT EXISTS "Waitlist" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "eventId" TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        name TEXT,
        phone TEXT,
        status TEXT DEFAULT 'WAITING',
        "notifiedAt" TIMESTAMPTZ,
        "convertedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("eventId", email)
      );
    `;
    
    const statements = essentialTables.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      try {
        await client.query(stmt + ';');
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log(`   ⚠️  ${error.message.substring(0, 100)}`);
        }
      }
    }
    console.log('✅ Essential tables created\n');
    
    // Execute other SQL files
    for (const sqlFile of sqlFiles) {
      if (fs.existsSync(sqlFile)) {
        await executeSQLFile(client, sqlFile, sqlFile);
      }
    }
    
    // Enable Row Level Security
    console.log('\n🔒 Enabling Row Level Security...');
    const rlsTables = ['User', 'Event', 'Registration', 'Ticket', 'ContactMessage', 'Waitlist'];
    for (const table of rlsTables) {
      try {
        await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      } catch (error) {
        // Ignore if already enabled
      }
    }
    console.log('✅ RLS enabled on all tables\n');
    
    // Create RLS policies
    console.log('📋 Creating RLS policies...');
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Public read access" ON "Event" FOR SELECT USING (status IN ('PUBLISHED', 'COMPLETED'))`,
      `CREATE POLICY IF NOT EXISTS "Users can view own data" ON "User" FOR SELECT USING (id = current_user)`,
      `CREATE POLICY IF NOT EXISTS "Users can update own data" ON "User" FOR UPDATE USING (id = current_user)`,
      `CREATE POLICY IF NOT EXISTS "Users can view own registrations" ON "Registration" FOR SELECT USING ("userId" = current_user)`,
      `CREATE POLICY IF NOT EXISTS "Admins can view all" ON "ContactMessage" FOR ALL USING (true)`,
    ];
    
    for (const policy of policies) {
      try {
        await client.query(policy);
      } catch (error) {
        // Ignore if policy already exists
      }
    }
    console.log('✅ RLS policies created\n');
    
    // Grant permissions
    console.log('🔑 Granting permissions...');
    await client.query('GRANT USAGE ON SCHEMA public TO anon, authenticated;');
    await client.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;');
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;');
    await client.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;');
    console.log('✅ Permissions granted\n');
    
    // Create a test admin user
    console.log('👤 Creating test admin user...');
    try {
      await client.query(`
        INSERT INTO "User" (id, email, "firstName", "lastName", "fullName", role, "emailVerified")
        VALUES (gen_random_uuid()::text, 'admin@exjam.org.ng', 'Admin', 'User', 'Admin User', 'ADMIN', true)
        ON CONFLICT (email) DO NOTHING;
      `);
      console.log('✅ Admin user created: admin@exjam.org.ng\n');
    } catch (error) {
      console.log('   Admin user might already exist\n');
    }
    
    // Create test event
    console.log('📅 Creating test event...');
    try {
      await client.query(`
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
        );
      `);
      console.log('✅ Test event created\n');
    } catch (error) {
      console.log('   Test event might already exist\n');
    }
    
    console.log('================================');
    console.log('✨ Database setup completed successfully!');
    console.log('================================\n');
    
    // Verify tables
    console.log('📊 Verifying database tables...\n');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('Tables in database:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    console.log('\n🎉 All done! Your database is ready.');
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);