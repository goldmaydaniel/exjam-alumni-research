-- Create ContactMessage table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ContactMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ContactMessage
CREATE INDEX IF NOT EXISTS "ContactMessage_status_idx" ON "ContactMessage" (status);
CREATE INDEX IF NOT EXISTS "ContactMessage_email_idx" ON "ContactMessage" (email);
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage" ("createdAt");

-- Enable RLS for ContactMessage
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ContactMessage
-- Policy for admins to view all messages
CREATE POLICY "Admins can view all contact messages" ON "ContactMessage"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Policy for admins to update messages
CREATE POLICY "Admins can update contact messages" ON "ContactMessage"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Policy for admins to delete messages
CREATE POLICY "Admins can delete contact messages" ON "ContactMessage"
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Policy for anyone to insert messages (public contact form)
CREATE POLICY "Anyone can submit contact messages" ON "ContactMessage"
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create updated_at trigger for ContactMessage
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ContactMessage_updated_at
    BEFORE UPDATE ON "ContactMessage"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure SiteConfig table exists with proper structure
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS social_twitter TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS enable_registration BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS enable_events BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS enable_payments BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'paystack';
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS smtp_host TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS smtp_user TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS smtp_from TEXT;

-- Insert default SiteConfig if it doesn't exist
INSERT INTO "SiteConfig" (id, site_name)
VALUES (1, 'ExJAM Alumni Association')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for SiteConfig
ALTER TABLE "SiteConfig" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for SiteConfig
-- Policy for anyone to view site config
CREATE POLICY "Anyone can view site config" ON "SiteConfig"
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy for admins to update site config
CREATE POLICY "Admins can update site config" ON "SiteConfig"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Create AuditLog table for tracking admin actions
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    "entityId" TEXT,
    metadata JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create indexes for AuditLog
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog" ("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_idx" ON "AuditLog" (entity);
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");

-- Enable RLS for AuditLog
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view audit logs
CREATE POLICY "Admins can view audit logs" ON "AuditLog"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User".id = auth.uid()
            AND "User".role IN ('ADMIN', 'ORGANIZER')
        )
    );

-- Policy for system to insert audit logs
CREATE POLICY "System can insert audit logs" ON "AuditLog"
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create function to check if user is admin
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

-- Create function to log admin actions
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
        auth.uid(),
        p_action,
        p_entity,
        p_entity_id,
        p_metadata,
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM "User") as total_users,
    (SELECT COUNT(*) FROM "User" WHERE "emailVerified" = true) as verified_users,
    (SELECT COUNT(*) FROM "Event" WHERE status = 'PUBLISHED') as active_events,
    (SELECT COUNT(*) FROM "Registration") as total_registrations,
    (SELECT COUNT(*) FROM "ContactMessage" WHERE status = 'pending') as pending_messages,
    (SELECT COUNT(*) FROM "Payment" WHERE status = 'SUCCESS') as successful_payments,
    (SELECT COALESCE(SUM(amount), 0) FROM "Payment" WHERE status = 'SUCCESS') as total_revenue;

-- Grant access to the view
GRANT SELECT ON admin_dashboard_stats TO authenticated;

COMMENT ON TABLE "ContactMessage" IS 'Stores contact form submissions from the website';
COMMENT ON TABLE "AuditLog" IS 'Tracks all admin actions for security and compliance';
COMMENT ON VIEW admin_dashboard_stats IS 'Aggregated statistics for the admin dashboard';