-- LoopFix AI — Supabase PostgreSQL Schema
-- Run this SQL in your Supabase SQL Editor to create the required table

CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  normalized_description TEXT,
  category VARCHAR(50) DEFAULT 'Other' CHECK (category IN ('Water', 'Electricity', 'Wi-Fi', 'Sanitation', 'Safety', 'Classroom', 'Other')),
  location TEXT,
  building VARCHAR(100),
  floor VARCHAR(50),
  urgency VARCHAR(20) DEFAULT 'Medium' CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
  department VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
  ai_title VARCHAR(200),
  next_action TEXT,
  raw_ai_response JSONB,
  is_demo BOOLEAN DEFAULT false,
  recurring_match_ids TEXT[] DEFAULT '{}',
  recurring_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS complaints_category_idx ON complaints(category);
CREATE INDEX IF NOT EXISTS complaints_status_idx ON complaints(status);
CREATE INDEX IF NOT EXISTS complaints_urgency_idx ON complaints(urgency);
CREATE INDEX IF NOT EXISTS complaints_created_at_idx ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS complaints_location_idx ON complaints(location);
CREATE INDEX IF NOT EXISTS complaints_is_demo_idx ON complaints(is_demo);

-- Enable Row Level Security (optional — adjust to your auth setup)
-- ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (hackathon mode)
-- CREATE POLICY "allow_all" ON complaints FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
