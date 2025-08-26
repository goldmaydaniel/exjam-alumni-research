#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

async function simpleCheck() {
  console.log('🔍 Simple Database Check...\n');

  try {
    // Try Event table (singular)
    console.log('1️⃣ Testing Event table...');
    const eventResponse = await fetch(`${SUPABASE_URL}/rest/v1/Event`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (eventResponse.ok) {
      const events = await eventResponse.json();
      console.log('✅ Event table exists!');
      console.log('📋 Found', events.length, 'events');
      
      // Look for PG Conference
      const pgEvent = events.find(e => e.id === 'pg-conference-2025');
      if (pgEvent) {
        console.log('✅ PG Conference found!');
        console.log('📋 Title:', pgEvent.title);
        console.log('📋 Status:', pgEvent.status);
        console.log('📋 Price: ₦' + pgEvent.price_ngn?.toLocaleString());
      } else {
        console.log('❌ PG Conference not found');
      }
    } else {
      console.log('❌ Event table not accessible:', eventResponse.status);
    }

    // Try events table (plural)
    console.log('\n2️⃣ Testing events table...');
    const eventsResponse = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (eventsResponse.ok) {
      const events = await eventsResponse.json();
      console.log('✅ events table exists!');
      console.log('📋 Found', events.length, 'events');
    } else {
      console.log('❌ events table not accessible:', eventsResponse.status);
    }

  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
  }
}

simpleCheck();
