-- ============================================================
-- RLS Policies for CRM tables: candidates, placements, invoices
-- These tables had RLS enabled but no policies (blocking all reads)
-- ============================================================

-- ── candidates ───────────────────────────────────────────────
-- Staff roles can see all candidates
DROP POLICY IF EXISTS "staff_view_candidates" ON candidates;
CREATE POLICY "staff_view_candidates" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'hr', 'recruiter', 'sales', 'finance')
    )
  );

-- A candidate can see their own record (matched by email)
-- Use auth.email() instead of subquery on auth.users (authenticated role cannot query auth.users directly)
DROP POLICY IF EXISTS "candidate_view_own" ON candidates;
CREATE POLICY "candidate_view_own" ON candidates
  FOR SELECT USING (email = auth.email());

-- ── placements ───────────────────────────────────────────────
-- Staff roles can see all placements
DROP POLICY IF EXISTS "staff_view_placements" ON placements;
CREATE POLICY "staff_view_placements" ON placements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'hr', 'recruiter', 'sales', 'finance')
    )
  );

-- A candidate can see their own placements
DROP POLICY IF EXISTS "candidate_view_own_placements" ON placements;
CREATE POLICY "candidate_view_own_placements" ON placements
  FOR SELECT USING (
    candidate_id IN (
      SELECT candidate_id FROM candidates
      WHERE email = auth.email()
    )
  );

-- ── invoices ─────────────────────────────────────────────────
-- Staff roles can see all invoices
DROP POLICY IF EXISTS "staff_view_invoices" ON invoices;
CREATE POLICY "staff_view_invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'hr', 'recruiter', 'sales', 'finance')
    )
  );

-- A candidate can see invoices for their own placements
DROP POLICY IF EXISTS "candidate_view_own_invoices" ON invoices;
CREATE POLICY "candidate_view_own_invoices" ON invoices
  FOR SELECT USING (
    placement_id IN (
      SELECT p.placement_id FROM placements p
      JOIN candidates c ON c.candidate_id = p.candidate_id
      WHERE c.email = auth.email()
    )
  );
