const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeUserAdmin() {
  try {
    const email = 'goldmay@gmail.com';
    
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // First, check if user exists in Users table
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.log('❌ Error checking user:', userError);
      return;
    }

    if (userData) {
      console.log('✅ User found in Users table!');
      console.log('📧 Current email:', userData.email);
      console.log('👤 Current role:', userData.role);
      
      // Update to ADMIN role
      const { data: updatedUser, error: updateError } = await supabase
        .from('User')
        .update({ 
          role: 'ADMIN',
          emailVerified: true
        })
        .eq('email', email)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Error updating user role:', updateError);
        return;
      }

      console.log('🎉 Successfully updated user to ADMIN role!');
      console.log('📊 Updated role:', updatedUser.role);
      console.log('✉️  Email verified:', updatedUser.emailVerified);
      
    } else {
      console.log('❌ User not found with email:', email);
      console.log('💡 The user needs to register first before being made an admin');
      
      // List all users to see what's available
      const { data: allUsers, error: listError } = await supabase
        .from('User')
        .select('id, email, fullName, role')
        .limit(10);
      
      if (listError) {
        console.log('❌ Error listing users:', listError);
        return;
      }
      
      console.log('\n📋 Current users in database:');
      allUsers.forEach(user => {
        console.log(`- ${user.email} (${user.fullName || 'No name'}) - Role: ${user.role}`);
      });
    }
    
    // Also check auth.users table for Supabase authentication
    console.log('\n🔐 Checking Supabase auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error checking auth users:', authError);
      return;
    }
    
    const targetAuthUser = authUsers.users.find(user => user.email === email);
    if (targetAuthUser) {
      console.log('✅ User found in auth system!');
      console.log('👤 Auth User ID:', targetAuthUser.id);
      console.log('📧 Email confirmed:', targetAuthUser.email_confirmed_at ? 'Yes' : 'No');
      
      // Update user metadata to mark as admin
      const { data: updatedAuthUser, error: authUpdateError } = await supabase.auth.admin.updateUserById(
        targetAuthUser.id,
        {
          user_metadata: {
            ...targetAuthUser.user_metadata,
            role: 'ADMIN',
            is_admin: true
          },
          email_confirm: true
        }
      );
      
      if (authUpdateError) {
        console.log('❌ Error updating auth user:', authUpdateError);
      } else {
        console.log('🎉 Successfully updated auth user metadata!');
      }
    } else {
      console.log('❌ User not found in auth system');
    }
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
  }
}

// Run the script
makeUserAdmin();