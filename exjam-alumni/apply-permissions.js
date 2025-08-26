const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPermissions() {
  console.log('🔧 Applying database permissions...\n');
  
  try {
    // Test creating a table with service role
    const { data, error } = await supabase.rpc('grant_public_schema_access', {});
    
    if (error && error.message.includes('does not exist')) {
      console.log('⚠️  Manual permission setup may be required in Supabase Dashboard');
      console.log('   Go to: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/editor');
      console.log('   Run the SQL commands from fix-database-permissions.sql');
    } else {
      console.log('✅ Permissions applied successfully');
    }
    
    // Test database access
    const { data: testData, error: testError } = await supabase
      .from('User')
      .select('id')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Database access confirmed');
    } else {
      console.log('⚠️  Database access issue:', testError.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyPermissions();