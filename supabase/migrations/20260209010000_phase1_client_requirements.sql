-- Phase 1: Client-Requested Schema Changes
-- Deal types, payment terms, name consolidation, NCA workflow, submission template, timesheets

-- 1. NEW ENUM TYPES

DROP TYPE IF EXISTS public.deal_type CASCADE;
CREATE TYPE public.deal_type AS ENUM ('full_time', 'w2', 'c2c');

DROP TYPE IF EXISTS public.location_type CASCADE;
CREATE TYPE public.location_type AS ENUM ('remote', 'onsite', 'hybrid');

DROP TYPE IF EXISTS public.submission_source CASCADE;
CREATE TYPE public.submission_source AS ENUM ('direct', 'indeed', 'glassdoor', 'linkedin', 'dice', 'ziprecruiter', 'other');

DROP TYPE IF EXISTS public.nca_status CASCADE;
CREATE TYPE public.nca_status AS ENUM ('not_started', 'downloaded', 'uploaded', 'verified');

-- 2. CANDIDATES TABLE CHANGES
-- Add full_name, deal_type, payment_terms, nca fields
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS deal_type public.deal_type,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS nca_status public.nca_status DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS nca_document_url TEXT,
  ADD COLUMN IF NOT EXISTS nca_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nca_verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Backfill full_name from existing first_name + last_name
UPDATE public.candidates
SET full_name = TRIM(CONCAT(first_name, ' ', last_name))
WHERE full_name IS NULL;

-- Make full_name NOT NULL after backfill
ALTER TABLE public.candidates ALTER COLUMN full_name SET NOT NULL;

-- 3. SUBMISSIONS TABLE CHANGES
-- Add template fields: technology, vendor contact info, location, source
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS technology TEXT,
  ADD COLUMN IF NOT EXISTS vendor_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS vendor_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS vendor_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS location_type public.location_type DEFAULT 'remote',
  ADD COLUMN IF NOT EXISTS location_detail TEXT,
  ADD COLUMN IF NOT EXISTS submission_source public.submission_source DEFAULT 'direct';

-- 4. COMPLIANCE - NCA DOCUMENT TEMPLATE
-- Add nca form type to the enum
ALTER TYPE public.compliance_form_type ADD VALUE IF NOT EXISTS 'nca';

-- 5. TIMESHEETS TABLE (for C2C candidates)
CREATE TABLE IF NOT EXISTS public.timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    placement_id UUID REFERENCES public.placements(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    hours_worked DECIMAL(10, 2),
    screenshot_url TEXT,
    notes TEXT,
    submitted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timesheets_candidate ON public.timesheets(candidate_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_placement ON public.timesheets(placement_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_period ON public.timesheets(period_start, period_end);

-- 6. RLS for timesheets
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_access_timesheets" ON public.timesheets;
CREATE POLICY "staff_access_timesheets"
ON public.timesheets
FOR ALL
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'finance', 'hr']))
WITH CHECK (public.has_any_role(ARRAY['admin', 'finance', 'hr']));

-- Candidates can view/insert their own timesheets
DROP POLICY IF EXISTS "candidate_own_timesheets" ON public.timesheets;
CREATE POLICY "candidate_own_timesheets"
ON public.timesheets
FOR SELECT
TO authenticated
USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "candidate_submit_timesheets" ON public.timesheets;
CREATE POLICY "candidate_submit_timesheets"
ON public.timesheets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. INDEX on candidates.nca_status for compliance queries
CREATE INDEX IF NOT EXISTS idx_candidates_nca_status ON public.candidates(nca_status);
CREATE INDEX IF NOT EXISTS idx_candidates_deal_type ON public.candidates(deal_type);
CREATE INDEX IF NOT EXISTS idx_submissions_source ON public.submissions(submission_source);

-- 8. Phase 2 stubs (table for recruiter targets - created now for schema readiness)
-- TODO: Phase 2 - Recruiter performance targets
CREATE TABLE IF NOT EXISTS public.recruiter_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL DEFAULT 'weekly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    target_submissions INTEGER DEFAULT 0,
    target_placements INTEGER DEFAULT 0,
    target_revenue DECIMAL(12, 2) DEFAULT 0,
    actual_submissions INTEGER DEFAULT 0,
    actual_placements INTEGER DEFAULT 0,
    actual_revenue DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.recruiter_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_targets" ON public.recruiter_targets;
CREATE POLICY "admin_manage_targets"
ON public.recruiter_targets
FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "users_view_own_targets" ON public.recruiter_targets;
CREATE POLICY "users_view_own_targets"
ON public.recruiter_targets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
