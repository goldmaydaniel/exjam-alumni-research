#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

async function setupViaREST() {
  console.log('🔧 Setting up database via REST API...\n');

  try {
    // Step 1: Create events table via REST API
    console.log('1️⃣ Creating events table...');
    const createTableResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            short_description VARCHAR(500),
            start_date TIMESTAMP WITH TIME ZONE NOT NULL,
            end_date TIMESTAMP WITH TIME ZONE NOT NULL,
            venue VARCHAR(255),
            address TEXT,
            max_attendees INTEGER,
            registration_deadline TIMESTAMP WITH TIME ZONE,
            price_ngn INTEGER DEFAULT 0,
            early_bird_price_ngn INTEGER,
            early_bird_deadline TIMESTAMP WITH TIME ZONE,
            is_virtual BOOLEAN DEFAULT false,
            image_url TEXT,
            banner_url TEXT,
            status VARCHAR(50) DEFAULT 'draft',
            is_featured BOOLEAN DEFAULT false,
            requires_approval BOOLEAN DEFAULT false,
            registration_fields JSONB DEFAULT '[]',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
    });

    if (createTableResponse.ok) {
      console.log('✅ Events table created');
    } else {
      console.log('⚠️ Events table creation failed:', createTableResponse.status);
    }

    // Step 2: Insert PG Conference event
    console.log('\n2️⃣ Creating PG Conference event...');
    const insertEventResponse = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: 'pg-conference-2025',
        title: "President General's Conference - Maiden Flight",
        description: 'This groundbreaking event marks a new milestone in the history of the ExJAM Association. For the first time ever, we are bringing together our members, leaders, and stakeholders to share ideas, build relationships, and shape the future of our association.',
        short_description: 'A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association',
        start_date: '2025-11-28T09:00:00.000Z',
        end_date: '2025-11-30T18:00:00.000Z',
        venue: 'NAF Conference Centre, FCT, ABUJA',
        address: 'Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria',
        max_attendees: null,
        registration_deadline: '2025-11-25T23:59:59.000Z',
        price_ngn: 20000,
        early_bird_price_ngn: null,
        early_bird_deadline: null,
        is_virtual: false,
        image_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center',
        banner_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&h=400&fit=crop&crop=center',
        status: 'published',
        is_featured: true,
        requires_approval: false,
        registration_fields: ['full_name', 'email', 'phone', 'graduation_year', 'squadron', 'dietary_restrictions', 'special_requirements'],
        metadata: {
          organizer: 'ExJAM Association',
          contact_email: 'info@exjam.org.ng',
          contact_phone: '+234 901 234 5678'
        }
      })
    });

    if (insertEventResponse.ok) {
      console.log('✅ PG Conference event created');
    } else {
      const errorText = await insertEventResponse.text();
      console.log('⚠️ Event creation failed:', insertEventResponse.status, errorText);
    }

    // Step 3: Verify the event exists
    console.log('\n3️⃣ Verifying event...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.pg-conference-2025`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (verifyResponse.ok) {
      const events = await verifyResponse.json();
      if (events.length > 0) {
        console.log('✅ Event verified successfully!');
        console.log('📋 Title:', events[0].title);
        console.log('📋 Status:', events[0].status);
        console.log('📋 Price: ₦' + events[0].price_ngn?.toLocaleString());
      } else {
        console.log('❌ Event not found');
      }
    } else {
      console.log('❌ Verification failed:', verifyResponse.status);
    }

    console.log('\n🎉 Setup completed!');
    console.log('\n🔗 Test these URLs:');
    console.log('   • Event Page: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025');
    console.log('   • Registration: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025/register');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 You need to run the SQL commands manually in Supabase Dashboard > SQL Editor');
  }
}

setupViaREST();
