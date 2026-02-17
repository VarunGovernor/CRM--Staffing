-- Production Hardening Migration
-- Fixes: RLS policy gaps, missing indexes, CASCADE risks, constraints

-- ============================================================
-- 1. FIX OVERLY PERMISSIVE RLS POLICIES
-- ============================================================

-- Notifications: Restrict INSERT so users can only create notifications
-- for the system (admins/hr) or as part of legitimate workflows.
-- The old policy allowed ANY user to insert notifications for ANY other user.
DROP POLICY IF EXISTS "authenticated_insert_notifications" ON public.notifications;
CREATE POLICY "authenticated_insert_notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can insert notifications targeted at themselves
  user_id = auth.uid()
  -- OR admins/hr can insert notifications for anyone
  OR public.has_any_role(ARRAY['admin', 'hr'])
);

-- Audit Logs: Restrict INSERT so the user_id matches the authenticated user.
-- Prevents spoofing audit entries as another user.
DROP POLICY IF EXISTS "authenticated_insert_audit" ON public.audit_logs;
CREATE POLICY "authenticated_insert_audit"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_role('admin')
);

-- ============================================================
-- 2. FIX VENDOR CASCADE DELETE RISK
-- ============================================================
-- Change placements.vendor_id from CASCADE to SET NULL
-- so deleting a vendor doesn't destroy placement records.

ALTER TABLE public.placements
  DROP CONSTRAINT IF EXISTS placements_vendor_id_fkey;

ALTER TABLE public.placements
  ADD CONSTRAINT placements_vendor_id_fkey
  FOREIGN KEY (vendor_id)
  REFERENCES public.vendors(id)
  ON DELETE SET NULL;

-- Also make vendor_id nullable since SET NULL requires it
ALTER TABLE public.placements
  ALTER COLUMN vendor_id DROP NOT NULL;

-- Same fix for submissions.vendor_id
ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_vendor_id_fkey;

ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_vendor_id_fkey
  FOREIGN KEY (vendor_id)
  REFERENCES public.vendors(id)
  ON DELETE SET NULL;

ALTER TABLE public.submissions
  ALTER COLUMN vendor_id DROP NOT NULL;

-- ============================================================
-- 3. ADD MISSING INDEXES
-- ============================================================

-- Submissions: sales_person_id is used in JOINs and filters
CREATE INDEX IF NOT EXISTS idx_submissions_sales_person_id
  ON public.submissions(sales_person_id);

-- Timesheets: filter by approval status
CREATE INDEX IF NOT EXISTS idx_timesheets_approved
  ON public.timesheets(approved_by, is_approved);

-- Audit logs: filter by module for admin views
CREATE INDEX IF NOT EXISTS idx_audit_logs_module
  ON public.audit_logs(module);

-- Audit logs: compound index for user + timestamp queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp
  ON public.audit_logs(user_id, timestamp DESC);

-- ============================================================
-- 4. ADD DATA INTEGRITY CONSTRAINTS
-- ============================================================

-- Placements: end_date must be >= start_date
ALTER TABLE public.placements
  ADD CONSTRAINT chk_placement_dates
  CHECK (end_date IS NULL OR end_date >= start_date);

-- Placements: bill_rate must be >= pay_rate (margin must be positive)
ALTER TABLE public.placements
  ADD CONSTRAINT chk_placement_rates
  CHECK (bill_rate >= pay_rate);

-- Timesheets: period_end must be >= period_start
ALTER TABLE public.timesheets
  ADD CONSTRAINT chk_timesheet_period
  CHECK (period_end >= period_start);

-- Invoices: period_end must be >= period_start
ALTER TABLE public.invoices
  ADD CONSTRAINT chk_invoice_period
  CHECK (period_end >= period_start);
