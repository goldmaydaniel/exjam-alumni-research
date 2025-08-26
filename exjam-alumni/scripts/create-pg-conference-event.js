#!/usr/bin/env node

/**
 * Create PG Conference Event Script
 * This script creates the President General's Conference event in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PG_CONFERENCE_EVENT = {
  id: "pg-conference-2025",
  title: "President General's Conference - Maiden Flight",
  description: `This groundbreaking event marks a new milestone in the history of the ExJAM Association. For the first time ever, we are bringing together our members, leaders, and stakeholders to share ideas, build relationships, and shape the future of our association.

**Event Highlights:**
• Opening Ceremony with Past President General Muhammed Sani Abdullahi
• Leadership Development Sessions
• Networking Opportunities
• Strategic Planning Workshops
• Gala Dinner & Awards Ceremony

**Theme:** "Strive to Excel" - Continuing the legacy of excellence from AFMS Jos

This is not just a conference; it's the beginning of a new chapter in ExJAM's journey toward greater unity, leadership, and impact.`,
  short_description: "A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association",
  start_date: "2025-11-28T09:00:00.000Z",
  end_date: "2025-11-30T18:00:00.000Z",
  venue: "NAF Conference Centre, FCT, ABUJA",
  address: "Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria",
  max_attendees: null, // Unlimited
  registration_deadline: "2025-11-25T23:59:59.000Z",
  price_ngn: 20000,
  early_bird_price_ngn: null, // No early bird pricing
  early_bird_deadline: null,
  is_virtual: false,
  meeting_url: null,
  streaming_url: null,
  recording_url: null,
  image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center",
  banner_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&h=400&fit=crop&crop=center",
  status: "published",
  is_featured: true,
  requires_approval: false,
  registration_fields: [
    "full_name",
    "email",
    "phone",
    "graduation_year",
    "squadron",
    "dietary_restrictions",
    "special_requirements"
  ],
  metadata: {
    organizer: "ExJAM Association",
    contact_email: "info@exjam.org.ng",
    contact_phone: "+234 901 234 5678",
    refund_policy: "Full refund available until November 20, 2025",
    includes: [
      "Conference materials and welcome package",
      "All sessions and workshops",
      "Networking lunch and coffee breaks",
      "Gala dinner on November 29th",
      "Certificate of participation",
      "Digital badge for social media"
    ],
    schedule: [
      {
        day: "Day 1 - November 28, 2025",
        events: [
          "09:00 - 10:00: Registration & Welcome Coffee",
          "10:00 - 11:00: Opening Ceremony",
          "11:00 - 12:30: Keynote: Past President General Muhammed Sani Abdullahi",
          "12:30 - 14:00: Networking Lunch",
          "14:00 - 16:00: Leadership Development Workshop",
          "16:00 - 18:00: Strategic Planning Session"
        ]
      },
      {
        day: "Day 2 - November 29, 2025",
        events: [
          "09:00 - 10:30: Alumni Success Stories Panel",
          "10:30 - 12:00: Professional Development Workshop",
          "12:00 - 13:30: Lunch & Networking",
          "13:30 - 16:00: Chapter Development & Collaboration",
          "16:00 - 18:00: Free Time / Optional Activities",
          "19:00 - 22:00: Gala Dinner & Awards Ceremony"
        ]
      },
      {
        day: "Day 3 - November 30, 2025",
        events: [
          "09:00 - 10:30: Future Vision & Action Planning",
          "10:30 - 12:00: Closing Ceremony & Commitments",
          "12:00 - 13:00: Farewell Lunch",
          "13:00 - 14:00: Group Photo & Departure"
        ]
      }
    ],
    tags: ["conference", "leadership", "networking", "alumni", "maiden-flight"]
  }
};

async function createPGConferenceEvent() {
  console.log('🎯 Creating PG Conference Event...\n');

  try {
    // Step 1: Check if event already exists
    console.log('1️⃣ Checking if event already exists...');
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', PG_CONFERENCE_EVENT.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing event:', checkError.message);
      return;
    }

    if (existingEvent) {
      console.log('⚠️  Event already exists. Updating...');
      
      // Update existing event
      const { data: updatedEvent, error: updateError } = await supabase
        .from('events')
        .update(PG_CONFERENCE_EVENT)
        .eq('id', PG_CONFERENCE_EVENT.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating event:', updateError.message);
        return;
      }

      console.log('✅ Event updated successfully!');
      console.log('📋 Event ID:', updatedEvent.id);
      console.log('📋 Event Title:', updatedEvent.title);
    } else {
      console.log('✅ Event does not exist. Creating new event...');
      
      // Create new event
      const { data: newEvent, error: createError } = await supabase
        .from('events')
        .insert(PG_CONFERENCE_EVENT)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating event:', createError.message);
        return;
      }

      console.log('✅ Event created successfully!');
      console.log('📋 Event ID:', newEvent.id);
      console.log('📋 Event Title:', newEvent.title);
    }

    // Step 2: Verify the event is accessible
    console.log('\n2️⃣ Verifying event accessibility...');
    const { data: verifyEvent, error: verifyError } = await supabase
      .from('events')
      .select('*')
      .eq('id', PG_CONFERENCE_EVENT.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying event:', verifyError.message);
      return;
    }

    console.log('✅ Event verification successful!');
    console.log('📋 Status:', verifyEvent.status);
    console.log('📋 Price: ₦' + verifyEvent.price_ngn?.toLocaleString());
    console.log('📋 Venue:', verifyEvent.venue);

    // Step 3: Test the registration URL
    console.log('\n3️⃣ Testing registration URL...');
    const registrationUrl = `https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/${PG_CONFERENCE_EVENT.id}/register`;
    console.log('🔗 Registration URL:', registrationUrl);
    console.log('📋 Please test this URL in your browser');

    console.log('\n🎉 PG Conference Event setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   • Event ID: pg-conference-2025');
    console.log('   • Title: President General\'s Conference - Maiden Flight');
    console.log('   • Date: November 28-30, 2025');
    console.log('   • Venue: NAF Conference Centre, Abuja');
    console.log('   • Price: ₦20,000');
    console.log('   • Status: Published');
    
    console.log('\n🔗 Important Links:');
    console.log('   • Event Page: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025');
    console.log('   • Registration: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025/register');
    console.log('   • Admin Dashboard: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/admin-dashboard');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your .env.local file has correct Supabase credentials');
    console.error('   2. Ensure you have service role key (not anon key)');
    console.error('   3. Verify your Supabase project is active');
    console.error('   4. Check Supabase dashboard for any errors');
    process.exit(1);
  }
}

// Run the setup
createPGConferenceEvent();
