-- Add pipeline_stage column to candidates
-- This stores the hiring pipeline stage separately from the candidate's general status
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'applied';

-- Backfill pipeline_stage from existing status values
UPDATE candidates SET pipeline_stage = CASE status
  WHEN 'in_market' THEN 'applied'
  WHEN 'active'    THEN 'screening'
  WHEN 'on_hold'   THEN 'interview'
  WHEN 'placed'    THEN 'hired'
  ELSE 'applied'
END
WHERE pipeline_stage IS NULL OR pipeline_stage = 'applied';

-- Add UPDATE policy so staff can move candidates between pipeline stages
DROP POLICY IF EXISTS "staff_update_candidates" ON candidates;
CREATE POLICY "staff_update_candidates" ON candidates
  FOR UPDATE
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
