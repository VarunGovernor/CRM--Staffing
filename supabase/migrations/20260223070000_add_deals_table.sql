-- Create deals table for the Sales Pipeline
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  account_name TEXT,
  value NUMERIC(12, 2) DEFAULT 0,
  owner_name TEXT,
  owner_avatar TEXT,
  close_date DATE,
  priority TEXT DEFAULT 'Medium',
  probability INTEGER DEFAULT 50,
  stage TEXT NOT NULL DEFAULT 'new',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Drop old policy if it exists (safe to re-run)
DROP POLICY IF EXISTS "deals_authenticated_all" ON deals;
DROP POLICY IF EXISTS "deals_staff_all" ON deals;

-- Staff roles can do everything with deals
CREATE POLICY "deals_staff_all" ON deals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'hr', 'recruiter', 'sales', 'finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'hr', 'recruiter', 'sales', 'finance')
    )
  );
