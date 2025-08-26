#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testStatus() {
  console.log('🔍 Testing Current Status...\n');

  try {
    // Test 1: Check if the live API endpoint works
    console.log('1️⃣ Testing live API endpoint...');
    const apiResponse = await fetch('https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/api/events');
    
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log('✅ API endpoint working');
      console.log('📋 Events found:', data.events?.length || 0);
      if (data.events && data.events.length > 0) {
        console.log('📋 Sample event:', data.events[0].title);
      }
    } else {
      console.log('❌ API endpoint failed:', apiResponse.status);
    }

    // Test 2: Check Supabase connection
    console.log('\n2️⃣ Testing Supabase connection...');
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/Event`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (supabaseResponse.ok) {
      const events = await supabaseResponse.json();
      console.log('✅ Supabase connection working');
      console.log('📋 Events in database:', events.length);
    } else {
      console.log('❌ Supabase connection failed:', supabaseResponse.status);
      const errorText = await supabaseResponse.text();
      console.log('📋 Error details:', errorText);
    }

    // Test 3: Check specific event page
    console.log('\n3️⃣ Testing specific event page...');
    const eventPageResponse = await fetch('https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025');
    
    if (eventPageResponse.ok) {
      console.log('✅ Event page loads successfully');
    } else {
      console.log('❌ Event page failed:', eventPageResponse.status);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }

  console.log('\n📋 Summary:');
  console.log('   • If API works but Supabase fails → Database tables missing');
  console.log('   • If both fail → Need to run SQL in Supabase dashboard');
  console.log('   • If both work → Everything is fine');
}

testStatus();
