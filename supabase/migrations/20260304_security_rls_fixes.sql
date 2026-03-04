-- ================================================================
-- Security Fix: Replace overly permissive USING(true) RLS policies
-- Affected tables: crm_activities, daily_clock_logs
-- ================================================================

-- ───────────────────────────────────────────────────────────────
-- 1. crm_activities
--    Before: any authenticated user could CRUD any activity
--    After:  staff roles can read all; only creator or admin can mutate
-- ───────────────────────────────────────────────────────────────

-- Add ownership column so rows can be tied back to a user
ALTER TABLE public.crm_activities
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Drop the permissive catch-all policy
DROP POLICY IF EXISTS "Authenticated users can manage crm_activities" ON public.crm_activities;

-- Staff can read all CRM activities (shared view across the team)
CREATE POLICY "staff_read_crm_activities"
  ON public.crm_activities FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'recruiter', 'sales', 'hr', 'finance'])
  );

-- Staff can insert their own activities
CREATE POLICY "staff_insert_crm_activities"
  ON public.crm_activities FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'recruiter', 'sales', 'hr', 'finance'])
    AND (created_by = auth.uid() OR created_by IS NULL)
  );

-- Only the creator or an admin can update an activity
CREATE POLICY "creator_or_admin_update_crm_activities"
  ON public.crm_activities FOR UPDATE TO authenticated
  USING (
    public.has_any_role(ARRAY['admin'])
    OR created_by = auth.uid()
    OR created_by IS NULL  -- allow updating legacy rows that pre-date this column
  );

-- Only admins can delete activities (protect audit trail)
CREATE POLICY "admin_delete_crm_activities"
  ON public.crm_activities FOR DELETE TO authenticated
  USING (
    public.has_any_role(ARRAY['admin'])
  );


-- ───────────────────────────────────────────────────────────────
-- 2. daily_clock_logs
--    Before: any authenticated user could CRUD any time log (payroll fraud risk)
--    After:  HR/Finance/Admin manage all; employees read own placement logs only
-- ───────────────────────────────────────────────────────────────

-- Drop the permissive catch-all policy
DROP POLICY IF EXISTS "Authenticated users can manage daily_clock_logs" ON public.daily_clock_logs;

-- HR, Finance, and Admin can fully manage all clock logs (for payroll processing)
CREATE POLICY "hr_finance_admin_manage_clock_logs"
  ON public.daily_clock_logs FOR ALL TO authenticated
  USING (
    public.has_any_role(ARRAY['admin', 'hr', 'finance'])
  )
  WITH CHECK (
    public.has_any_role(ARRAY['admin', 'hr', 'finance'])
  );

-- Employees can read their own placement's clock logs
-- (matched by email since daily_clock_logs links to placements → candidates)
CREATE POLICY "employee_read_own_clock_logs"
  ON public.daily_clock_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.placements p
      JOIN public.candidates c ON c.id = p.candidate_id
      WHERE p.id = daily_clock_logs.placement_id
        AND c.email = auth.email()
    )
  );
