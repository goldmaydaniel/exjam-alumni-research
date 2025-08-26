const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Setting up Database with Supabase Client...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function setupDatabase() {
  try {
    // Test connection
    console.log('📡 Testing Supabase connection...');
    const { data: test, error: testError } = await supabase
      .from('Event')
      .select('count')
      .limit(1);
    
    if (testError && !testError.message.includes('permission denied')) {
      console.log('❌ Connection test failed:', testError.message);
    } else {
      console.log('✅ Connected to Supabase!\n');
    }
    
    // PG Conference event data
    const pgConference = {
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
      startDate: '2025-04-15T09:00:00',
      endDate: '2025-04-17T18:00:00',
      venue: 'Transcorp Hilton Hotel, Abuja',
      address: 'Plot 1, Aguiyi Ironsi St, Maitama, Abuja FCT',
      capacity: 1000,
      price: 20000,
      status: 'PUBLISHED',
      imageUrl: '/images/pg-conference-2025.jpg',
      tags: ['conference', 'networking', 'reunion', 'annual-event', 'pg-conference']
    };
    
    // Additional events
    const additionalEvents = [
      {
        title: 'Squadron 213 Reunion',
        shortDescription: 'Special reunion for Squadron 213 members',
        startDate: '2025-02-20T10:00:00',
        endDate: '2025-02-20T18:00:00',
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
        startDate: '2025-05-10T07:00:00',
        endDate: '2025-05-10T16:00:00',
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
        startDate: '2025-06-05T09:00:00',
        endDate: '2025-06-06T17:00:00',
        venue: 'Sheraton Lagos Hotel',
        address: '30 Mobolaji Bank Anthony Way, Ikeja, Lagos',
        capacity: 300,
        price: 25000,
        status: 'PUBLISHED',
        tags: ['leadership', 'mentorship', 'development']
      },
      {
        title: '2025 EXJAM Annual Convention',
        shortDescription: 'Join us for the annual gathering of Ex-Junior Airmen',
        startDate: '2025-12-01T09:00:00',
        endDate: '2025-12-03T18:00:00',
        venue: 'Sheraton Hotel',
        address: 'Abuja, FCT',
        capacity: 500,
        price: 50000,
        status: 'PUBLISHED',
        tags: ['annual', 'convention']
      }
    ];
    
    // Try to insert PG Conference
    console.log('📅 Adding PG Conference 2025...');
    const { data: pgData, error: pgError } = await supabase
      .from('Event')
      .insert([pgConference])
      .select()
      .single();
    
    if (pgError) {
      if (pgError.message.includes('permission denied')) {
        console.log('❌ Permission denied - tables need to be created first');
        console.log('\n📝 Generating fallback SQL commands...\n');
        
        // Generate INSERT statements
        const allEvents = [pgConference, ...additionalEvents];
        console.log('-- SQL to insert all events:');
        console.log('-- Copy and run this in Supabase Dashboard\n');
        
        allEvents.forEach(event => {
          console.log(`INSERT INTO "Event" (
  title, "shortDescription", description, "startDate", "endDate",
  venue, address, capacity, price, status, "imageUrl", tags
) VALUES (
  '${event.title}',
  '${event.shortDescription}',
  '${event.description || ''}',
  '${event.startDate}',
  '${event.endDate}',
  '${event.venue}',
  '${event.address}',
  ${event.capacity},
  ${event.price},
  '${event.status}',
  '${event.imageUrl || ''}',
  ARRAY[${event.tags.map(t => `'${t}'`).join(', ')}]
) ON CONFLICT DO NOTHING;
`);
        });
      } else if (pgError.message.includes('duplicate')) {
        console.log('✅ PG Conference already exists');
      } else {
        console.log(`⚠️  Error: ${pgError.message}`);
      }
    } else {
      console.log('✅ PG Conference 2025 added successfully!');
      console.log(`   ID: ${pgData.id}`);
    }
    
    // Try to add additional events
    console.log('\n📝 Adding additional events...');
    for (const event of additionalEvents) {
      const { data, error } = await supabase
        .from('Event')
        .insert([event])
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('duplicate')) {
          console.log(`⏭️  ${event.title} - already exists`);
        } else if (!error.message.includes('permission denied')) {
          console.log(`❌ ${event.title} - ${error.message}`);
        }
      } else {
        console.log(`✅ ${event.title}`);
      }
    }
    
    // Check all events
    console.log('\n🔍 Fetching all events...');
    const { data: allEvents, error: fetchError } = await supabase
      .from('Event')
      .select('title, startDate, venue, price, status')
      .order('startDate', { ascending: true });
    
    if (allEvents && allEvents.length > 0) {
      console.log(`\n📅 Events in database (${allEvents.length} total):`);
      allEvents.forEach(event => {
        const date = new Date(event.startDate).toLocaleDateString();
        const price = event.price ? `₦${parseInt(event.price).toLocaleString()}` : 'Free';
        console.log(`   • ${event.title} - ${date} - ${price} [${event.status}]`);
      });
    } else if (fetchError) {
      console.log(`\n⚠️  Cannot fetch events: ${fetchError.message}`);
    }
    
    console.log('\n================================');
    console.log('📋 Next Steps:');
    console.log('================================\n');
    
    if (!allEvents || allEvents.length === 0) {
      console.log('1. Go to Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/sql/new\n');
      console.log('2. Copy and run the SQL from:');
      console.log('   complete-database-setup.sql\n');
      console.log('3. Then refresh your app at:');
      console.log('   http://localhost:3001/events');
    } else {
      console.log('✅ Events are ready!');
      console.log('\n📱 View your events at:');
      console.log('   http://localhost:3001/events');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

setupDatabase();