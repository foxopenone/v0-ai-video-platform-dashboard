-- Table to track Step Review jobs and receive Bible-ready callbacks from n8n
CREATE TABLE IF NOT EXISTS step_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  job_record_id TEXT,
  lock_token TEXT,
  bible_r2_key TEXT,
  project_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by job_id
CREATE INDEX IF NOT EXISTS idx_step_reviews_job_id ON step_reviews(job_id);
-- Index for fast lookup by user_id + status
CREATE INDEX IF NOT EXISTS idx_step_reviews_user_status ON step_reviews(user_id, status);

-- Allow public access for the callback API route (n8n will POST here)
ALTER TABLE step_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read their own rows
CREATE POLICY "Users can read own reviews" ON step_reviews
  FOR SELECT USING (true);

-- Policy: allow insert from API routes (service role)
CREATE POLICY "Service role can insert" ON step_reviews
  FOR INSERT WITH CHECK (true);

-- Policy: allow update from API routes (service role) 
CREATE POLICY "Service role can update" ON step_reviews
  FOR UPDATE USING (true);
