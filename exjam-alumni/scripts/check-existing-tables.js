#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

async function checkTables() {
  console.log('🔍 Checking existing tables...\n');

  try {
    // Check what tables exist
    console.log('1️⃣ Checking all tables...');
    const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (tablesResponse.ok) {
      const tables = await tablesResponse.json();
      console.log('✅ Available tables:');
      tables.forEach(table => {
        console.log('   •', table.name);
      });
    } else {
      console.log('❌ Could not fetch tables:', tablesResponse.status);
    }

    // Try to access Event table (singular)
    console.log('\n2️⃣ Testing Event table (singular)...');
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
      if (events.length > 0) {
        console.log('📋 Sample event:', events[0].title || events[0].id);
      }
    } else {
      console.log('❌ Event table not accessible:', eventResponse.status);
    }

    // Try to access events table (plural)
    console.log('\n3️⃣ Testing events table (plural)...');
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
      if (events.length > 0) {
        console.log('📋 Sample event:', events[0].title || events[0].id);
      }
    } else {
      console.log('❌ events table not accessible:', eventsResponse.status);
    }

    // Check for PG Conference specifically
    console.log('\n4️⃣ Looking for PG Conference...');
    const pgResponse = await fetch(`${SUPABASE_URL}/rest/v1/Event?id=eq.pg-conference-2025`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (pgResponse.ok) {
      const pgEvents = await pgResponse.json();
      if (pgEvents.length > 0) {
        console.log('✅ PG Conference found in Event table!');
        console.log('📋 Title:', pgEvents[0].title);
        console.log('📋 Status:', pgEvents[0].status);
      } else {
        console.log('❌ PG Conference not found in Event table');
      }
    } else {
      console.log('❌ Could not check Event table for PG Conference');
    }

  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
  }
}

checkTables();
