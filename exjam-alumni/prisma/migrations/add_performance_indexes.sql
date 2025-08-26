-- Performance optimization indexes
-- Add these indexes to improve query performance

-- User table optimizations
CREATE INDEX IF NOT EXISTS "User_fullName_idx" ON "User" ("fullName");
CREATE INDEX IF NOT EXISTS "User_firstName_lastName_idx" ON "User" ("firstName", "lastName");
CREATE INDEX IF NOT EXISTS "User_company_idx" ON "User" ("company");
CREATE INDEX IF NOT EXISTS "User_currentOccupation_idx" ON "User" ("currentOccupation");
CREATE INDEX IF NOT EXISTS "User_chapter_idx" ON "User" ("chapter");
CREATE INDEX IF NOT EXISTS "User_emailVerified_status_idx" ON "User" ("emailVerified", "status");

-- Event table optimizations
CREATE INDEX IF NOT EXISTS "Event_title_idx" ON "Event" USING gin (to_tsvector('english', "title"));
CREATE INDEX IF NOT EXISTS "Event_description_idx" ON "Event" USING gin (to_tsvector('english', "description"));
CREATE INDEX IF NOT EXISTS "Event_price_idx" ON "Event" ("price");
CREATE INDEX IF NOT EXISTS "Event_status_startDate_endDate_idx" ON "Event" ("status", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "Event_tags_idx" ON "Event" USING gin ("tags");

-- Registration table optimizations  
CREATE INDEX IF NOT EXISTS "Registration_eventId_userId_idx" ON "Registration" ("eventId", "userId");
CREATE INDEX IF NOT EXISTS "Registration_ticketType_idx" ON "Registration" ("ticketType");
CREATE INDEX IF NOT EXISTS "Registration_createdAt_status_idx" ON "Registration" ("createdAt", "status");

-- Payment table optimizations
CREATE INDEX IF NOT EXISTS "Payment_provider_idx" ON "Payment" ("provider");
CREATE INDEX IF NOT EXISTS "Payment_currency_idx" ON "Payment" ("currency");
CREATE INDEX IF NOT EXISTS "Payment_amount_idx" ON "Payment" ("amount");
CREATE INDEX IF NOT EXISTS "Payment_status_userId_idx" ON "Payment" ("status", "userId");

-- Ticket table optimizations
CREATE INDEX IF NOT EXISTS "Ticket_qrCode_idx" ON "Ticket" ("qrCode");
CREATE INDEX IF NOT EXISTS "Ticket_userId_eventId_idx" ON "Ticket" ("userId", "eventId");

-- AuditLog table optimizations
CREATE INDEX IF NOT EXISTS "AuditLog_action_timestamp_idx" ON "AuditLog" ("action", "timestamp");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_timestamp_idx" ON "AuditLog" ("entity", "timestamp");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_timestamp_idx" ON "AuditLog" ("userId", "timestamp");

-- Notification table optimizations
CREATE INDEX IF NOT EXISTS "Notification_type_read_idx" ON "Notification" ("type", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_type_idx" ON "Notification" ("userId", "type");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_read_idx" ON "Notification" ("createdAt", "read");

-- ContactMessage table optimizations
CREATE INDEX IF NOT EXISTS "ContactMessage_status_createdAt_idx" ON "ContactMessage" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_subject_idx" ON "ContactMessage" USING gin (to_tsvector('english', "subject"));
CREATE INDEX IF NOT EXISTS "ContactMessage_message_idx" ON "ContactMessage" USING gin (to_tsvector('english', "message"));

-- Composite indexes for common query patterns

-- Events with registrations count
CREATE INDEX IF NOT EXISTS "Event_registration_count_idx" ON "Event" ("id", "status", "startDate") 
  WHERE "status" IN ('PUBLISHED', 'COMPLETED');

-- Active users with profile data
CREATE INDEX IF NOT EXISTS "User_active_profile_idx" ON "User" ("status", "role", "graduationYear", "squadron")
  WHERE "status" = 'ACTIVE';

-- Recent registrations for events
CREATE INDEX IF NOT EXISTS "Registration_recent_event_idx" ON "Registration" ("eventId", "createdAt", "status")
  WHERE "createdAt" >= NOW() - INTERVAL '30 days';

-- Payment success tracking
CREATE INDEX IF NOT EXISTS "Payment_success_tracking_idx" ON "Payment" ("status", "createdAt", "amount")
  WHERE "status" = 'SUCCESS';

-- Partial indexes for better performance on filtered queries

-- Only index active users
CREATE INDEX IF NOT EXISTS "User_active_only_email_idx" ON "User" ("email") 
  WHERE "status" = 'ACTIVE';

-- Only index published events
CREATE INDEX IF NOT EXISTS "Event_published_only_date_idx" ON "Event" ("startDate", "endDate") 
  WHERE "status" = 'PUBLISHED';

-- Only index confirmed registrations
CREATE INDEX IF NOT EXISTS "Registration_confirmed_only_idx" ON "Registration" ("eventId", "userId", "createdAt")
  WHERE "status" = 'CONFIRMED';

-- Full-text search indexes (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS "User_search_idx" ON "User" 
  USING gin (to_tsvector('english', "firstName" || ' ' || "lastName" || ' ' || COALESCE("company", '') || ' ' || COALESCE("currentOccupation", '')));

CREATE INDEX IF NOT EXISTS "Event_search_idx" ON "Event"
  USING gin (to_tsvector('english', "title" || ' ' || COALESCE("description", '') || ' ' || "venue"));

-- Statistics and analytics indexes
CREATE INDEX IF NOT EXISTS "Registration_analytics_idx" ON "Registration" ("eventId", "status", "ticketType", "createdAt");
CREATE INDEX IF NOT EXISTS "Payment_analytics_idx" ON "Payment" ("status", "currency", "amount", "createdAt");
CREATE INDEX IF NOT EXISTS "User_demographics_idx" ON "User" ("squadron", "graduationYear", "currentLocation", "role", "status");

-- Performance monitoring indexes
CREATE INDEX IF NOT EXISTS "AuditLog_performance_idx" ON "AuditLog" ("timestamp", "action") 
  WHERE "timestamp" >= NOW() - INTERVAL '24 hours';

-- Cleanup support indexes
CREATE INDEX IF NOT EXISTS "AuditLog_cleanup_idx" ON "AuditLog" ("timestamp") 
  WHERE "timestamp" < NOW() - INTERVAL '90 days';

CREATE INDEX IF NOT EXISTS "Notification_cleanup_idx" ON "Notification" ("read", "readAt") 
  WHERE "read" = true AND "readAt" < NOW() - INTERVAL '30 days';

-- Update table statistics
ANALYZE "User";
ANALYZE "Event";
ANALYZE "Registration";
ANALYZE "Payment";
ANALYZE "Ticket";
ANALYZE "AuditLog";
ANALYZE "Notification";
ANALYZE "Waitlist";
ANALYZE "ContactMessage";
ANALYZE "SiteConfig";