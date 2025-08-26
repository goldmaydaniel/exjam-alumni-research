# 🔧 **Complete Setup Guide: Fix Registration Page Issue**

## 🎯 **Problem**
The registration page `https://exjam-alumni-dtvnbtltc-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025/register` is not loading because:
1. The `events` table doesn't exist in the database
2. The PG Conference event hasn't been created yet
3. The database schema needs to be set up

## ✅ **Solution: Complete Database Setup**

### **Step 1: Set Up Database Tables**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this SQL code:**

```sql
-- Setup Events Table for ExJAM Alumni Platform
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create event status enum
DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(255),
    address TEXT,
    location_coordinates POINT,
    max_attendees INTEGER,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    price_ngn INTEGER DEFAULT 0,
    early_bird_price_ngn INTEGER,
    early_bird_deadline TIMESTAMP WITH TIME ZONE,
    is_virtual BOOLEAN DEFAULT false,
    meeting_url TEXT,
    streaming_url TEXT,
    recording_url TEXT,
    image_url TEXT,
    banner_url TEXT,
    status event_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    registration_fields JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_price CHECK (price_ngn >= 0)
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    registration_data JSONB DEFAULT '{}',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_reference VARCHAR(255),
    amount_paid INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (status = 'published');

CREATE POLICY "Events can be created by authenticated users" ON events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Events can be updated by creator or admin" ON events
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM pg_roles r
            JOIN pg_auth_members m ON m.roleid = r.oid
            JOIN pg_roles u ON u.oid = m.member
            WHERE r.rolname = 'exjam_admin_role'
            AND u.rolname = auth.jwt() ->> 'email'
        )
    );

-- Create RLS policies for registrations
CREATE POLICY "Users can view their own registrations" ON registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create registrations" ON registrations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own registrations" ON registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
```

### **Step 2: Create Admin Role and User**

Run this SQL to set up admin access:

```sql
-- Create admin role
DO $$ BEGIN
    CREATE ROLE exjam_admin_role;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO exjam_admin_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO exjam_admin_role;
GRANT CREATE ON SCHEMA public TO exjam_admin_role;
GRANT USAGE ON SCHEMA public TO exjam_admin_role;

-- Grant access to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO exjam_admin_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO exjam_admin_role;

-- Assign role to user (after creating the user in Supabase Dashboard)
GRANT exjam_admin_role TO "goldmay@gmail.com";
```

### **Step 3: Create the PG Conference Event**

Run this SQL to create the event:

```sql
-- Insert PG Conference Event
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
    'This groundbreaking event marks a new milestone in the history of the ExJAM Association. For the first time ever, we are bringing together our members, leaders, and stakeholders to share ideas, build relationships, and shape the future of our association.

**Event Highlights:**
• Opening Ceremony with Past President General Muhammed Sani Abdullahi
• Leadership Development Sessions
• Networking Opportunities
• Strategic Planning Workshops
• Gala Dinner & Awards Ceremony

**Theme:** "Strive to Excel" - Continuing the legacy of excellence from AFMS Jos

This is not just a conference; it''s the beginning of a new chapter in ExJAM''s journey toward greater unity, leadership, and impact.',
    'A historic gathering of ExJAM alumni, leaders, and stakeholders to shape the future of our association',
    '2025-11-28T09:00:00.000Z',
    '2025-11-30T18:00:00.000Z',
    'NAF Conference Centre, FCT, ABUJA',
    'Nigerian Air Force Conference Centre, Abuja, Federal Capital Territory, Nigeria',
    NULL, -- Unlimited attendees
    '2025-11-25T23:59:59.000Z',
    20000, -- ₦20,000
    NULL, -- No early bird pricing
    NULL,
    false,
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&h=400&fit=crop&crop=center',
    'published',
    true,
    false,
    '["full_name", "email", "phone", "graduation_year", "squadron", "dietary_restrictions", "special_requirements"]',
    '{
        "organizer": "ExJAM Association",
        "contact_email": "info@exjam.org.ng",
        "contact_phone": "+234 901 234 5678",
        "refund_policy": "Full refund available until November 20, 2025",
        "includes": [
            "Conference materials and welcome package",
            "All sessions and workshops",
            "Networking lunch and coffee breaks",
            "Gala dinner on November 29th",
            "Certificate of participation",
            "Digital badge for social media"
        ],
        "schedule": [
            {
                "day": "Day 1 - November 28, 2025",
                "events": [
                    "09:00 - 10:00: Registration & Welcome Coffee",
                    "10:00 - 11:00: Opening Ceremony",
                    "11:00 - 12:30: Keynote: Past President General Muhammed Sani Abdullahi",
                    "12:30 - 14:00: Networking Lunch",
                    "14:00 - 16:00: Leadership Development Workshop",
                    "16:00 - 18:00: Strategic Planning Session"
                ]
            },
            {
                "day": "Day 2 - November 29, 2025",
                "events": [
                    "09:00 - 10:30: Alumni Success Stories Panel",
                    "10:30 - 12:00: Professional Development Workshop",
                    "12:00 - 13:30: Lunch & Networking",
                    "13:30 - 16:00: Chapter Development & Collaboration",
                    "16:00 - 18:00: Free Time / Optional Activities",
                    "19:00 - 22:00: Gala Dinner & Awards Ceremony"
                ]
            },
            {
                "day": "Day 3 - November 30, 2025",
                "events": [
                    "09:00 - 10:30: Future Vision & Action Planning",
                    "10:30 - 12:00: Closing Ceremony & Commitments",
                    "12:00 - 13:00: Farewell Lunch",
                    "13:00 - 14:00: Group Photo & Departure"
                ]
            }
        ],
        "tags": ["conference", "leadership", "networking", "alumni", "maiden-flight"]
    }'
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
```

### **Step 4: Create Admin Dashboard View**

```sql
-- Create admin dashboard view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.events) as total_events,
    (SELECT COUNT(*) FROM public.registrations) as total_registrations,
    (SELECT COUNT(*) FROM public.events WHERE status = 'published') as published_events,
    (SELECT COUNT(*) FROM public.registrations WHERE status = 'confirmed') as confirmed_registrations;

GRANT SELECT ON admin_dashboard_stats TO exjam_admin_role;
```

### **Step 5: Create User in Supabase Dashboard**

1. **Go to Supabase Dashboard > Authentication > Users**
2. **Click "Add User"**
3. **Enter:**
   - Email: `goldmay@gmail.com`
   - Password: (create a strong password)
   - Check "Auto-confirm user"
4. **Click "Create User"**

### **Step 6: Verify Setup**

Run this verification query:

```sql
-- Verify event exists
SELECT id, title, status, price_ngn, venue FROM events WHERE id = 'pg-conference-2025';

-- Verify admin role
SELECT 
    r.rolname as role_name,
    u.rolname as user_name
FROM pg_roles r
JOIN pg_auth_members m ON m.roleid = r.oid
JOIN pg_roles u ON u.oid = m.member
WHERE r.rolname = 'exjam_admin_role'
AND u.rolname = 'goldmay@gmail.com';

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('events', 'registrations');
```

## 🎉 **Expected Results**

After completing all steps:

### **✅ Working URLs:**
- **Event Page**: `https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025`
- **Registration Page**: `https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/events/pg-conference-2025/register`
- **Admin Dashboard**: `https://exjam-alumni-ed0gao5ph-gms-projects-06b0f5db.vercel.app/admin-dashboard`

### **✅ Features Available:**
- Event registration form
- Payment integration
- Admin dashboard with statistics
- User management
- Event management

## 🚨 **Troubleshooting**

### **If registration page still doesn't load:**
1. **Check browser console** for JavaScript errors
2. **Verify event exists** in database
3. **Check API routes** are working
4. **Clear browser cache** and try again

### **If admin dashboard doesn't work:**
1. **Verify user exists** in Supabase Auth
2. **Check admin role** is assigned correctly
3. **Test login** with correct credentials

## 📞 **Support**

If you encounter issues:
1. **Check Supabase logs** for database errors
2. **Verify all SQL commands** executed successfully
3. **Test each step** individually
4. **Contact support** with specific error messages

---

**✅ After completing these steps, your registration page should work perfectly!**
