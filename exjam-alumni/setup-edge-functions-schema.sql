-- Edge Functions Schema Updates
-- Run this to set up all required tables for Edge Functions integration

-- Notification logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "User"(id),
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL,
  external_id TEXT,
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badge access logs
CREATE TABLE IF NOT EXISTS badge_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT REFERENCES "Registration"(id),
  user_id TEXT REFERENCES "User"(id),
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT
);

-- Check-in logs
CREATE TABLE IF NOT EXISTS check_in_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT REFERENCES "Registration"(id),
  user_id TEXT REFERENCES "User"(id),
  event_id TEXT REFERENCES "Event"(id),
  admin_id TEXT REFERENCES "User"(id),
  location TEXT DEFAULT 'Main Entrance',
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT DEFAULT 'manual',
  metadata JSONB
);

-- Payment webhook logs
CREATE TABLE IF NOT EXISTS payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT REFERENCES "Registration"(id),
  webhook_event TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  amount DECIMAL(10,2),
  status TEXT NOT NULL,
  webhook_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update Registration table with new fields
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS badge_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS badge_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS qr_data TEXT;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS check_in_location TEXT;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS checked_in_by TEXT REFERENCES "User"(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_badge_access_logs_registration_id ON badge_access_logs(registration_id);
CREATE INDEX IF NOT EXISTS idx_badge_access_logs_accessed_at ON badge_access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS idx_check_in_logs_event_id ON check_in_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_check_in_logs_checked_in_at ON check_in_logs(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_reference ON payment_webhook_logs(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_processed_at ON payment_webhook_logs(processed_at);
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in ON "Registration"(checked_in);
CREATE INDEX IF NOT EXISTS idx_registrations_badge_generated ON "Registration"(badge_generated);

-- Add RLS policies for the new tables
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Notification logs policies
CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can view all notification logs" ON notification_logs
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT id FROM "User" WHERE role = 'ADMIN'
    )
  );

CREATE POLICY "Service role can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- Badge access logs policies
CREATE POLICY "Users can view their own badge access logs" ON badge_access_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can view all badge access logs" ON badge_access_logs
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT id FROM "User" WHERE role = 'ADMIN'
    )
  );

CREATE POLICY "Service role can insert badge access logs" ON badge_access_logs
  FOR INSERT WITH CHECK (true);

-- Check-in logs policies
CREATE POLICY "Users can view their own check-in logs" ON check_in_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all check-in logs" ON check_in_logs
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT id FROM "User" WHERE role = 'ADMIN'
    )
  );

-- Payment webhook logs policies (admin only)
CREATE POLICY "Admins can manage payment webhook logs" ON payment_webhook_logs
  FOR ALL USING (
    auth.uid()::text IN (
      SELECT id FROM "User" WHERE role = 'ADMIN'
    )
  );

CREATE POLICY "Service role can insert payment webhook logs" ON payment_webhook_logs
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON notification_logs TO authenticated;
GRANT ALL ON badge_access_logs TO authenticated;  
GRANT ALL ON check_in_logs TO authenticated;
GRANT ALL ON payment_webhook_logs TO authenticated;

GRANT ALL ON notification_logs TO service_role;
GRANT ALL ON badge_access_logs TO service_role;
GRANT ALL ON check_in_logs TO service_role;
GRANT ALL ON payment_webhook_logs TO service_role;