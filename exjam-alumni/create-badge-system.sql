-- Badge templates for different event types
CREATE TABLE IF NOT EXISTS badge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  canvas_design_url VARCHAR(500), -- URL to Canva design or uploaded template
  template_data JSONB, -- Store design elements, positioning, colors, etc.
  template_type VARCHAR(50) DEFAULT 'event', -- event, conference, workshop, vip
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES "User"(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated badges for specific events and users
CREATE TABLE IF NOT EXISTS event_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  registration_id TEXT REFERENCES "Registration"(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  template_id UUID REFERENCES badge_templates(id),
  
  -- Badge content
  display_name VARCHAR(255),
  title VARCHAR(255), -- job title or role
  company VARCHAR(255),
  badge_type VARCHAR(50) DEFAULT 'attendee', -- attendee, speaker, vip, organizer, sponsor
  
  -- QR code data
  qr_code_data TEXT NOT NULL, -- JSON with user/event/registration info
  qr_code_url VARCHAR(500), -- Generated QR code image URL
  
  -- Badge file URLs
  badge_image_url VARCHAR(500), -- Final badge image
  badge_pdf_url VARCHAR(500), -- Printable PDF version
  
  -- Status and tracking
  status VARCHAR(20) DEFAULT 'generated', -- generated, printed, distributed, scanned
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  distributed_at TIMESTAMP WITH TIME ZONE,
  first_scan_at TIMESTAMP WITH TIME ZONE,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  scan_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_event_user_badge UNIQUE (event_id, user_id)
);

-- Badge check-in/scan logs
CREATE TABLE IF NOT EXISTS badge_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID REFERENCES event_badges(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  session_id UUID REFERENCES event_sessions(id), -- Optional: specific session check-in
  
  -- Scan details
  scan_type VARCHAR(50) DEFAULT 'checkin', -- checkin, checkout, session_entry, session_exit
  scan_location VARCHAR(255), -- entrance, session_hall_a, networking_area, etc.
  scanned_by TEXT REFERENCES "User"(id), -- Admin/volunteer who scanned
  
  -- Device/location info
  scanner_device VARCHAR(255),
  scanner_location JSONB, -- GPS coordinates if available
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timing
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional data
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Badge design elements (for custom Canva-like editor)
CREATE TABLE IF NOT EXISTS badge_design_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES badge_templates(id) ON DELETE CASCADE,
  
  -- Element properties
  element_type VARCHAR(50) NOT NULL, -- text, image, qr_code, logo, shape
  element_name VARCHAR(100), -- name, title, company, qr_code, etc.
  
  -- Position and size
  x_position INTEGER DEFAULT 0,
  y_position INTEGER DEFAULT 0,
  width INTEGER DEFAULT 100,
  height INTEGER DEFAULT 50,
  z_index INTEGER DEFAULT 1,
  
  -- Styling
  font_family VARCHAR(100),
  font_size INTEGER,
  font_weight VARCHAR(20),
  color VARCHAR(7), -- hex color
  background_color VARCHAR(7),
  border_width INTEGER DEFAULT 0,
  border_color VARCHAR(7),
  border_radius INTEGER DEFAULT 0,
  
  -- Content
  static_content TEXT, -- For static text elements
  dynamic_field VARCHAR(100), -- Maps to user fields: firstName, lastName, company, etc.
  
  -- Image/asset URLs
  asset_url VARCHAR(500),
  
  -- Visibility and conditions
  is_visible BOOLEAN DEFAULT true,
  display_conditions JSONB, -- Show/hide based on badge_type, user_role, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badge generation queue for batch processing
CREATE TABLE IF NOT EXISTS badge_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  template_id UUID REFERENCES badge_templates(id),
  
  -- Batch info
  batch_name VARCHAR(255),
  total_badges INTEGER DEFAULT 0,
  processed_badges INTEGER DEFAULT 0,
  failed_badges INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  badge_types TEXT[], -- Filter by badge types
  user_roles TEXT[], -- Filter by user roles
  include_unregistered BOOLEAN DEFAULT false,
  
  -- Results
  generated_badge_urls TEXT[],
  error_log TEXT,
  
  created_by TEXT REFERENCES "User"(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_badge_templates_type ON badge_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_badge_templates_active ON badge_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_event_badges_event ON event_badges(event_id);
CREATE INDEX IF NOT EXISTS idx_event_badges_user ON event_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_event_badges_registration ON event_badges(registration_id);
CREATE INDEX IF NOT EXISTS idx_event_badges_status ON event_badges(status);
CREATE INDEX IF NOT EXISTS idx_event_badges_type ON event_badges(badge_type);

CREATE INDEX IF NOT EXISTS idx_badge_scans_badge ON badge_scans(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_scans_event ON badge_scans(event_id);
CREATE INDEX IF NOT EXISTS idx_badge_scans_session ON badge_scans(session_id);
CREATE INDEX IF NOT EXISTS idx_badge_scans_type ON badge_scans(scan_type);
CREATE INDEX IF NOT EXISTS idx_badge_scans_time ON badge_scans(scanned_at);

CREATE INDEX IF NOT EXISTS idx_badge_elements_template ON badge_design_elements(template_id);
CREATE INDEX IF NOT EXISTS idx_badge_elements_type ON badge_design_elements(element_type);

CREATE INDEX IF NOT EXISTS idx_badge_queue_event ON badge_generation_queue(event_id);
CREATE INDEX IF NOT EXISTS idx_badge_queue_status ON badge_generation_queue(status);