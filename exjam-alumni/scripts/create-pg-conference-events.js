const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function createPGConferenceAndEvents() {
  try {
    console.log("🚀 Creating PG Conference 2025 and other alumni events...\n");

    // 1. PG Conference 2025 - MAIN EVENT
    const pgConference = await prisma.event.upsert({
      where: { id: "pg-conference-2025-main" },
      update: {
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

Package includes conference materials, meals, and access to all sessions.

WHO SHOULD ATTEND:
• All AFMS Jos Alumni (1980-2025)
• Squadron members (Green, Red, Purple, Yellow, Dornier, Puma)
• Friends of ExJAM
• Special guests and dignitaries

Don't miss this historic gathering! Register now and be part of the legacy.`,
        startDate: new Date("2025-11-28T08:00:00"),
        endDate: new Date("2025-11-30T22:00:00"),
        venue: "NAF Conference Centre, Abuja",
        address: "Nigerian Air Force Headquarters, Airport Road, Abuja, FCT",
        capacity: 800,
        price: 75000,
        earlyBirdPrice: 50000,
        earlyBirdDeadline: new Date("2025-09-30"),
        imageUrl: "/images/events/pg-conference-2025.jpg",
        tags: [
          "conference",
          "pg-conference",
          "networking",
          "alumni",
          "leadership",
          "maiden-flight",
        ],
        status: "PUBLISHED",
      },
      create: {
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

Package includes conference materials, meals, and access to all sessions.

WHO SHOULD ATTEND:
• All AFMS Jos Alumni (1980-2025)
• Squadron members (Green, Red, Purple, Yellow, Dornier, Puma)
• Friends of ExJAM
• Special guests and dignitaries

Don't miss this historic gathering! Register now and be part of the legacy.`,
        startDate: new Date("2025-11-28T08:00:00"),
        endDate: new Date("2025-11-30T22:00:00"),
        venue: "NAF Conference Centre, Abuja",
        address: "Nigerian Air Force Headquarters, Airport Road, Abuja, FCT",
        capacity: 800,
        price: 75000,
        earlyBirdPrice: 50000,
        earlyBirdDeadline: new Date("2025-09-30"),
        imageUrl: "/images/events/pg-conference-2025.jpg",
        tags: [
          "conference",
          "pg-conference",
          "networking",
          "alumni",
          "leadership",
          "maiden-flight",
        ],
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created PG Conference 2025:", pgConference.title);

    // 2. AFMS Founders Day Celebration
    const foundersDay = await prisma.event.upsert({
      where: { id: "afms-founders-day-2025" },
      update: {},
      create: {
        id: "afms-founders-day-2025",
        title: "AFMS Founders Day Celebration 2025",
        shortDescription: "Celebrating 45 years of excellence in military education",
        description: `Join us in celebrating 45 years of Air Force Military School Jos!

A day of nostalgia, pride, and celebration as we honor the legacy of AFMS Jos and the thousands of leaders it has produced.

Event Program:
• Morning Parade & March Past
• Historical Exhibition
• Old Boys Football Match
• Squadron Competitions
• Anniversary Lecture
• Award Presentations
• Evening Social & Networking

Special Features:
• AFMS Museum Tour
• Documentary Screening
• Photo Exhibition (1980-2025)
• Meet & Greet with Founding Staff

All alumni, current students, staff, and friends of AFMS are welcome!`,
        startDate: new Date("2025-10-15T08:00:00"),
        endDate: new Date("2025-10-15T20:00:00"),
        venue: "AFMS Jos Campus",
        address: "Air Force Military School, Jos, Plateau State",
        capacity: 2000,
        price: 10000,
        earlyBirdPrice: 7500,
        earlyBirdDeadline: new Date("2025-09-15"),
        tags: ["celebration", "founders-day", "anniversary", "afms", "heritage"],
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created Founders Day 2025:", foundersDay.title);

    // 3. Squadron Championships 2025
    const squadronChampionships = await prisma.event.upsert({
      where: { id: "squadron-championships-2025" },
      update: {},
      create: {
        id: "squadron-championships-2025",
        title: "Inter-Squadron Championships 2025",
        shortDescription: "Annual sports and games competition between all squadrons",
        description: `The ultimate squadron showdown is here! 

Compete for squadron glory in various sporting and intellectual events:

SPORTING EVENTS:
• Football Tournament
• Basketball Championship
• Table Tennis
• Athletics (100m, 200m, 400m, Relay)
• Tug of War
• Swimming Competition

INTELLECTUAL COMPETITIONS:
• Chess Tournament
• Scrabble Championship
• Quiz Competition
• Debate Contest

SQUADRONS COMPETING:
🟢 Green Squadron
🔴 Red Squadron
🟣 Purple Squadron
🟡 Yellow Squadron
✈️ Dornier Squadron
🐾 Puma Squadron

Prizes for overall champion squadron and individual event winners!

Registration is per squadron. Individual participants register through squadron representatives.`,
        startDate: new Date("2025-08-15T07:00:00"),
        endDate: new Date("2025-08-17T19:00:00"),
        venue: "National Stadium, Abuja",
        address: "National Stadium Complex, Airport Road, Abuja",
        capacity: 600,
        price: 5000,
        earlyBirdPrice: 3500,
        earlyBirdDeadline: new Date("2025-07-31"),
        tags: ["sports", "competition", "squadron", "championship", "games"],
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created Squadron Championships:", squadronChampionships.title);

    // 4. Young Alumni Career Summit
    const careerSummit = await prisma.event.upsert({
      where: { id: "career-summit-2025" },
      update: {},
      create: {
        id: "career-summit-2025",
        title: "Young Alumni Career & Entrepreneurship Summit",
        shortDescription: "Empowering the next generation of ExJAM leaders",
        description: `A specialized summit for recent graduates and young professionals!

SUMMIT HIGHLIGHTS:

🎯 CAREER DEVELOPMENT
• CV Writing Workshop
• Interview Masterclass
• LinkedIn Optimization
• Personal Branding Session
• Industry-specific Career Panels

💼 ENTREPRENEURSHIP TRACK
• Startup Fundamentals
• Business Plan Development
• Funding & Investment Options
• Digital Marketing Strategies
• Success Stories from Alumni Entrepreneurs

🤝 MENTORSHIP MATCHING
• One-on-one mentorship sessions
• Industry roundtables
• Speed networking
• Alumni business showcase

SPECIAL FEATURES:
• Free professional headshots
• Career counseling booths
• Job fair with alumni-led companies
• Startup pitch competition (₦500,000 prize)

TARGET AUDIENCE:
• Recent graduates (2015-2025)
• Young professionals
• Aspiring entrepreneurs
• Career changers

Limited seats available. Register early!`,
        startDate: new Date("2025-06-14T09:00:00"),
        endDate: new Date("2025-06-14T18:00:00"),
        venue: "Eko Hotels & Suites",
        address: "Plot 1415 Adetokunbo Ademola Street, Victoria Island, Lagos",
        capacity: 300,
        price: 12000,
        earlyBirdPrice: 8000,
        earlyBirdDeadline: new Date("2025-05-31"),
        tags: ["career", "mentorship", "entrepreneurship", "youth", "professional"],
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created Career Summit:", careerSummit.title);

    // 5. ExJAM Golf Tournament
    const golfTournament = await prisma.event.upsert({
      where: { id: "golf-tournament-2025" },
      update: {},
      create: {
        id: "golf-tournament-2025",
        title: "ExJAM Charity Golf Tournament 2025",
        shortDescription: "Golf tournament to raise funds for AFMS scholarship program",
        description: `Tee off for a good cause at the ExJAM Charity Golf Tournament!

All proceeds go to the AFMS Scholarship Fund supporting underprivileged students.

EVENT DETAILS:
• 18-hole tournament
• Shotgun start at 7:30 AM
• Individual and team categories
• Handicap and scratch divisions

PRIZES:
🏆 Overall Winner
🥈 Runner-up
🥉 Third Place
• Longest Drive
• Nearest to Pin
• Best Dressed
• Team Championship

PACKAGE INCLUDES:
• Green fees
• Golf cart
• Practice balls
• Breakfast and lunch
• Cocktail reception
• Goodie bag
• Awards ceremony

Special celebrity guest appearance!

Limited to 120 golfers. Non-golfers welcome for networking lunch and cocktails.`,
        startDate: new Date("2025-09-06T06:30:00"),
        endDate: new Date("2025-09-06T18:00:00"),
        venue: "IBB International Golf & Country Club",
        address: "IBB Golf Course, Abuja",
        capacity: 120,
        price: 50000,
        earlyBirdPrice: 40000,
        earlyBirdDeadline: new Date("2025-08-15"),
        tags: ["golf", "charity", "tournament", "fundraising", "sports"],
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created Golf Tournament:", golfTournament.title);

    // 6. Ladies of ExJAM Brunch
    const ladiesBrunch = await prisma.event.upsert({
      where: { id: "ladies-brunch-2025" },
      update: {},
      create: {
        id: "ladies-brunch-2025",
        title: "Ladies of ExJAM Annual Brunch",
        shortDescription: "Celebrating the women of AFMS alumni community",
        description: `An elegant afternoon celebrating the remarkable women of ExJAM!

Join us for an inspiring gathering of female alumni and spouses making waves across various industries.

PROGRAM:
• Welcome cocktails
• Inspirational keynotes
• Panel: "Women in Leadership"
• Fashion showcase
• Wellness & Beauty talks
• Business networking session
• Awards & Recognition

SPECIAL FEATURES:
• Complimentary spa vouchers
• Professional photoshoot
• Gift bags from sponsors
• Book launch & signing
• Charity auction

Dress Code: Smart Casual/Traditional Elegance

All female alumni and spouses of alumni are warmly invited.`,
        startDate: new Date("2025-05-10T11:00:00"),
        endDate: new Date("2025-05-10T16:00:00"),
        venue: "The Wheatbaker Hotel",
        address: "4 Onitolo Road, Ikoyi, Lagos",
        capacity: 200,
        price: 15000,
        earlyBirdPrice: 12000,
        earlyBirdDeadline: new Date("2025-04-25"),
        tags: ["ladies", "networking", "brunch", "women", "social"],
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created Ladies Brunch:", ladiesBrunch.title);

    // 7. Set Reunion - Class of 2000
    const setReunion = await prisma.event.upsert({
      where: { id: "set-2000-reunion" },
      update: {},
      create: {
        id: "set-2000-reunion",
        title: "Class of 2000 - 25 Year Reunion",
        shortDescription: "Silver jubilee reunion for the graduating class of 2000",
        description: `25 years later, let's reunite!

Join your classmates for a memorable weekend celebrating our journey since graduation.

WEEKEND PROGRAM:

FRIDAY - Welcome Night
• Registration & Welcome Drinks
• Informal Mixer
• Memory Lane Photo Exhibition

SATURDAY - Main Events
• Campus Tour
• Memorial Service
• Class Photo Session
• Panel: "Our Journey So Far"
• Family Picnic
• Gala Dinner & Awards

SUNDAY - Farewell
• Thanksgiving Service
• Farewell Brunch
• Future Plans Discussion

Special Recognition:
• Most Successful Entrepreneur
• Public Service Award
• Academic Excellence Award
• Community Impact Award

Bring your families! Special activities planned for spouses and children.`,
        startDate: new Date("2025-07-25T16:00:00"),
        endDate: new Date("2025-07-27T14:00:00"),
        venue: "Hill Station Hotel",
        address: "Old Airport Junction, Jos, Plateau State",
        capacity: 150,
        price: 25000,
        earlyBirdPrice: 20000,
        earlyBirdDeadline: new Date("2025-06-30"),
        tags: ["reunion", "class-of-2000", "silver-jubilee", "nostalgia"],
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created Set 2000 Reunion:", setReunion.title);

    // 8. ExJAM Business Expo
    const businessExpo = await prisma.event.upsert({
      where: { id: "business-expo-2025" },
      update: {},
      create: {
        id: "business-expo-2025",
        title: "ExJAM Business Expo & Investment Forum",
        shortDescription: "Showcasing alumni businesses and investment opportunities",
        description: `Connect, Collaborate, and Grow at the ExJAM Business Expo!

A platform for alumni entrepreneurs to showcase their businesses and explore partnerships.

EXPO FEATURES:
📊 EXHIBITION HALL
• 50+ alumni-owned businesses
• Product demonstrations
• Service showcases
• Startup pavilion

💡 INVESTMENT FORUM
• Pitch sessions to investors
• Angel investor meetups
• Venture capital presentations
• Crowdfunding workshop

🤝 B2B NETWORKING
• Speed networking sessions
• Industry roundtables
• Procurement opportunities
• Partnership matching

📚 MASTERCLASSES
• Digital transformation
• Export opportunities
• Government contracts
• Scaling your business

SECTORS REPRESENTED:
• Technology & Innovation
• Agriculture & Agribusiness
• Manufacturing
• Services & Consulting
• Real Estate
• Healthcare
• Education

Register as an exhibitor or visitor. Special rates for alumni!`,
        startDate: new Date("2025-04-10T09:00:00"),
        endDate: new Date("2025-04-12T18:00:00"),
        venue: "Landmark Event Centre",
        address: "Plot 5, Water Corporation Road, Victoria Island, Lagos",
        capacity: 500,
        price: 8000,
        earlyBirdPrice: 5000,
        earlyBirdDeadline: new Date("2025-03-20"),
        tags: ["business", "expo", "investment", "entrepreneurship", "b2b"],
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created Business Expo:", businessExpo.title);

    console.log("\n✅ All events created successfully!\n");

    // List all events
    const allEvents = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        startDate: true,
        status: true,
        capacity: true,
        price: true,
        _count: {
          select: { Registration: true },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    console.log("📋 All Events in Database:\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    allEvents.forEach((event) => {
      const date = new Date(event.startDate).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      console.log(`📌 ${event.title}`);
      console.log(
        `   Date: ${date} | Status: ${event.status} | Price: ₦${event.price.toLocaleString()}`
      );
      console.log(`   Capacity: ${event.capacity} | Registrations: ${event._count.Registration}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error creating events:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createPGConferenceAndEvents()
  .then(() => {
    console.log("✨ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
