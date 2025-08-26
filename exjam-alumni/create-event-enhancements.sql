-- Event feedback system
CREATE TABLE IF NOT EXISTS event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  feedback_type VARCHAR(50) DEFAULT 'general', -- general, speaker, venue, content
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event resources (documents, presentations, recordings)
CREATE TABLE IF NOT EXISTS event_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL, -- presentation, document, video, audio, link
  resource_url VARCHAR(500),
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  is_public BOOLEAN DEFAULT true,
  requires_registration BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  uploaded_by TEXT REFERENCES "User"(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event sessions/agenda items
CREATE TABLE IF NOT EXISTS event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  speaker_name VARCHAR(255),
  speaker_bio TEXT,
  speaker_photo VARCHAR(500),
  session_type VARCHAR(50) DEFAULT 'presentation', -- presentation, workshop, panel, break
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255),
  max_attendees INTEGER,
  is_mandatory BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event attendance tracking for sessions
CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  registration_id TEXT REFERENCES "Registration"(id) ON DELETE CASCADE,
  attendance_status VARCHAR(20) DEFAULT 'registered', -- registered, attended, no_show
  checked_in_at TIMESTAMP WITH TIME ZONE,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_session_user UNIQUE (session_id, user_id)
);

-- Event Q&A system
CREATE TABLE IF NOT EXISTS event_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT REFERENCES "Event"(id) ON DELETE CASCADE,
  session_id UUID REFERENCES event_sessions(id),
  user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by TEXT REFERENCES "User"(id),
  answered_at TIMESTAMP WITH TIME ZONE,
  is_anonymous BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending', -- pending, answered, dismissed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_feedback_event_id ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user_id ON event_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_rating ON event_feedback(rating);

CREATE INDEX IF NOT EXISTS idx_event_resources_event_id ON event_resources(event_id);
CREATE INDEX IF NOT EXISTS idx_event_resources_type ON event_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_event_resources_public ON event_resources(is_public);

CREATE INDEX IF NOT EXISTS idx_event_sessions_event_id ON event_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sessions_start_time ON event_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_user ON session_attendance(user_id);

CREATE INDEX IF NOT EXISTS idx_event_qa_event_id ON event_qa(event_id);
CREATE INDEX IF NOT EXISTS idx_event_qa_session_id ON event_qa(session_id);
CREATE INDEX IF NOT EXISTS idx_event_qa_status ON event_qa(status);