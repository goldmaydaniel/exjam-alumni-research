-- Create event-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Set up RLS policies for the bucket
CREATE POLICY "Public read access for event photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-photos');

CREATE POLICY "Authenticated users can upload event photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'event-photos');
