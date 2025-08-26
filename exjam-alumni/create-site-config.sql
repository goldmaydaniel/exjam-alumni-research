-- Create SiteConfig table for ExJAM Alumni application

-- Create SiteConfig table with proper structure
CREATE TABLE IF NOT EXISTS "SiteConfig" (
    id INT PRIMARY KEY DEFAULT 1,
    site_name VARCHAR(255) DEFAULT 'ExJAM Alumni Association',
    main_logo_url TEXT,
    footer_logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1e40af',
    secondary_color VARCHAR(7) DEFAULT '#3b82f6',
    hero_title TEXT DEFAULT 'Welcome to ExJAM Alumni',
    hero_subtitle TEXT DEFAULT 'Connecting Nigerian Air Force Academy Alumni',
    contact_email TEXT,
    contact_phone TEXT,
    social_facebook TEXT,
    social_twitter TEXT,
    social_linkedin TEXT,
    social_instagram TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO "SiteConfig" (
    id, site_name, hero_title, hero_subtitle,
    primary_color, secondary_color,
    contact_email, contact_phone
) VALUES (
    1, 'ExJAM Alumni Association',
    'Welcome to ExJAM Alumni',
    'Connecting Nigerian Air Force Academy Alumni',
    '#1e40af', '#3b82f6',
    'info@exjamalumni.org',
    '+234 801 234 5678'
) ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Enable RLS
ALTER TABLE "SiteConfig" ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view site config" ON "SiteConfig"
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON "SiteConfig" TO postgres;
GRANT SELECT ON "SiteConfig" TO authenticated, anon;

-- Set ownership
ALTER TABLE "SiteConfig" OWNER TO postgres;

SELECT 'SiteConfig table created successfully!' as status;