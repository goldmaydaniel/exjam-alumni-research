const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);

// Test with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test auth connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth connection successful');
    }

    // Test database connection - check if User table exists
    const { data: users, error: userError } = await supabaseAdmin
      .from('User')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.log('❌ Database error:', userError.message);
    } else {
      console.log('✅ Database connection successful');
    }

    // Test storage connection
    const { data: buckets, error: storageError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    if (storageError) {
      console.log('❌ Storage error:', storageError.message);
    } else {
      console.log('✅ Storage connection successful');
      console.log('Available buckets:', buckets?.map(b => b.name).join(', ') || 'None');
    }

    // Check if required buckets exist
    const requiredBuckets = ['avatars', 'event-images', 'badges'];
    for (const bucketName of requiredBuckets) {
      const bucket = buckets?.find(b => b.name === bucketName);
      if (!bucket) {
        console.log(`⚠️ Missing bucket: ${bucketName} - creating...`);
        const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'],
          fileSizeLimit: 5242880 // 5MB
        });
        if (error) {
          console.log(`❌ Failed to create bucket ${bucketName}:`, error.message);
        } else {
          console.log(`✅ Created bucket: ${bucketName}`);
        }
      }
    }

    console.log('\n🎉 Supabase integration test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection();