CREATE TABLE IF NOT EXISTS bible_callbacks (
  id SERIAL PRIMARY KEY,
  job_id TEXT NOT NULL,
  job_record_id TEXT NOT NULL,
  lock_token TEXT DEFAULT '',
  bible_r2_key TEXT NOT NULL,
  status TEXT DEFAULT 'S3_Bible_Check',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bible_callbacks_job_id ON bible_callbacks(job_id);
