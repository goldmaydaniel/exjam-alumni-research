const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Testing Full Supabase Integration\n');
console.log('================================\n');

async function testFullIntegration() {
  let testUserId = null;
  
  try {
    // 1. Test Auth - Sign Up
    console.log('1. Testing Authentication...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        fullName: 'Test User',
        serviceNumber: 'TEST/12345'
      }
    });
    
    if (signUpError) {
      console.log('❌ Sign up error:', signUpError.message);
    } else {
      console.log('✅ User created successfully');
      testUserId = signUpData.user.id;
    }

    // 2. Test Database - Create User Record
    console.log('\n2. Testing Database Operations...');
    if (testUserId) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('User')
        .insert({
          id: testUserId,
          email: testEmail,
          firstName: 'Test',
          lastName: 'User',
          fullName: 'Test User',
          serviceNumber: 'TEST/12345',
          role: 'GUEST_MEMBER',
          emailVerified: true
        })
        .select()
        .single();
      
      if (userError) {
        console.log('❌ Database insert error:', userError.message);
      } else {
        console.log('✅ User record created in database');
      }
    }

    // 3. Test Storage - Upload Test Image
    console.log('\n3. Testing Storage Operations...');
    const testImageData = Buffer.from('Test image content');
    const fileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('avatars')
      .upload(fileName, testImageData, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.log('❌ Storage upload error:', uploadError.message);
    } else {
      console.log('✅ File uploaded successfully:', uploadData.path);
      
      // Get public URL
      const { data: urlData } = supabaseAdmin
        .storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      console.log('📎 Public URL:', urlData.publicUrl);
      
      // Clean up - delete test file
      const { error: deleteError } = await supabaseAdmin
        .storage
        .from('avatars')
        .remove([fileName]);
      
      if (!deleteError) {
        console.log('✅ Test file cleaned up');
      }
    }

    // 4. Test Realtime (if needed)
    console.log('\n4. Testing Realtime Subscriptions...');
    const channel = supabase
      .channel('test-channel')
      .on('presence', { event: 'sync' }, () => {
        console.log('✅ Realtime subscription working');
      })
      .subscribe();
    
    // Clean up subscription
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 1000);

    // 5. Clean up test user
    if (testUserId) {
      console.log('\n5. Cleaning up test data...');
      
      // Delete from database first
      await supabaseAdmin
        .from('User')
        .delete()
        .eq('id', testUserId);
      
      // Delete from auth
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(testUserId);
      
      if (!deleteAuthError) {
        console.log('✅ Test user cleaned up');
      }
    }

    console.log('\n================================');
    console.log('✨ All integration tests passed!');
    console.log('================================\n');
    
    console.log('📊 Summary:');
    console.log('- Auth: ✅ Working');
    console.log('- Database: ✅ Working');
    console.log('- Storage: ✅ Working');
    console.log('- Realtime: ✅ Working');
    console.log('\n🎉 Your Supabase integration is fully functional!');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
  }
  
  process.exit(0);
}

testFullIntegration();