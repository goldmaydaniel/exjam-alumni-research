const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function addPGConference() {
  try {
    console.log('🚀 Adding PG Conference 2025 to database...\n');
    
    const pgConference = {
      id: crypto.randomUUID(),
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
      startDate: new Date('2025-11-28T08:00:00.000Z'),
      endDate: new Date('2025-11-30T22:00:00.000Z'),
      venue: 'NAF Conference Centre, Abuja',
      address: 'Nigerian Air Force Headquarters, Airport Road, Abuja, FCT',
      capacity: 800,
      price: 75000,
      earlyBirdPrice: 50000,
      earlyBirdDeadline: new Date('2025-09-30T23:59:59.000Z'),
      imageUrl: '/images/events/pg-conference-2025.jpg',
      status: 'PUBLISHED',
      organizerId: null,
      tags: ['Conference', 'Networking', 'Alumni', 'PG2025', 'Maiden Flight'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const event = await prisma.event.create({
      data: pgConference
    });

    console.log('✅ PG Conference 2025 successfully created!');
    console.log(`🆔 Event ID: ${event.id}`);
    console.log(`📅 Date: ${event.startDate.toLocaleDateString('en-NG')}`);
    console.log(`📍 Venue: ${event.venue}`);
    console.log(`💰 Price: ₦${event.price.toLocaleString()}`);
    console.log(`📊 Status: ${event.status}\n`);

    // Also add a Founders Day event
    const foundersDay = {
      id: crypto.randomUUID(),
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
      startDate: new Date('2025-10-15T08:00:00.000Z'),
      endDate: new Date('2025-10-15T20:00:00.000Z'),
      venue: 'AFMS Jos Campus',
      address: 'Air Force Military School, Jos, Plateau State',
      capacity: 2000,
      price: 10000,
      earlyBirdPrice: 7500,
      earlyBirdDeadline: new Date('2025-09-15T23:59:59.000Z'),
      imageUrl: '/images/events/founders-day-2025.jpg',
      status: 'PUBLISHED',
      organizerId: null,
      tags: ['Celebration', 'Founders Day', 'AFMS', '45 Years'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const foundersEvent = await prisma.event.create({
      data: foundersDay
    });

    console.log('✅ AFMS Founders Day 2025 successfully created!');
    console.log(`🆔 Event ID: ${foundersEvent.id}`);
    console.log(`📅 Date: ${foundersEvent.startDate.toLocaleDateString('en-NG')}`);
    console.log(`📍 Venue: ${foundersEvent.venue}`);
    console.log(`💰 Price: ₦${foundersEvent.price.toLocaleString()}`);
    console.log(`📊 Status: ${foundersEvent.status}\n`);

    console.log('🎉 Both events have been successfully added to the database!');
    console.log('🌐 Now visit: http://localhost:3000/events');

  } catch (error) {
    console.error('❌ Error creating events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPGConference();
