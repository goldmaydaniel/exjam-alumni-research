#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabase() {
  console.log('🔧 Setting up database via API...\n');

  try {
    // Step 1: Create events table
    console.log('1️⃣ Creating events table...');
    const createEventsTableSQL = `
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
    `;

    const { error: eventsError } = await supabase.rpc('exec_sql', { sql: createEventsTableSQL });
    
    if (eventsError) {
      console.log('⚠️ Events table creation error (might already exist):', eventsError.message);
    } else {
      console.log('✅ Events table created');
    }

    // Step 2: Create registrations table
    console.log('\n2️⃣ Creating registrations table...');
    const createRegistrationsTableSQL = `
      CREATE TABLE IF NOT EXISTS registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID,
        status VARCHAR(50) DEFAULT 'pending',
        registration_data JSONB DEFAULT '{}',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_reference VARCHAR(255),
        amount_paid INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(event_id, user_id)
      );
    `;

    const { error: registrationsError } = await supabase.rpc('exec_sql', { sql: createRegistrationsTableSQL });
    
    if (registrationsError) {
      console.log('⚠️ Registrations table creation error (might already exist):', registrationsError.message);
    } else {
      console.log('✅ Registrations table created');
    }

    // Step 3: Create PG Conference event
    console.log('\n3️⃣ Creating PG Conference event...');
    const insertEventSQL = `
      INSERT INTO events (
        id,
        title,
        description,
        short_description,
        start_date,
        end_date,
        venue,
        address,
        max_attendees,
        registration_deadline,
        price_ngn,
        early_bird_price_ngn,
        early_bird_deadline,
        is_virtual,
        image_url,
        banner_url,
        status,
        is_featured,
        requires_approval,
        registration_fields,
        metadata
      ) VALUES (
        'pg-conference-2025',
        'President General''s Conference - Maiden Flight',
        'This groundbreaking event marks a new milestone in the history of the ExJAM Association. For the first time ever, we are bringing together our members, leaders, and stakeholders to share ideas, build relationships, and shape the future of our association.',
        'A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association',
        '2025-11-28T09:00:00.000Z',
        '2025-11-30T18:00:00.000Z',
        'NAF Conference Centre, FCT, ABUJA',
        'Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria',
        NULL,
        '2025-11-25T23:59:59.000Z',
        20000,
        NULL,
        NULL,
        false,
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&h=400&fit=crop&crop=center',
        'published',
        true,
        false,
        '["full_name", "email", "phone", "graduation_year", "squadron", "dietary_restrictions", "special_requirements"]',
        '{"organizer": "ExJAM Association", "contact_email": "info@exjam.org.ng", "contact_phone": "+234 901 234 5678"}'
      ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        short_description = EXCLUDED.short_description,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        venue = EXCLUDED.venue,
        address = EXCLUDED.address,
        max_attendees = EXCLUDED.max_attendees,
        registration_deadline = EXCLUDED.registration_deadline,
        price_ngn = EXCLUDED.price_ngn,
        early_bird_price_ngn = EXCLUDED.early_bird_price_ngn,
        early_bird_deadline = EXCLUDED.early_bird_deadline,
        is_virtual = EXCLUDED.is_virtual,
        image_url = EXCLUDED.image_url,
        banner_url = EXCLUDED.banner_url,
        status = EXCLUDED.status,
        is_featured = EXCLUDED.is_featured,
        requires_approval = EXCLUDED.requires_approval,
        registration_fields = EXCLUDED.registration_fields,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
    `;

    const { error: insertError } = await supabase.rpc('exec_sql', { sql: insertEventSQL });
    
    if (insertError) {
      console.log('⚠️ Event insertion error:', insertError.message);
    } else {
      console.log('✅ PG Conference event created');
    }

    // Step 4: Verify setup
    console.log('\n4️⃣ Verifying setup...');
    const { data: events, error: verifyError } = await supabase
      .from('events')
      .select('*')
      .eq('id', 'pg-conference-2025')
      .single();

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Setup verified successfully!');
      console.log('📋 Event Title:', events.title);
      console.log('📋 Status:', events.status);
      console.log('📋 Price: ₦' + events.price_ngn?.toLocaleString());
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n🔗 Test these URLs:');
    console.log('   • Event Page: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025');
    console.log('   • Registration: https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025/register');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 Alternative: Run the SQL commands manually in Supabase Dashboard > SQL Editor');
  }
}

setupDatabase();
