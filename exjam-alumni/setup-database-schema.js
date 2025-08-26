/**
 * Setup database schema and create events directly
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

// Use direct URL for schema operations
const DIRECT_URL = process.env.DIRECT_URL || 'postgresql://postgres.yzrzjagkkycmdwuhrvww:Goldmay2014@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

console.log('🔧 Using direct database URL (first 50 chars):', DIRECT_URL.substring(0, 50) + '...');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DIRECT_URL
    }
  }
});

async function setupSchemaAndCreateEvents() {
  console.log('🚀 Setting up database schema and creating events...\n');

  try {
    // Connect to database
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Create Event table if it doesn't exist
    console.log('📋 Creating Event table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Event" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "shortDescription" TEXT,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "venue" TEXT NOT NULL,
        "address" TEXT,
        "capacity" INTEGER NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "earlyBirdPrice" DECIMAL(10,2),
        "earlyBirdDeadline" TIMESTAMP(3),
        "imageUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "organizerId" TEXT,
        "tags" TEXT[] DEFAULT '{}',

        CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ Event table created/verified\n');

    // Create indexes for performance
    console.log('📊 Creating indexes...');
    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Event_status_idx" ON "Event"("status");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Event_startDate_idx" ON "Event"("startDate");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Event_endDate_idx" ON "Event"("endDate");`;
      console.log('✅ Indexes created\n');
    } catch (error) {
      console.log('⚠️ Some indexes may already exist, continuing...\n');
    }

    // Now create events
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 KEYNOTE SESSIONS
• Distinguished alumni speakers from military, business & public service
• Leadership masterclasses by senior officers
• Panel discussions on national development

🤝 NETWORKING OPPORTUNITIES
• Squadron reunion sessions
• Class set meetups  
• Professional networking lounges
• Business collaboration forum

🏆 SPECIAL CEREMONIES
• Awards gala dinner
• Achievement recognitions
• Service appreciation ceremony
• Cultural night showcase

🎯 STRATEGIC SESSIONS
• ExJAM vision 2030 planning
• Alumni mentorship program launch
• Investment & scholarship fund initiatives
• Future conference planning

Early bird registration ends October 15, 2025. Don't miss this historic gathering!`,
        startDate: '2025-11-28T09:00:00Z',
        endDate: '2025-11-30T18:00:00Z',
        venue: 'NAF Conference Centre, Abuja',
        address: 'Nigerian Air Force Base, Bill Clinton Drive, Abuja, FCT',
        capacity: 500,
        price: 25000.00,
        earlyBirdPrice: 20000.00,
        earlyBirdDeadline: '2025-10-15T23:59:59Z',
        imageUrl: '/images/events/pg-conference-2025.jpg',
        status: 'PUBLISHED',
        tags: ['conference', 'reunion', 'networking', 'leadership', 'flagship']
      },
      {
        id: 'founders-day-2025',
        title: 'AFMS Founders Day Celebration 2025 - 45th Anniversary',
        shortDescription: 'Celebrating 45 years of excellence in military education',
        description: `Join us in commemorating the 45th Anniversary of the Air Force Military School!

📅 Date: October 15, 2025
📍 Venue: AFMS Parade Ground, Jos
🎯 Theme: "Four and Half Decades of Excellence"

CELEBRATION HIGHLIGHTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ CEREMONIAL EVENTS
• Founders Day parade
• Wreath laying ceremony
• School inspection by distinguished alumni
• Time capsule unveiling

📚 ACADEMIC SESSIONS
• Education excellence exhibition
• Alumni achievement showcase
• Scholarship presentation ceremony
• Historical archives display

🎊 SOCIAL ACTIVITIES
• Alumni talent show
• Cultural performances
• Traditional military band performances
• Reunion dinner & awards

🏅 SPECIAL RECOGNITIONS
• Outstanding alumni awards
• Service to school recognition
• Pioneer set honor ceremony
• Faculty appreciation awards

A historic celebration of military education excellence and alumni achievement!`,
        startDate: '2025-10-15T08:00:00Z',
        endDate: '2025-10-15T20:00:00Z',
        venue: 'AFMS Parade Ground, Jos',
        address: 'Air Force Military School, Jos, Plateau State',
        capacity: 1000,
        price: 15000.00,
        earlyBirdPrice: 12000.00,
        earlyBirdDeadline: '2025-09-15T23:59:59Z',
        imageUrl: '/images/events/founders-day-2025.jpg',
        status: 'PUBLISHED',
        tags: ['celebration', 'anniversary', 'ceremony', 'tradition', 'milestone']
      },
      {
        id: 'squadron-championships-2025',
        title: 'Inter-Squadron Championships 2025',
        shortDescription: 'Annual sports and competition extravaganza',
        description: `The ultimate test of squadron pride and athletic excellence!

📅 Date: August 15-17, 2025
📍 Venue: National Stadium Complex, Abuja
🎯 Theme: "Unity Through Competition"

CHAMPIONSHIP EVENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏃‍♂️ ATHLETIC COMPETITIONS
• Track & field events
• Football tournament
• Basketball championship
• Volleyball competitions
• Swimming contests

🧠 INTELLECTUAL CHALLENGES
• Quiz competitions
• Debate championships
• Chess tournaments
• Problem-solving challenges
• Academic olympiad

🎨 CREATIVE CONTESTS
• Music & dance competitions
• Art & craft exhibitions
• Photography contests
• Creative writing challenges
• Innovation showcases

🏆 SPECIAL FEATURES
• Alumni coaching clinics
• Sports medicine workshops
• Fitness masterclasses
• Equipment & gear expo
• Awards & recognition ceremony

Come support your squadron and relive the competitive spirit!`,
        startDate: '2025-08-15T08:00:00Z',
        endDate: '2025-08-17T18:00:00Z',
        venue: 'National Stadium Complex, Abuja',
        address: 'National Stadium, Package B, Abuja, FCT',
        capacity: 2000,
        price: 8000.00,
        earlyBirdPrice: 6000.00,
        earlyBirdDeadline: '2025-07-15T23:59:59Z',
        imageUrl: '/images/events/championships-2025.jpg',
        status: 'PUBLISHED',
        tags: ['sports', 'competition', 'squadron', 'athletics', 'championship']
      },
      {
        id: 'career-summit-2025',
        title: 'Young Alumni Career & Entrepreneurs Summit',
        shortDescription: 'Empowering the next generation of ExJAM leaders',
        description: `A dynamic summit designed for young alumni ready to make their mark!

📅 Date: July 20-21, 2025
📍 Venue: Lagos Business School, Lagos
🎯 Theme: "Innovation, Leadership & Impact"

SUMMIT HIGHLIGHTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 CAREER DEVELOPMENT
• Industry expert panels
• Resume & interview workshops
• Career transition strategies
• Personal branding sessions
• LinkedIn optimization clinics

🚀 ENTREPRENEURSHIP TRACK
• Startup pitch competitions
• Funding & investment guidance
• Business plan workshops
• Mentorship matching sessions
• Market research strategies

🌟 LEADERSHIP TRAINING
• Executive presence workshops
• Communication masterclasses
• Team building exercises
• Strategic thinking sessions
• Emotional intelligence training

🤝 NETWORKING OPPORTUNITIES
• Speed networking sessions
• Industry mixer events
• Alumni mentor meetups
• Peer connection forums
• Follow-up partnership planning

Your launchpad to career success and entrepreneurial excellence!`,
        startDate: '2025-07-20T09:00:00Z',
        endDate: '2025-07-21T17:00:00Z',
        venue: 'Lagos Business School, Lagos',
        address: 'Lagos Business School, Pan-Atlantic University, Lekki, Lagos',
        capacity: 300,
        price: 18000.00,
        earlyBirdPrice: 15000.00,
        earlyBirdDeadline: '2025-06-20T23:59:59Z',
        imageUrl: '/images/events/career-summit-2025.jpg',
        status: 'PUBLISHED',
        tags: ['career', 'entrepreneurship', 'young-alumni', 'networking', 'professional']
      },
      {
        id: 'golf-tournament-2025',
        title: 'ExJAM Charity Golf Tournament 2025',
        shortDescription: 'Golf for a cause - supporting education initiatives',
        description: `Tee off for education! An exclusive golf tournament supporting ExJAM scholarship programs.

📅 Date: September 14, 2025
📍 Venue: IBB International Golf Course, Abuja
🎯 Cause: "Education Access Fund"

TOURNAMENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏌️‍♂️ GOLF COMPETITION
• 18-hole championship format
• Professional & amateur categories
• Skill challenges & putting contests
• Longest drive & closest to pin competitions
• Team & individual prizes

🎯 CHARITY FOCUS
• Scholarship fund fundraising
• Educational equipment donations
• School infrastructure support
• Student mentorship programs
• Academic excellence awards

🥂 PREMIUM EXPERIENCE
• VIP hospitality tent
• Professional golf lessons
• Equipment showcase & trials
• Gourmet lunch & refreshments
• Awards dinner & auction

🏆 SPECIAL FEATURES
• Celebrity golf pros participation
• Alumni golf coaching sessions
• Equipment & apparel expo
• Health & wellness workshops
• Exclusive networking opportunities

Play for purpose, compete for excellence, contribute to education!`,
        startDate: '2025-09-14T07:00:00Z',
        endDate: '2025-09-14T19:00:00Z',
        venue: 'IBB International Golf Course, Abuja',
        address: 'IBB International Golf & Country Club, Maitama, Abuja, FCT',
        capacity: 144,
        price: 35000.00,
        earlyBirdPrice: 30000.00,
        earlyBirdDeadline: '2025-08-14T23:59:59Z',
        imageUrl: '/images/events/golf-tournament-2025.jpg',
        status: 'PUBLISHED',
        tags: ['golf', 'charity', 'fundraising', 'premium', 'exclusive']
      },
      {
        id: 'ladies-brunch-2025',
        title: 'Ladies of ExJAM Annual Brunch 2025',
        shortDescription: 'Celebrating the strength and grace of ExJAM women',
        description: `An elegant celebration of ExJAM women's achievements and sisterhood.

📅 Date: May 11, 2025 (Mother's Day Weekend)
📍 Venue: Transcorp Hilton, Abuja
🎯 Theme: "Strength, Grace & Legacy"

BRUNCH HIGHLIGHTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌸 ELEGANT GATHERING
• Gourmet brunch buffet
• Premium tea & coffee service
• Fresh flower arrangements
• Professional photography
• Live acoustic entertainment

👑 INSPIRATION SESSIONS
• Keynote by distinguished female alumni
• Success stories panel
• Work-life balance discussions
• Health & wellness presentations
• Personal development workshops

💎 SPECIAL RECOGNITIONS
• Outstanding women alumni awards
• Mother of the year celebration
• Community service recognition
• Leadership excellence honors
• Mentorship appreciation

🎁 EXCLUSIVE EXPERIENCES
• Fashion & style consultations
• Beauty & wellness workshops
• Artisan marketplace
• Networking circles
• Recipe & lifestyle exchanges

A sophisticated celebration of ExJAM sisterhood and women's empowerment!`,
        startDate: '2025-05-11T11:00:00Z',
        endDate: '2025-05-11T16:00:00Z',
        venue: 'Transcorp Hilton, Abuja',
        address: 'Transcorp Hilton Abuja, 1 Aguiyi Ironsi Street, Maitama, Abuja, FCT',
        capacity: 200,
        price: 22000.00,
        earlyBirdPrice: 18000.00,
        earlyBirdDeadline: '2025-04-11T23:59:59Z',
        imageUrl: '/images/events/ladies-brunch-2025.jpg',
        status: 'PUBLISHED',
        tags: ['ladies', 'brunch', 'celebration', 'networking', 'elegant']
      },
      {
        id: 'regional-meetup-lagos-2025',
        title: 'Lagos Chapter Regional Meetup',
        shortDescription: 'Monthly networking for Lagos-based ExJAM alumni',
        description: `Connect with fellow ExJAM alumni in Lagos for networking and socializing.

📅 Date: March 15, 2025
📍 Venue: Lagos Yacht Club, Victoria Island
🎯 Theme: "Building Business Networks"

MEETUP FEATURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 NETWORKING
• Professional speed networking
• Business card exchanges
• Industry group discussions
• Collaboration opportunities
• Partnership explorations

📢 PRESENTATIONS
• Member business spotlights
• Industry trend discussions
• Success story sharing
• Skill development tips
• Resource sharing sessions

🍽️ SOCIAL DINING
• Cocktail reception
• Networking dinner
• Casual conversation zones
• Entertainment & music
• Photo opportunities

A relaxed environment to strengthen professional and personal connections!`,
        startDate: '2025-03-15T18:00:00Z',
        endDate: '2025-03-15T22:00:00Z',
        venue: 'Lagos Yacht Club, Victoria Island',
        address: 'Lagos Yacht Club, 181 Ozumba Mbadiwe Avenue, Victoria Island, Lagos',
        capacity: 100,
        price: 5000.00,
        earlyBirdPrice: 4000.00,
        earlyBirdDeadline: '2025-03-05T23:59:59Z',
        imageUrl: '/images/events/lagos-meetup-2025.jpg',
        status: 'PUBLISHED',
        tags: ['meetup', 'lagos', 'networking', 'regional', 'monthly']
      }
    ];

    // Clear existing events first
    console.log('🧹 Clearing existing events...');
    await prisma.$executeRaw`DELETE FROM "Event"`;
    console.log('✅ Existing events cleared\n');

    // Insert events using raw SQL for better control
    console.log('📝 Creating events...');
    let createdCount = 0;

    for (const event of events) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "Event" (
            "id", "title", "shortDescription", "description", "startDate", "endDate",
            "venue", "address", "capacity", "price", "earlyBirdPrice", "earlyBirdDeadline",
            "imageUrl", "status", "tags", "createdAt", "updatedAt"
          ) VALUES (
            ${event.id}, ${event.title}, ${event.shortDescription}, ${event.description},
            ${event.startDate}::timestamp, ${event.endDate}::timestamp,
            ${event.venue}, ${event.address}, ${event.capacity}, ${event.price}::decimal,
            ${event.earlyBirdPrice}::decimal, ${event.earlyBirdDeadline}::timestamp,
            ${event.imageUrl}, ${event.status}, ${event.tags}, NOW(), NOW()
          )
        `;
        console.log(`✅ Created: ${event.title}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create "${event.title}":`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} out of ${events.length} events!`);

    // Verify events were created
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Event"`;
    console.log(`\n📊 Total events in database: ${result[0].count}`);

    const publishedResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Event" WHERE "status" = 'PUBLISHED'`;
    console.log(`📊 Published events: ${publishedResult[0].count}`);

    console.log('\n✨ Database setup and event creation completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setupSchemaAndCreateEvents().catch(console.error);
