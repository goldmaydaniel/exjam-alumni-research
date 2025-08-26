const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client with direct credentials based on your successful connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yzrzjagkkycmdwuhrvww.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxNzYzOSwiZXhwIjoyMDcxNDkzNjM5fQ.3_t1THtTegbpNoDwCNeicwyghk8j6Aw0HUBVSlgopkQ';

console.log('🔧 Using Supabase URL:', supabaseUrl);
console.log('🔧 Service key (first 20 chars):', supabaseServiceKey.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Complete event definitions with all ExJAM events
const events = [
  {
    id: 'pg-conference-2025-main',
    title: "President General's Conference 2025 - Maiden Flight",
    shortDescription: 'The inaugural PG Conference bringing together ExJAM alumni worldwide',
    description: `Join us for the historic maiden President General's Conference of The ExJAM Association!

📅 Date: November 28-30, 2025
📍 Venue: NAF Conference Centre, Abuja
🎯 Theme: "Strive to Excel - Building Tomorrow's Leaders Today"

EVENT HIGHLIGHTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 KEYNOTE SESSIONS
• Distinguished alumni speakers from military, business & public service
• Leadership masterclasses by senior officers
• Panel discussions on national development

🤝 NETWORKING OPPORTUNITIES
• Squadron reunion sessions
• Class set meetups  
• Professional networking lounges
• Business collaboration forum

🏆 SPECIAL PROGRAMS
• Awards & Recognition Ceremony
• AFMS Hall of Fame Induction
• Entrepreneurship Summit
• Youth Mentorship Program
• Charity Outreach Initiative

🎊 SOCIAL EVENTS
• Welcome Cocktail Reception
• Cultural Night
• Gala Dinner & Awards
• Squadron Competition Games

REGISTRATION PACKAGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Regular: ₦75,000 (After Sept 30)
✅ Early Bird: ₦50,000 (Before Sept 30)
✅ VIP Package: ₦150,000 (Limited slots)

Package includes conference materials, meals, and access to all sessions.`,
    startDate: '2025-11-28T08:00:00.000Z',
    endDate: '2025-11-30T22:00:00.000Z',
    venue: 'NAF Conference Centre, Abuja',
    address: 'Nigerian Air Force Headquarters, Airport Road, Abuja, FCT',
    capacity: 800,
    price: 75000.00,
    earlyBirdPrice: 50000.00,
    earlyBirdDeadline: '2025-09-30T23:59:59.000Z',
    imageUrl: '/images/events/pg-conference-2025.jpg',
    status: 'PUBLISHED',
    tags: ['PG Conference', 'Networking', 'Leadership', 'Awards', 'Abuja', 'ExJAM']
  },
  {
    id: 'afms-founders-day-2025',
    title: 'AFMS Founders Day Celebration 2025',
    shortDescription: 'Celebrating 45 years of excellence in military education',
    description: `Join us in celebrating 45 years of Air Force Military School Jos!

🎉 CELEBRATING 45 YEARS OF EXCELLENCE 🎉

Event Program:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎺 Morning Parade & March Past
📚 Historical Exhibition
⚽ Old Boys Football Match
🏆 Squadron Competitions
🎤 Anniversary Lecture
🥇 Award Presentations
🍽️ Evening Social & Networking

Special Features:
• Time capsule opening ceremony
• Alumni success stories showcase
• Photo exhibition of AFMS through the years
• Musical performances by current students`,
    startDate: '2025-10-15T08:00:00.000Z',
    endDate: '2025-10-15T20:00:00.000Z',
    venue: 'AFMS Jos Campus',
    address: 'Air Force Military School, Jos, Plateau State',
    capacity: 2000,
    price: 10000.00,
    earlyBirdPrice: 7500.00,
    earlyBirdDeadline: '2025-09-15T23:59:59.000Z',
    status: 'PUBLISHED',
    tags: ['Founders Day', 'AFMS', 'Jos', 'Anniversary', 'Celebration', '45 Years']
  },
  {
    id: 'squadron-championships-2025',
    title: 'Inter-Squadron Championships 2025',
    shortDescription: 'Annual sports and games competition between all squadrons',
    description: `The ultimate squadron showdown! Compete for squadron glory in various sporting and intellectual events.

🏆 SQUADRON GLORY AWAITS! 🏆

SPORTING EVENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚽ Football Tournament
🏀 Basketball Competition
🏓 Table Tennis Championship
🏃‍♂️ Athletics (100m, 200m, 400m, Relay)
💪 Tug of War
🏊‍♂️ Swimming Competition

INTELLECTUAL COMPETITIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
♟️ Chess Tournament
🔤 Scrabble Championship
🧠 Quiz Competition
🎤 Debate Tournament

SQUADRONS PARTICIPATING:
• Green Squadron
• Red Squadron  
• Purple Squadron
• Yellow Squadron
• Dornier Squadron
• Puma Squadron

Winners receive the coveted Squadron Trophy and bragging rights for the year!`,
    startDate: '2025-08-15T07:00:00.000Z',
    endDate: '2025-08-17T19:00:00.000Z',
    venue: 'National Stadium Complex, Abuja',
    address: 'National Stadium, Airport Road, Abuja',
    capacity: 600,
    price: 5000.00,
    earlyBirdPrice: 3500.00,
    earlyBirdDeadline: '2025-07-31T23:59:59.000Z',
    status: 'PUBLISHED',
    tags: ['Sports', 'Competition', 'Squadron', 'Championships', 'Athletics', 'Games']
  },
  {
    id: 'career-summit-2025',
    title: 'Young Alumni Career & Entrepreneurship Summit',
    shortDescription: 'Empowering the next generation of ExJAM leaders',
    description: `A specialized summit for recent graduates and young professionals!

🚀 EMPOWERING THE NEXT GENERATION 🚀

TARGET AUDIENCE:
• Alumni graduated within the last 10 years
• Young professionals seeking career growth
• Aspiring entrepreneurs
• Current students (final year)

SUMMIT HIGHLIGHTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 Career Development Workshops
• CV writing and interview skills
• Personal branding strategies
• Leadership development
• Communication skills

🚀 Entrepreneurship Track
• Business idea development
• Access to funding
• Startup pitch competition
• Mentor matching

🤝 Networking & Opportunities
• Job fair with 20+ companies
• One-on-one mentorship sessions
• Alumni success story panels
• Industry networking lounges

💰 PRIZES & OPPORTUNITIES:
• ₦500,000 startup funding for best pitch
• Job placement opportunities
• Mentorship program enrollment
• Professional development scholarships`,
    startDate: '2025-06-14T09:00:00.000Z',
    endDate: '2025-06-14T18:00:00.000Z',
    venue: 'Eko Hotels & Suites',
    address: 'Plot 1415 Adetokunbo Ademola Street, Victoria Island, Lagos',
    capacity: 300,
    price: 12000.00,
    earlyBirdPrice: 8000.00,
    earlyBirdDeadline: '2025-05-31T23:59:59.000Z',
    status: 'PUBLISHED',
    tags: ['Career', 'Entrepreneurship', 'Young Alumni', 'Summit', 'Lagos', 'Professional Development']
  },
  {
    id: 'golf-tournament-2025',
    title: 'ExJAM Charity Golf Tournament 2025',
    shortDescription: 'Golf tournament to raise funds for AFMS scholarship program',
    description: `Tee off for a good cause! All proceeds go to the AFMS Scholarship Fund.

⛳ GOLF FOR GOOD CAUSE ⛳

TOURNAMENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏌️‍♂️ 18-hole championship course
👥 Individual and team categories
🏆 Multiple prize categories
🍽️ Cocktail reception and awards ceremony

CATEGORIES & PRIZES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥇 Overall Champion (Men & Ladies)
🏌️‍♂️ Best Team Score
🎯 Longest Drive Competition
⛳ Nearest to Pin Challenge
🏆 Best Dressed Golfer

CHARITY IMPACT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Scholarship for deserving AFMS students
📖 Educational materials and equipment
🏫 Infrastructure development projects
🎓 Merit awards for outstanding students

Registration includes:
• Green fees for 18 holes
• Golf cart
• Welcome breakfast
• Lunch
• Awards dinner
• Golf accessories gift pack`,
    startDate: '2025-09-06T06:30:00.000Z',
    endDate: '2025-09-06T18:00:00.000Z',
    venue: 'IBB International Golf & Country Club',
    address: 'IBB Golf Course, Abuja',
    capacity: 120,
    price: 50000.00,
    earlyBirdPrice: 40000.00,
    earlyBirdDeadline: '2025-08-15T23:59:59.000Z',
    status: 'PUBLISHED',
    tags: ['Golf', 'Charity', 'Scholarship', 'Tournament', 'Abuja', 'Fundraising']
  },
  {
    id: 'ladies-brunch-2025',
    title: 'Ladies of ExJAM Annual Brunch',
    shortDescription: 'Celebrating the women of AFMS alumni community',
    description: `An elegant afternoon celebrating the remarkable women of ExJAM!

👑 CELEBRATING WOMEN OF EXCELLENCE 👑

PROGRAM HIGHLIGHTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥂 Welcome cocktails and networking
🎤 Inspirational keynote addresses
👩‍💼 Panel: "Women in Leadership"
👗 Fashion showcase by alumni designers
💼 Business networking session
🍽️ Elegant brunch service

FEATURED SPEAKERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Senior female military officers
• Business executives and entrepreneurs  
• Political leaders and public servants
• International professionals

SPECIAL FEATURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💄 Beauty and wellness consultations
📷 Professional photo sessions
🎁 Gift bags with luxury items
🏆 Recognition of outstanding female alumni
💼 Business card exchange sessions

DRESS CODE: Smart Casual/Business Chic

This exclusive event is designed to celebrate the achievements of our female alumni while fostering mentorship and business connections among women in the ExJAM community.`,
    startDate: '2025-05-10T11:00:00.000Z',
    endDate: '2025-05-10T16:00:00.000Z',
    venue: 'The Wheatbaker Hotel',
    address: '4 Onitolo Road, Ikoyi, Lagos',
    capacity: 200,
    price: 15000.00,
    earlyBirdPrice: 12000.00,
    earlyBirdDeadline: '2025-04-25T23:59:59.000Z',
    status: 'PUBLISHED',
    tags: ['Ladies', 'Women', 'Brunch', 'Networking', 'Lagos', 'Leadership']
  },
  {
    id: 'afms-passing-out-parade-2025',
    title: 'AFMS/AFGMS Joint Passing Out Parade 2025',
    shortDescription: 'The grand graduation ceremony of new junior airmen and airwomen',
    description: `Join The ExJAM Association at the AFMS/AFGMS Joint Passing Out Parade 2025. This historic event celebrates the graduation of new junior airmen and airwomen.

🎓 CELEBRATING THE NEXT GENERATION 🎓

EVENT SCHEDULE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 WEDNESDAY, 23rd July 2025
🎤 Speech and Prize Giving Day
📍 Venue: Nsikak Eduok Hall
⏰ Time: 10:00 AM

📅 FRIDAY, 25th July 2025  
🥁 Beating of the Retreat
📍 Venue: AFMS Parade Ground
⏰ Time: 5:00 PM

📅 SATURDAY, 26th July 2025
🎖️ Passing Out Parade
📍 Venue: AFMS Parade Ground  
⏰ Time: 9:00 AM

🏛️ ExJAM Annual General Meeting (AGM)
📍 Venue: Nsikak Eduok Hall
⏰ Time: 2:00 PM

SPECIAL FEATURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Military parade and ceremonial display
• Award presentations to outstanding graduates
• Alumni networking sessions
• Squadron exhibitions and displays
• Cultural performances
• Official AGM proceedings

This is a unique opportunity to witness the next generation of airmen and airwomen as they complete their training and to reconnect with fellow alumni.`,
    startDate: '2025-07-23T09:00:00.000Z',
    endDate: '2025-07-26T18:00:00.000Z',
    venue: 'Air Force Military School',
    address: 'AFMS Jos, Plateau State, Nigeria',
    capacity: 1000,
    price: 25000.00,
    earlyBirdPrice: 20000.00,
    earlyBirdDeadline: '2025-06-30T23:59:59.000Z',
    status: 'PUBLISHED',
    tags: ['Passing Out', 'AFMS', 'Jos', 'AGM', 'Graduation', 'Parade', 'Military']
  }
];

async function createEventsInSupabase() {
  console.log('🚀 Creating comprehensive ExJAM events in Supabase...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  try {
    // Test connection first
    console.log('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('Event')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful\n');
    
    // Clear existing events (optional - skip if no delete permissions)
    console.log('🧹 Checking existing events...');
    const { data: existingEvents, error: listError } = await supabase
      .from('Event')
      .select('id, title');
    
    if (listError) {
      console.log('⚠️ Could not list existing events:', listError.message);
    } else {
      console.log(`📊 Found ${existingEvents?.length || 0} existing events\n`);
    }
    
    // Create each event
    for (const event of events) {
      try {
        console.log(`Creating: ${event.title}...`);
        
        const { data, error } = await supabase
          .from('Event')
          .insert({
            id: event.id,
            title: event.title,
            description: event.description,
            shortDescription: event.shortDescription,
            startDate: event.startDate,
            endDate: event.endDate,
            venue: event.venue,
            address: event.address,
            capacity: event.capacity,
            price: event.price,
            earlyBirdPrice: event.earlyBirdPrice,
            earlyBirdDeadline: event.earlyBirdDeadline,
            imageUrl: event.imageUrl,
            status: event.status,
            tags: event.tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.log(`❌ Failed: ${error.message}\n`);
          errorCount++;
        } else {
          console.log(`✅ Created successfully!\n`);
          successCount++;
        }
        
      } catch (err) {
        console.error(`❌ Error creating ${event.title}:`, err.message, '\n');
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 CREATION SUMMARY`);
    console.log(`✅ Successfully created: ${successCount} events`);
    console.log(`❌ Failed to create: ${errorCount} events`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Fetch and display all events
    console.log('\n📋 Fetching all events from database...\n');
    const { data: allEvents, error: fetchError } = await supabase
      .from('Event')
      .select('id, title, startDate, venue, status, price')
      .order('startDate', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Failed to fetch events:', fetchError.message);
    } else {
      console.log(`Found ${allEvents.length} events in database:\n`);
      allEvents.forEach((evt, index) => {
        const date = new Date(evt.startDate).toLocaleDateString('en-NG');
        const price = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN'
        }).format(evt.price);
        console.log(`${index + 1}. ${evt.title}`);
        console.log(`   📅 Date: ${date}`);
        console.log(`   📍 Venue: ${evt.venue}`);
        console.log(`   💰 Price: ${price}`);
        console.log(`   📊 Status: ${evt.status}\n`);
      });
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

// Run the script
createEventsInSupabase()
  .then(() => {
    console.log('\n✨ Event creation script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
