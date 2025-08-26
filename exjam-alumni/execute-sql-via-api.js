const https = require('https');

// Supabase credentials
const SUPABASE_URL = 'https://yzrzjagkkycmdwuhrvww.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxNzYzOSwiZXhwIjoyMDcxNDkzNjM5fQ.3_t1THtTegbpNoDwCNeicwyghk8j6Aw0HUBVSlgopkQ';

console.log('🚀 Executing SQL via Supabase REST API...\n');

// SQL commands to execute
const sqlCommands = [
  // Create User table
  `CREATE TABLE IF NOT EXISTS "User" (
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
  )`,
  
  // Create Event table
  `CREATE TABLE IF NOT EXISTS "Event" (
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
  )`,
  
  // Create Registration table
  `CREATE TABLE IF NOT EXISTS "Registration" (
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
  )`,
  
  // Create other tables
  `CREATE TABLE IF NOT EXISTS "Ticket" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "registrationId" TEXT,
    "ticketNumber" TEXT UNIQUE NOT NULL,
    "qrCode" TEXT,
    "checkedIn" BOOLEAN DEFAULT false,
    "checkinTime" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "ContactMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    "repliedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS "SiteConfig" (
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
  )`,
  
  `CREATE TABLE IF NOT EXISTS "Waitlist" (
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
];

// Function to make API request
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `Status ${res.statusCode}: ${data}` });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('📊 Creating database tables...\n');
  
  // Try to execute each SQL command
  for (let i = 0; i < sqlCommands.length; i++) {
    const tableName = sqlCommands[i].match(/CREATE TABLE[^"]*"([^"]+)"/)?.[1] || `Table ${i + 1}`;
    process.stdout.write(`Creating ${tableName}... `);
    
    const result = await executeSQL(sqlCommands[i]);
    
    if (result.success) {
      console.log('✅');
    } else {
      console.log(`❌ ${result.error}`);
    }
  }
  
  // If RPC doesn't work, provide alternative solution
  console.log('\n⚠️  If tables were not created via API, please use one of these methods:\n');
  console.log('Option 1: Supabase Dashboard');
  console.log('1. Go to: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/sql/new');
  console.log('2. Copy SQL from: complete-database-setup.sql');
  console.log('3. Click "Run"\n');
  
  console.log('Option 2: Supabase CLI');
  console.log('1. Install: npm install -g supabase');
  console.log('2. Login: supabase login');
  console.log('3. Link: supabase link --project-ref yzrzjagkkycmdwuhrvww');
  console.log('4. Execute: supabase db push < complete-database-setup.sql\n');
  
  console.log('📱 Application Details:');
  console.log('   URL: http://localhost:3001');
  console.log('   Admin: admin@exjam.org.ng / Admin123!@#');
}

main();