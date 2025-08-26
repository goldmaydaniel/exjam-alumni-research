-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all contact messages" ON "ContactMessage";
DROP POLICY IF EXISTS "Admins can update contact messages" ON "ContactMessage";
DROP POLICY IF EXISTS "Admins can delete contact messages" ON "ContactMessage";
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON "ContactMessage";

-- Create RLS policies for ContactMessage with proper UUID casting
CREATE POLICY "Admins can view all contact messages" ON "ContactMessage"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

CREATE POLICY "Admins can update contact messages" ON "ContactMessage"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

CREATE POLICY "Admins can delete contact messages" ON "ContactMessage"
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

CREATE POLICY "Anyone can submit contact messages" ON "ContactMessage"
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create SiteConfig table properly
CREATE TABLE IF NOT EXISTS "SiteConfig" (
    id INTEGER PRIMARY KEY DEFAULT 1,
    site_name TEXT DEFAULT 'ExJAM Alumni Association',
    main_logo_url TEXT,
    footer_logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#1e40af',
    secondary_color TEXT DEFAULT '#3b82f6',
    hero_title TEXT DEFAULT 'Welcome to ExJAM Alumni',
    hero_subtitle TEXT,
    about_text TEXT,
    contact_email TEXT DEFAULT 'info@exjam.org.ng',
    contact_phone TEXT,
    social_facebook TEXT,
    social_twitter TEXT,
    social_linkedin TEXT,
    enable_registration BOOLEAN DEFAULT true,
    enable_events BOOLEAN DEFAULT true,
    enable_payments BOOLEAN DEFAULT true,
    payment_provider TEXT DEFAULT 'paystack',
    smtp_host TEXT,
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_from TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT site_config_single_row CHECK (id = 1)
);

-- Insert default SiteConfig if it doesn't exist
INSERT INTO "SiteConfig" (id, site_name)
VALUES (1, 'ExJAM Alumni Association')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for SiteConfig
ALTER TABLE "SiteConfig" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view site config" ON "SiteConfig";
DROP POLICY IF EXISTS "Admins can update site config" ON "SiteConfig";

-- Create RLS policies for SiteConfig
CREATE POLICY "Anyone can view site config" ON "SiteConfig"
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admins can update site config" ON "SiteConfig"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Fix AuditLog table
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view audit logs" ON "AuditLog";
DROP POLICY IF EXISTS "System can insert audit logs" ON "AuditLog";

-- Create RLS policies for AuditLog with proper UUID casting
CREATE POLICY "Admins can view audit logs" ON "AuditLog"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()::text
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

CREATE POLICY "System can insert audit logs" ON "AuditLog"
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Recreate the admin check function with proper UUID handling
CREATE OR REPLACE FUNCTION is_admin(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "User"
        WHERE id = user_id
        AND role IN ('ADMIN', 'ORGANIZER')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the audit log function with proper UUID handling
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_entity TEXT,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    INSERT INTO "AuditLog" (
        "userId",
        action,
        entity,
        "entityId",
        metadata,
        "createdAt"
    )
    VALUES (
        auth.uid()::text,
        p_action,
        p_entity,
        p_entity_id,
        p_metadata,
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ContactMessage', 'SiteConfig', 'AuditLog');