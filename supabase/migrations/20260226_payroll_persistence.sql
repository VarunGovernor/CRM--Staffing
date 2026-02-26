-- ================================================================
-- Payroll persistence
-- 1. Add paid_amount + payroll_status to placements
-- 2. Add daily_clock_logs for the Daily Timesheet Logs tab
-- ================================================================

-- 1. Payroll tracking on placements
ALTER TABLE public.placements
  ADD COLUMN IF NOT EXISTS paid_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payroll_status TEXT          NOT NULL DEFAULT 'Pending';

-- 2. Daily clock-in / clock-out log
CREATE TABLE IF NOT EXISTS public.daily_clock_logs (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID    REFERENCES public.placements(id) ON DELETE CASCADE,
  employee_name TEXT,
  log_date     DATE    NOT NULL DEFAULT CURRENT_DATE,
  check_in     TIME,
  check_out    TIME,
  status       TEXT    NOT NULL DEFAULT 'Not Started',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(placement_id, log_date)
);

ALTER TABLE public.daily_clock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can manage daily_clock_logs"
  ON public.daily_clock_logs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
