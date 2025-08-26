#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function quickTest() {
  console.log('🔍 Quick Database Test...\n');

  try {
    // Test 1: Check if events table exists
    console.log('1️⃣ Testing events table...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('count')
      .limit(1);

    if (eventsError) {
      console.log('❌ Events table error:', eventsError.message);
      console.log('💡 You need to run the SQL setup first');
    } else {
      console.log('✅ Events table exists');
    }

    // Test 2: Check if PG Conference exists
    console.log('\n2️⃣ Testing PG Conference event...');
    const { data: pgEvent, error: pgError } = await supabase
      .from('events')
      .select('*')
      .eq('id', 'pg-conference-2025')
      .single();

    if (pgError) {
      console.log('❌ PG Conference not found:', pgError.message);
    } else {
      console.log('✅ PG Conference found!');
      console.log('   Title:', pgEvent.title);
      console.log('   Status:', pgEvent.status);
      console.log('   Price: ₦' + pgEvent.price_ngn?.toLocaleString());
    }

    // Test 3: Check API endpoint
    console.log('\n3️⃣ Testing API endpoint...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.pg-conference-2025`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API endpoint working');
      console.log('   Found', data.length, 'events');
    } else {
      console.log('❌ API endpoint error:', response.status);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

quickTest();
