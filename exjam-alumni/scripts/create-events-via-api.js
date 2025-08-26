// Script to create events via API
const events = [
  {
    id: "pg-conference-2025-main",
    title: "President General's Conference 2025 - Maiden Flight",
    shortDescription: "The inaugural PG Conference bringing together ExJAM alumni worldwide",
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
    startDate: "2025-11-28T08:00:00",
    endDate: "2025-11-30T22:00:00",
    venue: "NAF Conference Centre, Abuja",
    address: "Nigerian Air Force Headquarters, Airport Road, Abuja, FCT",
    capacity: 800,
    price: 75000,
    earlyBirdPrice: 50000,
    earlyBirdDeadline: "2025-09-30",
    imageUrl: "/images/events/pg-conference-2025.jpg",
    status: "PUBLISHED",
  },
  {
    id: "afms-founders-day-2025",
    title: "AFMS Founders Day Celebration 2025",
    shortDescription: "Celebrating 45 years of excellence in military education",
    description: `Join us in celebrating 45 years of Air Force Military School Jos!

Event Program:
• Morning Parade & March Past
• Historical Exhibition
• Old Boys Football Match
• Squadron Competitions
• Anniversary Lecture
• Award Presentations
• Evening Social & Networking`,
    startDate: "2025-10-15T08:00:00",
    endDate: "2025-10-15T20:00:00",
    venue: "AFMS Jos Campus",
    address: "Air Force Military School, Jos, Plateau State",
    capacity: 2000,
    price: 10000,
    earlyBirdPrice: 7500,
    earlyBirdDeadline: "2025-09-15",
    status: "PUBLISHED",
  },
  {
    id: "squadron-championships-2025",
    title: "Inter-Squadron Championships 2025",
    shortDescription: "Annual sports and games competition between all squadrons",
    description: `The ultimate squadron showdown! Compete for squadron glory in various sporting and intellectual events.

SPORTING EVENTS:
• Football, Basketball, Table Tennis
• Athletics (100m, 200m, 400m, Relay)
• Tug of War, Swimming

INTELLECTUAL COMPETITIONS:
• Chess, Scrabble, Quiz, Debate`,
    startDate: "2025-08-15T07:00:00",
    endDate: "2025-08-17T19:00:00",
    venue: "National Stadium, Abuja",
    address: "National Stadium Complex, Airport Road, Abuja",
    capacity: 600,
    price: 5000,
    earlyBirdPrice: 3500,
    earlyBirdDeadline: "2025-07-31",
    status: "PUBLISHED",
  },
  {
    id: "career-summit-2025",
    title: "Young Alumni Career & Entrepreneurship Summit",
    shortDescription: "Empowering the next generation of ExJAM leaders",
    description: `A specialized summit for recent graduates and young professionals!

HIGHLIGHTS:
• Career Development Workshops
• Entrepreneurship Track
• Mentorship Matching
• Job Fair & Startup Pitch Competition`,
    startDate: "2025-06-14T09:00:00",
    endDate: "2025-06-14T18:00:00",
    venue: "Eko Hotels & Suites",
    address: "Plot 1415 Adetokunbo Ademola Street, Victoria Island, Lagos",
    capacity: 300,
    price: 12000,
    earlyBirdPrice: 8000,
    earlyBirdDeadline: "2025-05-31",
    status: "PUBLISHED",
  },
  {
    id: "golf-tournament-2025",
    title: "ExJAM Charity Golf Tournament 2025",
    shortDescription: "Golf tournament to raise funds for AFMS scholarship program",
    description: `Tee off for a good cause! All proceeds go to the AFMS Scholarship Fund.

• 18-hole tournament
• Individual and team categories
• Prizes for various categories
• Cocktail reception and awards ceremony`,
    startDate: "2025-09-06T06:30:00",
    endDate: "2025-09-06T18:00:00",
    venue: "IBB International Golf & Country Club",
    address: "IBB Golf Course, Abuja",
    capacity: 120,
    price: 50000,
    earlyBirdPrice: 40000,
    earlyBirdDeadline: "2025-08-15",
    status: "PUBLISHED",
  },
  {
    id: "ladies-brunch-2025",
    title: "Ladies of ExJAM Annual Brunch",
    shortDescription: "Celebrating the women of AFMS alumni community",
    description: `An elegant afternoon celebrating the remarkable women of ExJAM!

PROGRAM:
• Welcome cocktails
• Inspirational keynotes
• Panel: "Women in Leadership"
• Fashion showcase
• Business networking session`,
    startDate: "2025-05-10T11:00:00",
    endDate: "2025-05-10T16:00:00",
    venue: "The Wheatbaker Hotel",
    address: "4 Onitolo Road, Ikoyi, Lagos",
    capacity: 200,
    price: 15000,
    earlyBirdPrice: 12000,
    earlyBirdDeadline: "2025-04-25",
    status: "PUBLISHED",
  },
];

async function createEventsViaAPI() {
  console.log("🚀 Creating events via API...\n");

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  let successCount = 0;
  let errorCount = 0;

  for (const event of events) {
    try {
      console.log(`Creating: ${event.title}...`);

      const response = await fetch(`${baseUrl}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (response.ok) {
        const created = await response.json();
        console.log(`✅ Created: ${created.title}\n`);
        successCount++;
      } else {
        const error = await response.text();
        console.log(`❌ Failed to create ${event.title}: ${error}\n`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating ${event.title}:`, error.message, "\n");
      errorCount++;
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📊 Results: ${successCount} created, ${errorCount} failed`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Fetch and display all events
  try {
    console.log("\n📋 Fetching all events...\n");
    const response = await fetch(`${baseUrl}/api/events?showPast=true&status=ALL`);
    if (response.ok) {
      const data = await response.json();
      console.log(`Found ${data.events.length} events:\n`);
      data.events.forEach((evt) => {
        const date = new Date(evt.startDate).toLocaleDateString("en-NG");
        console.log(`• ${evt.title} - ${date}`);
      });
    }
  } catch (error) {
    console.error("Failed to fetch events:", error.message);
  }
}

// Run the script
createEventsViaAPI()
  .then(() => {
    console.log("\n✨ Script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
