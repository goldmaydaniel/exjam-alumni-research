
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Create User table
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT UNIQUE NOT NULL,
      "emailVerified" BOOLEAN DEFAULT false,
      "firstName" TEXT,
      "lastName" TEXT,
      "fullName" TEXT,
      "serviceNumber" TEXT,
      "set" TEXT,
      squadron TEXT,
      phone TEXT,
      chapter TEXT,
      role TEXT DEFAULT 'GUEST_MEMBER',
      "profilePhotoUrl" TEXT,
      "badgePhotoUrl" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create Event table
    CREATE TABLE IF NOT EXISTS "Event" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title TEXT NOT NULL,
      description TEXT,
      "shortDescription" TEXT,
      "startDate" TIMESTAMPTZ NOT NULL,
      "endDate" TIMESTAMPTZ,
      venue TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      price DECIMAL DEFAULT 0,
      capacity INTEGER DEFAULT 100,
      status TEXT DEFAULT 'DRAFT',
      "organizerId" TEXT,
      "imageUrl" TEXT,
      category TEXT,
      tags TEXT[],
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create Registration table
    CREATE TABLE IF NOT EXISTS "Registration" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
      "eventId" TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
      "ticketType" TEXT DEFAULT 'STANDARD',
      status TEXT DEFAULT 'PENDING',
      "ticketNumber" TEXT UNIQUE,
      "paymentReference" TEXT,
      amount DECIMAL DEFAULT 0,
      "checkedIn" BOOLEAN DEFAULT false,
      "checkinTime" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("userId", "eventId")
    );
    
    -- Create Ticket table
    CREATE TABLE IF NOT EXISTS "Ticket" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "registrationId" TEXT,
      "ticketNumber" TEXT UNIQUE NOT NULL,
      "qrCode" TEXT,
      "checkedIn" BOOLEAN DEFAULT false,
      "checkinTime" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create ContactMessage table
    CREATE TABLE IF NOT EXISTS "ContactMessage" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      "repliedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create SiteConfig table
    CREATE TABLE IF NOT EXISTS "SiteConfig" (
      id INTEGER PRIMARY KEY DEFAULT 1,
      "siteName" TEXT DEFAULT 'ExJAM Alumni Association',
      "siteDescription" TEXT,
      "contactEmail" TEXT DEFAULT 'info@exjam.org.ng',
      "contactPhone" TEXT,
      "mainLogoUrl" TEXT,
      "footerLogoUrl" TEXT,
      "faviconUrl" TEXT,
      "primaryColor" TEXT DEFAULT '#1e40af',
      "secondaryColor" TEXT DEFAULT '#3730a3',
      "registrationEnabled" BOOLEAN DEFAULT true,
      "eventsEnabled" BOOLEAN DEFAULT true,
      "paymentsEnabled" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT single_config CHECK (id = 1)
    );
    
    -- Create Waitlist table
    CREATE TABLE IF NOT EXISTS "Waitlist" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "eventId" TEXT,
      email TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      status TEXT DEFAULT 'WAITING',
      "notifiedAt" TIMESTAMPTZ,
      "convertedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "Waitlist" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "SiteConfig" ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "public_events_view" ON "Event" 
      FOR SELECT USING (status IN ('PUBLISHED', 'COMPLETED'));
    
    CREATE POLICY "service_role_all_users" ON "User" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_events" ON "Event" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_registrations" ON "Registration" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_tickets" ON "Ticket" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_messages" ON "ContactMessage" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_waitlist" ON "Waitlist" 
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY "service_role_all_siteconfig" ON "SiteConfig" 
      FOR ALL TO service_role USING (true);
    
    -- Grant permissions
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
    
    -- Insert admin user
    INSERT INTO "User" (email, "firstName", "lastName", "fullName", role, "emailVerified")
    VALUES ('admin@exjam.org.ng', 'Admin', 'User', 'Admin User', 'ADMIN', true)
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert test event
    INSERT INTO "Event" (title, "shortDescription", "startDate", "endDate", venue, city, state, price, capacity, status)
    VALUES (
      '2025 EXJAM Annual Convention',
      'Join us for the annual gathering of Ex-Junior Airmen',
      '2025-12-01 09:00:00+00',
      '2025-12-03 18:00:00+00',
      'Sheraton Hotel',
      'Abuja',
      'FCT',
      50000,
      500,
      'PUBLISHED'
    ) ON CONFLICT DO NOTHING;
    
-- Insert PG Conference 2025 Event
INSERT INTO "Event" (
  title, "shortDescription", description, "startDate", "endDate", 
  venue, address, capacity, price, 
  status, "imageUrl", tags
) VALUES (
  'PG Conference 2025',
  'Annual gathering of Ex-Junior Airmen - Celebrating excellence and brotherhood',
  'Join us for the most anticipated event of the year! The PG Conference 2025 brings together Ex-Junior Airmen from all squadrons for a weekend of networking, celebration, and strategic planning for our association''s future.

Event Highlights:
• Keynote addresses from distinguished alumni
• Panel discussions on career development
• Squadron reunions and networking sessions
• Awards and recognition ceremony
• Gala dinner and entertainment
• Strategic planning for 2026 initiatives',
  '2025-04-15 09:00:00+00',
  '2025-04-17 18:00:00+00',
  'Transcorp Hilton Hotel, Abuja',
  'Plot 1, Aguiyi Ironsi St, Maitama, Abuja FCT',
  1000,
  20000,
  'PUBLISHED',
  '/images/pg-conference-2025.jpg',
  ARRAY['conference', 'networking', 'reunion', 'annual-event', 'pg-conference']
) ON CONFLICT DO NOTHING;

-- Insert additional sample events
INSERT INTO "Event" (title, "shortDescription", "startDate", "endDate", venue, address, capacity, price, status, tags) VALUES 
  ('Squadron 213 Reunion', 'Special reunion for Squadron 213 members', '2025-02-20 10:00:00+00', '2025-02-20 18:00:00+00', 'NAF Officers Mess, Kaduna', 'NAF Base, Kaduna State', 200, 15000, 'PUBLISHED', ARRAY['squadron-213', 'reunion']),
  ('ExJAM Golf Tournament', 'Annual charity golf tournament', '2025-05-10 07:00:00+00', '2025-05-10 16:00:00+00', 'IBB International Golf Club, Abuja', 'Maitama District, Abuja FCT', 100, 30000, 'PUBLISHED', ARRAY['golf', 'charity', 'sports']),
  ('Leadership Summit 2025', 'Leadership development and mentorship program', '2025-06-05 09:00:00+00', '2025-06-06 17:00:00+00', 'Sheraton Lagos Hotel', '30 Mobolaji Bank Anthony Way, Ikeja, Lagos', 300, 25000, 'PUBLISHED', ARRAY['leadership', 'mentorship', 'development'])
ON CONFLICT DO NOTHING;
