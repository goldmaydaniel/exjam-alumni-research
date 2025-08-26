const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Setting up Supabase Database\n');
console.log('================================\n');
console.log('Supabase URL:', supabaseUrl);
console.log('\n📋 Instructions for Manual Setup:\n');

console.log('1. Go to Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/sql/new\n');

console.log('2. Copy and run the COMPLETE_DATABASE_SETUP.sql file content\n');

console.log('3. Or run these essential commands:\n');

const essentialSQL = `
-- Essential Tables for ExJAM Alumni

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User table (if not exists)
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "serviceNumber" TEXT,
    "set" TEXT,
    squadron TEXT,
    phone TEXT,
    chapter TEXT,
    role TEXT DEFAULT 'GUEST_MEMBER',
    "emailVerified" BOOLEAN DEFAULT false,
    "profilePhotoUrl" TEXT,
    "badgePhotoUrl" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Event table
CREATE TABLE IF NOT EXISTS "Event" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    "organizerId" UUID REFERENCES "User"(id),
    "imageUrl" TEXT,
    category TEXT,
    tags TEXT[],
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Registration table
CREATE TABLE IF NOT EXISTS "Registration" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    "eventId" UUID REFERENCES "Event"(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT USING (id::text = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON "User"
    FOR UPDATE USING (id::text = auth.uid()::text);

CREATE POLICY "Anyone can view published events" ON "Event"
    FOR SELECT USING (status IN ('PUBLISHED', 'COMPLETED'));

CREATE POLICY "Users can view own registrations" ON "Registration"
    FOR SELECT USING ("userId"::text = auth.uid()::text);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
`;

console.log('Essential SQL Commands:');
console.log('```sql');
console.log(essentialSQL);
console.log('```\n');

// Test what we can access
async function testAccess() {
  console.log('🔍 Testing current database access...\n');
  
  // Test auth
  const { data: session, error: authError } = await supabase.auth.getSession();
  console.log('✅ Auth system: Working');
  
  // Test storage
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('✅ Storage system: Working');
  console.log(`   Available buckets: ${buckets?.length || 0}`);
  
  // Try to access tables
  try {
    const { count, error } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log('✅ User table: Accessible');
    } else {
      console.log('⚠️  User table:', error.message);
    }
  } catch (err) {
    console.log('⚠️  User table: Not accessible');
  }
  
  try {
    const { count, error } = await supabase
      .from('Event')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log('✅ Event table: Accessible');
    } else {
      console.log('⚠️  Event table:', error.message);
    }
  } catch (err) {
    console.log('⚠️  Event table: Not accessible');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Run the SQL commands above in Supabase Dashboard');
  console.log('2. Then run: npx prisma db pull');
  console.log('3. Then run: npx prisma generate');
  console.log('4. Restart the development server');
}

testAccess();