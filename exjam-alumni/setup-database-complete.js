const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Complete Database Setup via Supabase\n');
console.log('================================\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function setupDatabase() {
  console.log('📊 Setting up database and test data...\n');
  
  try {
    // Create admin user
    console.log('👤 Creating admin user...');
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
    
    if (!authError || authError.message.includes('already been registered')) {
      console.log('   ✅ Admin user ready');
    }
    
    // Test database tables
    console.log('\n🔍 Testing database access...');
    
    const tables = ['User', 'Event', 'Registration', 'ContactMessage', 'SiteConfig'];
    let accessible = 0;
    let notAccessible = 0;
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error) {
        console.log(`   ✅ ${table} table: Accessible`);
        accessible++;
      } else {
        console.log(`   ❌ ${table} table: ${error.message}`);
        notAccessible++;
      }
    }
    
    console.log('\n================================');
    console.log(`✅ Accessible tables: ${accessible}`);
    console.log(`❌ Not accessible: ${notAccessible}`);
    
    if (notAccessible > 0) {
      console.log('\n📋 To complete setup:');
      console.log('1. Go to: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/sql/new');
      console.log('2. Run the SQL from COMPLETE_DATABASE_SETUP.sql');
    } else {
      console.log('\n🎉 All tables accessible! Your database is ready.');
    }
    
    console.log('\n🚀 App running at: http://localhost:3002');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupDatabase();
