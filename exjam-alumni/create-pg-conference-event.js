const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createPGConferenceEvent() {
  console.log('🎯 Creating PG Conference 2025 Event...\n');
  
  const eventData = {
    id: 'pg-conference-2025',
    title: "President General's Conference - Maiden Flight",
    description: "A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association. This inaugural conference marks a pivotal moment in our collective journey.",
    shortDescription: "A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association",
    startDate: new Date('2025-11-28T09:00:00.000Z').toISOString(),
    endDate: new Date('2025-11-30T18:00:00.000Z').toISOString(),
    venue: 'NAF Conference Centre, FCT, ABUJA',
    address: 'Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria',
    capacity: 500,
    price: 20000,
    earlyBirdPrice: null,
    earlyBirdDeadline: null,
    imageUrl: '/images/pg-conference-banner.jpg',
    status: 'PUBLISHED',
    tags: ['conference', 'alumni', 'networking', 'leadership'],
    organizerId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    // Check if event already exists
    const { data: existingEvent, error: checkError } = await supabase
      .from('Event')
      .select('id, title')
      .eq('id', 'pg-conference-2025')
      .single();

    if (existingEvent) {
      console.log('✅ Event already exists:', existingEvent.title);
      console.log('   ID:', existingEvent.id);
      return existingEvent;
    }

    // Create the event
    const { data: newEvent, error: createError } = await supabase
      .from('Event')
      .insert(eventData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating event:', createError);
      return null;
    }

    console.log('✅ Event created successfully!');
    console.log('   Title:', newEvent.title);
    console.log('   ID:', newEvent.id);
    console.log('   Venue:', newEvent.venue);
    console.log('   Date:', new Date(newEvent.startDate).toLocaleDateString());
    console.log('   Price: ₦' + newEvent.price.toLocaleString());
    console.log('\n📌 Registration URL: http://localhost:3000/events/pg-conference-2025/register');
    
    return newEvent;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return null;
  }
}

createPGConferenceEvent();
