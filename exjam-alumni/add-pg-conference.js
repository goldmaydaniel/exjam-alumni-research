const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

console.log('🎯 Adding PG Conference Event to Database...\n');

async function addPGConference() {
  try {
    // PG Conference event data
    const pgConferenceEvent = {
      title: 'PG Conference 2025',
      shortDescription: 'Annual gathering of Ex-Junior Airmen - Celebrating excellence and brotherhood',
      description: `Join us for the most anticipated event of the year! The PG Conference 2025 brings together Ex-Junior Airmen from all squadrons for a weekend of networking, celebration, and strategic planning for our association's future.

      Event Highlights:
      • Keynote addresses from distinguished alumni
      • Panel discussions on career development
      • Squadron reunions and networking sessions
      • Awards and recognition ceremony
      • Gala dinner and entertainment
      • Strategic planning for 2026 initiatives`,
      startDate: new Date('2025-04-15T09:00:00'),
      endDate: new Date('2025-04-17T18:00:00'),
      venue: 'Transcorp Hilton Hotel, Abuja',
      address: 'Plot 1, Aguiyi Ironsi St, Maitama, Abuja FCT',
      capacity: 1000,
      price: 20000,
      status: 'PUBLISHED',
      imageUrl: '/images/pg-conference-2025.jpg',
      tags: ['conference', 'networking', 'reunion', 'annual-event', 'pg-conference']
    };

    // Try to insert the event
    console.log('📅 Creating PG Conference 2025...');
    
    const { data, error } = await supabase
      .from('Event')
      .insert([pgConferenceEvent])
      .select()
      .single();

    if (error) {
      if (error.message.includes('permission denied')) {
        console.log('❌ Permission denied. Tables might not be created yet.');
        console.log('\n📋 Alternative: Add to SQL setup file');
        console.log('\nSQL to add PG Conference:');
        console.log('```sql');
        console.log(`INSERT INTO "Event" (
  title, "shortDescription", description, "startDate", "endDate", 
  venue, address, capacity, price, 
  status, "imageUrl", tags
) VALUES (
  'PG Conference 2025',
  'Annual gathering of Ex-Junior Airmen - Celebrating excellence and brotherhood',
  'Join us for the most anticipated event of the year! The PG Conference 2025 brings together Ex-Junior Airmen from all squadrons for a weekend of networking, celebration, and strategic planning for our association''s future.

Event Highlights:
• Keynote addresses from distinguished alumni
• Panel discussions on career development
• Squadron reunions and networking sessions
• Awards and recognition ceremony
• Gala dinner and entertainment
• Strategic planning for 2026 initiatives',
  '2025-04-15 09:00:00+00',
  '2025-04-17 18:00:00+00',
  'Transcorp Hilton Hotel, Abuja',
  'Plot 1, Aguiyi Ironsi St, Maitama, Abuja FCT',
  1000,
  20000,
  'PUBLISHED',
  '/images/pg-conference-2025.jpg',
  ARRAY['conference', 'networking', 'reunion', 'annual-event', 'pg-conference']
);`);
        console.log('```');
        
        // Also append to complete-database-setup.sql
        const fs = require('fs');
        const pgConferenceSQL = `
-- Insert PG Conference 2025 Event
INSERT INTO "Event" (
  title, "shortDescription", description, "startDate", "endDate", 
  venue, address, capacity, price, 
  status, "imageUrl", tags
) VALUES (
  'PG Conference 2025',
  'Annual gathering of Ex-Junior Airmen - Celebrating excellence and brotherhood',
  'Join us for the most anticipated event of the year! The PG Conference 2025 brings together Ex-Junior Airmen from all squadrons for a weekend of networking, celebration, and strategic planning for our association''s future.

Event Highlights:
• Keynote addresses from distinguished alumni
• Panel discussions on career development
• Squadron reunions and networking sessions
• Awards and recognition ceremony
• Gala dinner and entertainment
• Strategic planning for 2026 initiatives',
  '2025-04-15 09:00:00+00',
  '2025-04-17 18:00:00+00',
  'Transcorp Hilton Hotel, Abuja',
  'Plot 1, Aguiyi Ironsi St, Maitama, Abuja FCT',
  1000,
  20000,
  'PUBLISHED',
  '/images/pg-conference-2025.jpg',
  ARRAY['conference', 'networking', 'reunion', 'annual-event', 'pg-conference']
) ON CONFLICT DO NOTHING;
`;
        
        fs.appendFileSync('complete-database-setup.sql', pgConferenceSQL);
        console.log('\n✅ PG Conference SQL added to complete-database-setup.sql');
        
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    } else {
      console.log('✅ PG Conference 2025 successfully added!');
      console.log('\n📊 Event Details:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Title: ${data.title}`);
      console.log(`   Date: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`);
      console.log(`   Venue: ${data.venue}`);
      console.log(`   Capacity: ${data.capacity} attendees`);
      console.log(`   Price: ₦${data.price.toLocaleString()}`);
    }

    // Try to fetch all events to verify
    console.log('\n🔍 Checking all events in database...');
    const { data: allEvents, error: fetchError } = await supabase
      .from('Event')
      .select('id, title, startDate, status')
      .order('startDate', { ascending: true });

    if (!fetchError && allEvents) {
      console.log(`\n📅 Total events in database: ${allEvents.length}`);
      allEvents.forEach(event => {
        const date = new Date(event.startDate).toLocaleDateString();
        console.log(`   • ${event.title} (${date}) - ${event.status}`);
      });
    }

    // Add more sample events if needed
    const additionalEvents = [
      {
        title: 'Squadron 213 Reunion',
        shortDescription: 'Special reunion for Squadron 213 members',
        startDate: new Date('2025-02-20T10:00:00'),
        endDate: new Date('2025-02-20T18:00:00'),
        venue: 'NAF Officers Mess, Kaduna',
        address: 'NAF Base, Kaduna State',
        capacity: 200,
        price: 15000,
        status: 'PUBLISHED',
        tags: ['squadron-213', 'reunion']
      },
      {
        title: 'ExJAM Golf Tournament',
        shortDescription: 'Annual charity golf tournament',
        startDate: new Date('2025-05-10T07:00:00'),
        endDate: new Date('2025-05-10T16:00:00'),
        venue: 'IBB International Golf Club, Abuja',
        address: 'Maitama District, Abuja FCT',
        capacity: 100,
        price: 30000,
        status: 'PUBLISHED',
        tags: ['golf', 'charity', 'sports']
      },
      {
        title: 'Leadership Summit 2025',
        shortDescription: 'Leadership development and mentorship program',
        startDate: new Date('2025-06-05T09:00:00'),
        endDate: new Date('2025-06-06T17:00:00'),
        venue: 'Sheraton Lagos Hotel',
        address: '30 Mobolaji Bank Anthony Way, Ikeja, Lagos',
        capacity: 300,
        price: 25000,
        status: 'PUBLISHED',
        tags: ['leadership', 'mentorship', 'development']
      }
    ];

    console.log('\n📝 Adding additional sample events...');
    for (const event of additionalEvents) {
      const { data, error } = await supabase
        .from('Event')
        .insert([event])
        .select()
        .single();
      
      if (!error) {
        console.log(`   ✅ ${event.title}`);
      }
    }

    console.log('\n🎉 Event setup complete!');
    console.log('\n📱 View events at: http://localhost:3001/events');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addPGConference();