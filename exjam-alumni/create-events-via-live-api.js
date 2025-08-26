// Create events using the live API endpoint on Vercel
const events = [
  {
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
    price: 75000,
    earlyBirdPrice: 50000,
    earlyBirdDeadline: '2025-09-30T23:59:59.000Z',
    imageUrl: '/images/events/pg-conference-2025.jpg',
    status: 'PUBLISHED'
  },
  {
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
    price: 10000,
    earlyBirdPrice: 7500,
    earlyBirdDeadline: '2025-09-15T23:59:59.000Z',
    status: 'PUBLISHED'
  },
  {
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
    price: 5000,
    earlyBirdPrice: 3500,
    earlyBirdDeadline: '2025-07-31T23:59:59.000Z',
    status: 'PUBLISHED'
  },
  {
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
    price: 12000,
    earlyBirdPrice: 8000,
    earlyBirdDeadline: '2025-05-31T23:59:59.000Z',
    status: 'PUBLISHED'
  },
  {
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
    price: 50000,
    earlyBirdPrice: 40000,
    earlyBirdDeadline: '2025-08-15T23:59:59.000Z',
    status: 'PUBLISHED'
  },
  {
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
    price: 15000,
    earlyBirdPrice: 12000,
    earlyBirdDeadline: '2025-04-25T23:59:59.000Z',
    status: 'PUBLISHED'
  },
  {
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
    price: 25000,
    earlyBirdPrice: 20000,
    earlyBirdDeadline: '2025-06-30T23:59:59.000Z',
    status: 'PUBLISHED'
  }
];

async function createEventsViaLiveAPI() {
  console.log('🚀 Creating ExJAM events via live API...\n');
  
  const baseUrl = 'https://exjam-alumni-4w2pv4h6f-gms-projects-06b0f5db.vercel.app';
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`🌐 Using API base URL: ${baseUrl}`);
  console.log(`📊 Creating ${events.length} events...\n`);
  
  for (const [index, event] of events.entries()) {
    try {
      console.log(`${index + 1}/${events.length} Creating: ${event.title}...`);
      
      const response = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExJAM-Event-Creator/1.0'
        },
        body: JSON.stringify(event)
      });
      
      if (response.ok) {
        const created = await response.json();
        console.log(`✅ Successfully created! ID: ${created.id}`);
        const startDate = new Date(created.startDate).toLocaleDateString('en-NG');
        const price = new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN'
        }).format(created.price);
        console.log(`   📅 Date: ${startDate} | 📍 ${created.venue} | 💰 ${price}\n`);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed (${response.status}): ${errorText}\n`);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Network error creating ${event.title}:`, error.message, '\n');
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 CREATION SUMMARY`);
  console.log(`✅ Successfully created: ${successCount} events`);
  console.log(`❌ Failed to create: ${errorCount} events`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Fetch and display all events from live API
  try {
    console.log('\n📋 Fetching all events from live site...\n');
    const response = await fetch(`${baseUrl}/api/events?status=ALL`);
    if (response.ok) {
      const data = await response.json();
      console.log(`🎯 Found ${data.events?.length || 0} total events on live site:\n`);
      
      if (data.events && data.events.length > 0) {
        data.events
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .forEach((evt, index) => {
            const date = new Date(evt.startDate).toLocaleDateString('en-NG');
            const price = new Intl.NumberFormat('en-NG', {
              style: 'currency',
              currency: 'NGN'
            }).format(evt.price || 0);
            console.log(`${index + 1}. ${evt.title}`);
            console.log(`   📅 Date: ${date}`);
            console.log(`   📍 Venue: ${evt.venue}`);
            console.log(`   💰 Price: ${price}`);
            console.log(`   📊 Status: ${evt.status}`);
            console.log(`   🆔 ID: ${evt.id}\n`);
          });
      }
    } else {
      console.log('⚠️ Could not fetch events list from live API');
    }
  } catch (error) {
    console.error('❌ Failed to fetch events from live API:', error.message);
  }
}

// Run the script
createEventsViaLiveAPI()
  .then(() => {
    console.log('\n✨ Event creation via live API completed!');
    console.log('🌐 Visit the live site to see your events:');
    console.log('   https://exjam-alumni-4w2pv4h6f-gms-projects-06b0f5db.vercel.app/events');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
