#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

async function createPGEvent() {
  console.log('🔧 Creating PG Conference Event...\n');

  try {
    // Step 1: Check if Event table exists and has data
    console.log('1️⃣ Checking Event table...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/Event`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (checkResponse.ok) {
      const events = await checkResponse.json();
      console.log('✅ Event table accessible');
      console.log('📋 Found', events.length, 'existing events');
      
      // Check if PG Conference already exists
      const pgEvent = events.find(e => e.id === 'pg-conference-2025');
      if (pgEvent) {
        console.log('✅ PG Conference already exists!');
        console.log('📋 Title:', pgEvent.title);
        console.log('📋 Status:', pgEvent.status);
        console.log('📋 Price: ₦' + pgEvent.price);
        return;
      }
    } else {
      console.log('❌ Event table not accessible:', checkResponse.status);
      return;
    }

    // Step 2: Create PG Conference event
    console.log('\n2️⃣ Creating PG Conference event...');
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/Event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: 'pg-conference-2025',
        title: "President General's Conference - Maiden Flight",
        description: 'This groundbreaking event marks a new milestone in the history of the ExJAM Association. For the first time ever, we are bringing together our members, leaders, and stakeholders to share ideas, build relationships, and shape the future of our association.',
        shortDescription: 'A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association',
        startDate: '2025-11-28T09:00:00.000Z',
        endDate: '2025-11-30T18:00:00.000Z',
        venue: 'NAF Conference Centre, FCT, ABUJA',
        address: 'Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria',
        capacity: 1000,
        price: '20000.00',
        earlyBirdPrice: null,
        earlyBirdDeadline: null,
        imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center',
        status: 'PUBLISHED',
        organizerId: null,
        tags: ['conference', 'alumni', 'networking', 'leadership']
      })
    });

    if (createResponse.ok) {
      console.log('✅ PG Conference event created successfully!');
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Event creation failed:', createResponse.status, errorText);
    }

    // Step 3: Verify the event was created
    console.log('\n3️⃣ Verifying event creation...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/Event?id=eq.pg-conference-2025`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (verifyResponse.ok) {
      const events = await verifyResponse.json();
      if (events.length > 0) {
        console.log('✅ Event verified successfully!');
        console.log('📋 Title:', events[0].title);
        console.log('📋 Status:', events[0].status);
        console.log('📋 Price: ₦' + events[0].price);
        console.log('📋 Venue:', events[0].venue);
      } else {
        console.log('❌ Event not found after creation');
      }
    } else {
      console.log('❌ Verification failed:', verifyResponse.status);
    }

    console.log('\n🎉 Setup completed!');
    console.log('\n🔗 Test these URLs:');
    console.log('   • Event Page: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025');
    console.log('   • Registration: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025/register');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  }
}

createPGEvent();
