#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

// Create Prisma client with Accelerate URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRISMA_ACCELERATE_URL
    }
  }
});

async function createPGEvent() {
  console.log('🔧 Creating PG Conference Event with Prisma Accelerate...\n');

  try {
    // Step 1: Check if Event table exists and has data
    console.log('1️⃣ Checking Event table...');
    const events = await prisma.event.findMany();
    console.log('✅ Event table accessible');
    console.log('📋 Found', events.length, 'existing events');
    
    // Check if PG Conference already exists
    const pgEvent = events.find(e => e.id === 'pg-conference-2025');
    if (pgEvent) {
      console.log('✅ PG Conference already exists!');
      console.log('📋 Title:', pgEvent.title);
      console.log('📋 Status:', pgEvent.status);
      console.log('📋 Price: ₦' + pgEvent.price);
      return;
    }

    // Step 2: Create PG Conference event
    console.log('\n2️⃣ Creating PG Conference event...');
    const newEvent = await prisma.event.create({
      data: {
        id: 'pg-conference-2025',
        title: "President General's Conference - Maiden Flight",
        description: 'This groundbreaking event marks a new milestone in the history of the ExJAM Association. For the first time ever, we are bringing together our members, leaders, and stakeholders to share ideas, build relationships, and shape the future of our association.',
        shortDescription: 'A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association',
        startDate: new Date('2025-11-28T09:00:00.000Z'),
        endDate: new Date('2025-11-30T18:00:00.000Z'),
        venue: 'NAF Conference Centre, FCT, ABUJA',
        address: 'Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria',
        capacity: 1000,
        price: 20000.00,
        earlyBirdPrice: null,
        earlyBirdDeadline: null,
        imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center',
        status: 'PUBLISHED',
        organizerId: null,
        tags: ['conference', 'alumni', 'networking', 'leadership']
      }
    });

    console.log('✅ PG Conference event created successfully!');
    console.log('📋 Title:', newEvent.title);
    console.log('📋 Status:', newEvent.status);
    console.log('📋 Price: ₦' + newEvent.price);
    console.log('📋 Venue:', newEvent.venue);

    // Step 3: Verify the event was created
    console.log('\n3️⃣ Verifying event creation...');
    const verifyEvent = await prisma.event.findUnique({
      where: { id: 'pg-conference-2025' }
    });

    if (verifyEvent) {
      console.log('✅ Event verified successfully!');
      console.log('📋 Title:', verifyEvent.title);
      console.log('📋 Status:', verifyEvent.status);
      console.log('📋 Price: ₦' + verifyEvent.price);
    } else {
      console.log('❌ Event not found after creation');
    }

    console.log('\n🎉 Setup completed!');
    console.log('\n🔗 Test these URLs:');
    console.log('   • Event Page: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025');
    console.log('   • Registration: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025/register');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 This might mean the database schema needs to be synced first.');
    console.error('   The Prisma Accelerate connection might not have the latest schema.');
  } finally {
    await prisma.$disconnect();
  }
}

createPGEvent();
