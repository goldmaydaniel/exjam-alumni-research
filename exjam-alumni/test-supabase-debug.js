const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://yzrzjagkkycmdwuhrvww.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxNzYzOSwiZXhwIjoyMDcxNDkzNjM5fQ.3_t1THtTegbpNoDwCNeicwyghk8j6Aw0HUBVSlgopkQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function debugSupabaseConnection() {
  console.log('🔍 Debugging Supabase connection...\n');
  
  try {
    // Test 1: List all tables to see what exists
    console.log('1. Testing connection and listing tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('❌ Tables query failed, trying alternative approach...');
      console.log('Error:', tablesError);
    } else {
      console.log('✅ Tables found:', tables);
    }
    
    // Test 2: Try different table name cases
    const tableNames = ['Event', 'events', 'Events', 'event'];
    
    for (const tableName of tableNames) {
      console.log(`\n2. Testing table: "${tableName}"`);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Found table with ${data?.length || 0} records`);
          
          // If this table works, try to get its structure
          const { data: structure, error: structError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!structError && structure?.length > 0) {
            console.log('   Table structure sample:', Object.keys(structure[0]));
          } else if (!structError) {
            console.log('   Table exists but is empty');
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    // Test 3: Try to create a simple test event
    console.log('\n3. Attempting to create a test event...');
    const testEvent = {
      id: 'test-event-' + Date.now(),
      title: 'Test Event',
      description: 'This is a test event',
      shortDescription: 'Test',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      venue: 'Test Venue',
      capacity: 100,
      price: 0,
      status: 'DRAFT'
    };
    
    // Try with different table names
    for (const tableName of ['Event', 'events']) {
      try {
        console.log(`   Trying to insert into "${tableName}"...`);
        const { data, error } = await supabase
          .from(tableName)
          .insert(testEvent)
          .select()
          .single();
        
        if (error) {
          console.log(`   ❌ Insert failed: ${error.message}`);
          if (error.details) console.log(`   Details: ${error.details}`);
          if (error.hint) console.log(`   Hint: ${error.hint}`);
        } else {
          console.log(`   ✅ Test event created successfully in ${tableName}!`);
          console.log(`   Event ID: ${data.id}`);
          
          // Clean up test event
          await supabase.from(tableName).delete().eq('id', data.id);
          console.log(`   🧹 Test event cleaned up`);
          break;
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Fatal error in debug:', error);
  }
}

debugSupabaseConnection()
  .then(() => {
    console.log('\n✨ Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });
