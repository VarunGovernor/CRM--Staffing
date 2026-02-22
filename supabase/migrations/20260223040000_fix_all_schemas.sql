-- 1. CANDIDATES: add id UUID, full_name, deal_type
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'w2';

UPDATE public.candidates SET id = gen_random_uuid() WHERE id IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='candidates_id_unique' AND conrelid='public.candidates'::regclass) THEN
    ALTER TABLE public.candidates ADD CONSTRAINT candidates_id_unique UNIQUE (id);
  END IF;
END $$;

UPDATE public.candidates
SET full_name = trim(coalesce(first_name,'') || ' ' || coalesce(last_name,''))
WHERE full_name IS NULL;

-- 2. PLACEMENTS: add id, status, end_date, job_title, client_name, location, duration_months, created_at, vendor_id
ALTER TABLE public.placements
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS status public.placement_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS duration_months INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.placements SET id = gen_random_uuid() WHERE id IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='placements_id_unique' AND conrelid='public.placements'::regclass) THEN
    ALTER TABLE public.placements ADD CONSTRAINT placements_id_unique UNIQUE (id);
  END IF;
END $$;

UPDATE public.placements p SET client_name = c.client_name
FROM public.clients c WHERE p.client_id = c.client_id AND p.client_name IS NULL;

-- 3. INVOICES: add id, invoice_number, invoice_date, period_start/end, hours_worked, gross_earnings, deductions, net_pay, candidate_id, created_by
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_date DATE,
  ADD COLUMN IF NOT EXISTS period_start DATE,
  ADD COLUMN IF NOT EXISTS period_end DATE,
  ADD COLUMN IF NOT EXISTS hours_worked NUMERIC,
  ADD COLUMN IF NOT EXISTS gross_earnings NUMERIC,
  ADD COLUMN IF NOT EXISTS deductions NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_pay NUMERIC,
  ADD COLUMN IF NOT EXISTS candidate_id TEXT REFERENCES public.candidates(candidate_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

UPDATE public.invoices SET id = gen_random_uuid() WHERE id IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='invoices_id_unique' AND conrelid='public.invoices'::regclass) THEN
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_id_unique UNIQUE (id);
  END IF;
END $$;

UPDATE public.invoices SET
  invoice_number = invoice_id,
  invoice_date   = due_date,
  hours_worked   = total_hours,
  gross_earnings = total_hours * bill_rate,
  net_pay        = total_amount,
  period_start   = to_date(invoice_month, 'Mon-YYYY'),
  period_end     = (to_date(invoice_month, 'Mon-YYYY') + INTERVAL '1 month - 1 day')::DATE
WHERE invoice_month IS NOT NULL;

UPDATE public.invoices i SET candidate_id = p.candidate_id
FROM public.placements p WHERE i.placement_id = p.placement_id AND i.candidate_id IS NULL;

-- 4. SUBMISSIONS: add submission_source, technology; FK to candidates(id) NOT VALID
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS submission_source TEXT DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS technology TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='submissions_candidate_id_fkey' AND conrelid='public.submissions'::regclass) THEN
    ALTER TABLE public.submissions ADD CONSTRAINT submissions_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) NOT VALID;
  END IF;
END $$;

-- 5. INTERVIEWS: FK to candidates(id) NOT VALID
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='interviews_candidate_id_fkey' AND conrelid='public.interviews'::regclass) THEN
    ALTER TABLE public.interviews ADD CONSTRAINT interviews_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) NOT VALID;
  END IF;
END $$;

-- 6. TIMESHEETS: add id, candidate_id, period_start/end, is_approved, approved_by/at, submitted_by, screenshot_url, notes
ALTER TABLE public.timesheets
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS candidate_id UUID,
  ADD COLUMN IF NOT EXISTS period_start DATE,
  ADD COLUMN IF NOT EXISTS period_end DATE,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.timesheets SET id = gen_random_uuid() WHERE id IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='timesheets_id_unique' AND conrelid='public.timesheets'::regclass) THEN
    ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_id_unique UNIQUE (id);
  END IF;
END $$;

UPDATE public.timesheets SET period_start = week_start, period_end = week_end
WHERE period_start IS NULL AND week_start IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='timesheets_candidate_id_fkey' AND conrelid='public.timesheets'::regclass) THEN
    ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) NOT VALID;
  END IF;
END $$;

-- 7. RLS: fix tables with no policies
DROP POLICY IF EXISTS "staff_view_clients" ON public.clients;
CREATE POLICY "staff_view_clients" ON public.clients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin','hr','recruiter','sales','finance'))
);

DROP POLICY IF EXISTS "staff_view_recruiters" ON public.recruiters;
CREATE POLICY "staff_view_recruiters" ON public.recruiters FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin','hr','recruiter','sales','finance'))
);

DROP POLICY IF EXISTS "staff_manage_timesheets" ON public.timesheets;
CREATE POLICY "staff_manage_timesheets" ON public.timesheets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin','hr','finance'))
);

DROP POLICY IF EXISTS "candidate_view_own_timesheets" ON public.timesheets;
CREATE POLICY "candidate_view_own_timesheets" ON public.timesheets FOR SELECT USING (candidate_id = auth.uid());

-- 8. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
