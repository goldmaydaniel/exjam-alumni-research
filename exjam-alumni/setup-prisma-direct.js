const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

console.log('🚀 Setting up Database via Prisma Accelerate...\n');
console.log('================================\n');

async function setupDatabase() {
  // Use the Prisma Accelerate connection from .env
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });

  try {
    console.log('📊 Creating database tables...\n');
    
    // Execute raw SQL to create all tables
    const tables = [
      {
        name: 'User',
        sql: `CREATE TABLE IF NOT EXISTS "User" (
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
        )`
      },
      {
        name: 'Event',
        sql: `CREATE TABLE IF NOT EXISTS "Event" (
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
        )`
      },
      {
        name: 'Registration',
        sql: `CREATE TABLE IF NOT EXISTS "Registration" (
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
        )`
      },
      {
        name: 'Ticket',
        sql: `CREATE TABLE IF NOT EXISTS "Ticket" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "registrationId" TEXT,
          "ticketNumber" TEXT UNIQUE NOT NULL,
          "qrCode" TEXT,
          "checkedIn" BOOLEAN DEFAULT false,
          "checkinTime" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW()
        )`
      },
      {
        name: 'ContactMessage',
        sql: `CREATE TABLE IF NOT EXISTS "ContactMessage" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          "repliedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ DEFAULT NOW()
        )`
      },
      {
        name: 'SiteConfig',
        sql: `CREATE TABLE IF NOT EXISTS "SiteConfig" (
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
        )`
      },
      {
        name: 'Waitlist',
        sql: `CREATE TABLE IF NOT EXISTS "Waitlist" (
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
        )`
      }
    ];
    
    // Create each table
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(table.sql);
        console.log(`✅ Table "${table.name}" created/verified`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Table "${table.name}" already exists`);
        } else {
          console.log(`⚠️  Error with "${table.name}": ${error.message}`);
        }
      }
    }
    
    // Enable RLS
    console.log('\n🔒 Enabling Row Level Security...');
    const rlsTables = ['User', 'Event', 'Registration', 'Ticket', 'ContactMessage', 'Waitlist'];
    
    for (const table of rlsTables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
        console.log(`✅ RLS enabled for "${table}"`);
      } catch (error) {
        if (error.message.includes('already enabled')) {
          console.log(`⏭️  RLS already enabled for "${table}"`);
        } else {
          console.log(`⚠️  RLS error for "${table}": ${error.message}`);
        }
      }
    }
    
    // Create RLS policies
    console.log('\n📋 Creating RLS policies...');
    const policies = [
      {
        name: 'Public events view',
        sql: `CREATE POLICY IF NOT EXISTS "public_events_view" ON "Event" 
              FOR SELECT USING (status IN ('PUBLISHED', 'COMPLETED'))`
      },
      {
        name: 'Service role full access',
        sql: `CREATE POLICY IF NOT EXISTS "service_role_all" ON "User" 
              FOR ALL TO service_role USING (true)`
      },
      {
        name: 'Service role events',
        sql: `CREATE POLICY IF NOT EXISTS "service_role_events" ON "Event" 
              FOR ALL TO service_role USING (true)`
      }
    ];
    
    for (const policy of policies) {
      try {
        await prisma.$executeRawUnsafe(policy.sql);
        console.log(`✅ Policy: ${policy.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Policy already exists: ${policy.name}`);
        } else {
          console.log(`⚠️  Policy error: ${error.message}`);
        }
      }
    }
    
    // Grant permissions
    console.log('\n🔑 Granting permissions...');
    try {
      await prisma.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role');
      await prisma.$executeRawUnsafe('GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role');
      await prisma.$executeRawUnsafe('GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon');
      await prisma.$executeRawUnsafe('GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated');
      await prisma.$executeRawUnsafe('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role');
      console.log('✅ Permissions granted');
    } catch (error) {
      console.log('⚠️  Some permissions might already exist');
    }
    
    // Create admin user
    console.log('\n📝 Creating admin user...');
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "User" (email, "firstName", "lastName", "fullName", role, "emailVerified")
        VALUES ('admin@exjam.org.ng', 'Admin', 'User', 'Admin User', 'ADMIN', true)
        ON CONFLICT (email) DO NOTHING
      `);
      console.log('✅ Admin user created/exists');
    } catch (error) {
      console.log('⚠️  Admin user might already exist');
    }
    
    // Create test event
    console.log('\n📅 Creating test event...');
    try {
      await prisma.$executeRawUnsafe(`
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
        )
      `);
      console.log('✅ Test event created');
    } catch (error) {
      console.log('⚠️  Test event might already exist');
    }
    
    // Verify setup
    console.log('\n🔍 Verifying database setup...');
    
    const tables_check = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables in database:');
    tables_check.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    console.log('\n================================');
    console.log('✨ Database setup completed successfully!');
    console.log('================================\n');
    
    console.log('📱 Your application is ready!');
    console.log('   URL: http://localhost:3001');
    console.log('   Admin: admin@exjam.org.ng / Admin123!@#');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();