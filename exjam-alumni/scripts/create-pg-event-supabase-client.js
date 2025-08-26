#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createPGEvent() {
  console.log('🔧 Creating PG Conference Event with Supabase Client...\n');

  try {
    // Step 1: Check if Event table exists and has data
    console.log('1️⃣ Checking Event table...');
    const { data: events, error: checkError } = await supabase
      .from('Event')
      .select('*');

    if (checkError) {
      console.log('❌ Event table check failed:', checkError.message);
      return;
    }

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

    // Step 2: Create PG Conference event
    console.log('\n2️⃣ Creating PG Conference event...');
    const { data: newEvent, error: createError } = await supabase
      .from('Event')
      .insert({
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
      .select()
      .single();

    if (createError) {
      console.log('❌ Event creation failed:', createError.message);
      return;
    }

    console.log('✅ PG Conference event created successfully!');
    console.log('📋 Title:', newEvent.title);
    console.log('📋 Status:', newEvent.status);
    console.log('📋 Price: ₦' + newEvent.price);
    console.log('📋 Venue:', newEvent.venue);

    // Step 3: Verify the event was created
    console.log('\n3️⃣ Verifying event creation...');
    const { data: verifyEvent, error: verifyError } = await supabase
      .from('Event')
      .select('*')
      .eq('id', 'pg-conference-2025')
      .single();

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Event verified successfully!');
      console.log('📋 Title:', verifyEvent.title);
      console.log('📋 Status:', verifyEvent.status);
      console.log('📋 Price: ₦' + verifyEvent.price);
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
