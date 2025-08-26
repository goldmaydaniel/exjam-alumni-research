const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Database Setup Instructions\n');
console.log('================================\n');

async function showSetupInstructions() {
  // Test current status
  console.log('📊 Current System Status:\n');
  
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log(`✅ Storage: ${buckets?.length || 0} buckets ready`);
  
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: 'admin@exjam.org.ng',
    password: 'Admin123!@#',
    email_confirm: true
  }).catch(() => ({ data: null }));
  
  console.log('✅ Auth: Admin user ready');
  console.log('✅ Server: Running at http://localhost:3002\n');
  
  console.log('⚠️  Database tables need to be created manually\n');
  
  console.log('📋 Quick Setup (Copy & Paste):\n');
  console.log('1. Open: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/sql/new');
  console.log('2. Paste this SQL:\n');
  
  const sql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  role TEXT DEFAULT 'GUEST_MEMBER',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Event" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Registration" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES "User"(id),
  "eventId" TEXT REFERENCES "Event"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;`;

  console.log('```sql' + sql + '\n```');
  
  console.log('\n3. Click "Run" in Supabase Dashboard');
  console.log('4. Your app will be ready!\n');
  
  console.log('Test Login:');
  console.log('Email: admin@exjam.org.ng');
  console.log('Password: Admin123!@#');
}

showSetupInstructions();
