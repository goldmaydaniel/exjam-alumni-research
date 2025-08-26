// Create events using the local API endpoint
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
    status: 'PUBLISHED',
    tags: ['Conference', 'Networking', 'Alumni', 'PG2025', 'Maiden Flight']
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
    status: 'PUBLISHED',
    tags: ['Celebration', 'Founders Day', 'AFMS', '45 Years']
  }
];

async function createLocalEvents() {
  console.log('🚀 Creating ExJAM events via local API...\n');
  
  const baseUrl = 'http://localhost:3000';
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`🌐 Using local API URL: ${baseUrl}`);
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
  
  // Fetch and display all events from local API
  try {
    console.log('\n📋 Fetching all events from local site...\n');
    const response = await fetch(`${baseUrl}/api/events?status=ALL`);
    if (response.ok) {
      const data = await response.json();
      console.log(`🎯 Found ${data.events?.length || 0} total events on local site:\n`);
      
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
      console.log('⚠️ Could not fetch events list from local API');
    }
  } catch (error) {
    console.error('❌ Failed to fetch events from local API:', error.message);
  }
}

// Run the script
createLocalEvents()
  .then(() => {
    console.log('\n✨ Event creation via local API completed!');
    console.log('🌐 Visit your local site to see the events:');
    console.log('   http://localhost:3000/events');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
