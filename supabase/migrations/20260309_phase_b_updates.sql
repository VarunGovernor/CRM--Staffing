-- Phase B Updates: Recruiter Goals table
-- Run this in your Supabase SQL editor

-- ============================================================
-- 1. RECRUITER_GOALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recruiter_goals (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id        uuid        UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  -- NULL recruiter_id = default/global targets
  submissions_target  int         DEFAULT 10,
  interviews_target   int         DEFAULT 3,
  placements_target   int         DEFAULT 1,
  ft_apps_target      int         DEFAULT 2,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE recruiter_goals ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS "admin_full_recruiter_goals" ON recruiter_goals;
CREATE POLICY "admin_full_recruiter_goals"
  ON recruiter_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Recruiters can read their own goals
DROP POLICY IF EXISTS "recruiter_read_own_goals" ON recruiter_goals;
CREATE POLICY "recruiter_read_own_goals"
  ON recruiter_goals FOR SELECT
  USING (
    recruiter_id = auth.uid()
    OR recruiter_id IS NULL  -- global defaults are readable by all
  );

-- ============================================================
-- 2. Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_recruiter_goals_updated_at ON recruiter_goals;
CREATE TRIGGER set_recruiter_goals_updated_at
  BEFORE UPDATE ON recruiter_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. Insert default global targets row (recruiter_id = NULL)
-- ============================================================
INSERT INTO recruiter_goals (recruiter_id, submissions_target, interviews_target, placements_target, ft_apps_target)
VALUES (NULL, 10, 3, 1, 2)
ON CONFLICT (recruiter_id) DO NOTHING;
