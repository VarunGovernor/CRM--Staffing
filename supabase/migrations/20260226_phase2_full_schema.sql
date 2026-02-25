-- ================================================================
-- PHASE 2 — Full schema expansion
-- Covers: submissions, vendors, documents, AI layer,
--         invoice workflow, activity tracking, user sessions
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- 1. SUBMISSIONS — add salesperson tracking + form fields
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS submission_owner UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_name TEXT,          -- replaces free-text "source"
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,         -- e.g. "Net-30", "Weekly"
  ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS technology TEXT[];          -- structured array instead of CSV

-- Back-fill submission_owner from sales_person_id where set
UPDATE public.submissions
  SET submission_owner = sales_person_id
  WHERE submission_owner IS NULL AND sales_person_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────
-- 2. VENDORS — expand contact + scoring fields
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT NULL,  -- 0-100, AI generated
  ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS placement_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_payment_days INTEGER DEFAULT NULL;

-- ────────────────────────────────────────────────────────────────
-- 3. CANDIDATE DOCUMENTS — secure file attachments per candidate
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,  -- 'resume','visa','passport','dl','lca','nda','offer_letter','i9','everify','handbook','timesheet','other'
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,   -- Supabase storage path
  file_size_bytes BIGINT,
  mime_type TEXT,
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  signed_by TEXT,               -- signer name from e-sign provider
  esign_envelope_id TEXT,       -- DocuSign/SignNow envelope ID
  esign_provider TEXT,          -- 'docusign' | 'signnow'
  esign_status TEXT DEFAULT 'none', -- 'none'|'sent'|'viewed'|'signed'|'declined'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate ON public.candidate_documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_type ON public.candidate_documents(document_type);

-- ────────────────────────────────────────────────────────────────
-- 4. INVOICE WORKFLOW — approval + locking
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS placement_id UUID REFERENCES public.placements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS bill_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS approved_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS pdf_path TEXT;            -- Supabase storage path for generated PDF

-- ────────────────────────────────────────────────────────────────
-- 5. USER ACTIVITY LOGS — login timer + screen time tracking
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  active_duration_seconds INTEGER,   -- computed on session end
  idle_duration_seconds INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  alert_type TEXT NOT NULL,   -- 'failed_login' | 'lockout' | 'suspicious_ip'
  attempt_count INTEGER DEFAULT 1,
  ip_address TEXT,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_email ON public.security_alerts(email);

-- ────────────────────────────────────────────────────────────────
-- 6. AI INTELLIGENCE TABLES
-- ────────────────────────────────────────────────────────────────

-- Candidate match scores against deals
CREATE TABLE IF NOT EXISTS public.ai_candidate_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  skill_overlap_score INTEGER,
  visa_fit_score INTEGER,
  rate_fit_score INTEGER,
  location_score INTEGER,
  pipeline_stage_score INTEGER,
  explanation JSONB,            -- { matched_skills: [], gaps: [], notes: "" }
  top_ranked BOOLEAN DEFAULT false,
  calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  model_version TEXT DEFAULT 'v1'
);

CREATE INDEX IF NOT EXISTS idx_ai_candidate_scores_candidate ON public.ai_candidate_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_candidate_scores_deal ON public.ai_candidate_scores(deal_id);
CREATE INDEX IF NOT EXISTS idx_ai_candidate_scores_score ON public.ai_candidate_scores(score DESC);

-- Vendor performance scores
CREATE TABLE IF NOT EXISTS public.ai_vendor_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  submission_to_interview_ratio DECIMAL(5,2),
  interview_to_placement_ratio DECIMAL(5,2),
  total_revenue DECIMAL(12,2),
  avg_payment_delay_days INTEGER,
  risk_flag BOOLEAN DEFAULT false,
  high_performer_flag BOOLEAN DEFAULT false,
  calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id)
);

-- Recruiter efficiency scores
CREATE TABLE IF NOT EXISTS public.ai_recruiter_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  submissions_count INTEGER DEFAULT 0,
  placements_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  avg_time_to_fill_days INTEGER,
  efficiency_score INTEGER CHECK (efficiency_score BETWEEN 0 AND 100),
  burnout_risk_flag BOOLEAN DEFAULT false,
  calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recruiter_id, period_start, period_end)
);

-- Revenue forecasts
CREATE TABLE IF NOT EXISTS public.ai_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  horizon TEXT NOT NULL,        -- '30d' | '60d' | '90d'
  forecasted_revenue DECIMAL(12,2),
  revenue_at_risk DECIMAL(12,2),
  weighted_pipeline_value DECIMAL(12,2),
  coverage_ratio DECIMAL(5,2),
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  input_snapshot JSONB,
  calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(forecast_date, horizon)
);

-- AI operation audit trail
CREATE TABLE IF NOT EXISTS public.ai_match_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,      -- 'candidate_match' | 'vendor_score' | 'forecast' | 'automation'
  triggered_by UUID REFERENCES public.user_profiles(id),
  triggered_by_event TEXT,      -- 'candidate_update' | 'deal_update' | 'scheduled'
  input_summary JSONB,
  output_summary JSONB,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_match_logs_operation ON public.ai_match_logs(operation);
CREATE INDEX IF NOT EXISTS idx_ai_match_logs_created ON public.ai_match_logs(created_at DESC);

-- ────────────────────────────────────────────────────────────────
-- 7. RLS POLICIES — all new tables
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_candidate_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_vendor_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recruiter_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_match_logs ENABLE ROW LEVEL SECURITY;

-- candidate_documents: staff can view, recruiter/admin can upload
CREATE POLICY "Staff can view candidate documents"
  ON public.candidate_documents FOR SELECT
  USING (public.user_has_role(auth.uid(), ARRAY['admin','recruiter','hr','sales','finance']));

CREATE POLICY "Recruiters and admins can insert documents"
  ON public.candidate_documents FOR INSERT
  WITH CHECK (public.user_has_role(auth.uid(), ARRAY['admin','recruiter','hr']));

CREATE POLICY "Admins can update documents"
  ON public.candidate_documents FOR UPDATE
  USING (public.user_has_role(auth.uid(), ARRAY['admin','hr']));

-- user_activity_logs: users see own, admins see all
CREATE POLICY "Users see own activity"
  ON public.user_activity_logs FOR SELECT
  USING (user_id = auth.uid() OR public.user_has_role(auth.uid(), ARRAY['admin']));

CREATE POLICY "System can insert activity logs"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.user_has_role(auth.uid(), ARRAY['admin']));

-- security_alerts: admin only
CREATE POLICY "Admins can view security alerts"
  ON public.security_alerts FOR ALL
  USING (public.user_has_role(auth.uid(), ARRAY['admin']));

-- AI tables: admin + relevant roles can view
CREATE POLICY "Staff can view candidate scores"
  ON public.ai_candidate_scores FOR SELECT
  USING (public.user_has_role(auth.uid(), ARRAY['admin','recruiter','sales']));

CREATE POLICY "Staff can view vendor scores"
  ON public.ai_vendor_scores FOR SELECT
  USING (public.user_has_role(auth.uid(), ARRAY['admin','sales','recruiter']));

CREATE POLICY "Staff can view recruiter metrics"
  ON public.ai_recruiter_metrics FOR SELECT
  USING (
    recruiter_id = auth.uid()
    OR public.user_has_role(auth.uid(), ARRAY['admin'])
  );

CREATE POLICY "Admin can view forecasts"
  ON public.ai_forecasts FOR SELECT
  USING (public.user_has_role(auth.uid(), ARRAY['admin','finance']));

CREATE POLICY "Admin can view AI logs"
  ON public.ai_match_logs FOR SELECT
  USING (public.user_has_role(auth.uid(), ARRAY['admin']));

-- System (service role) can write to all AI tables via backend workers
-- These are controlled at the backend level using the service role key

-- ────────────────────────────────────────────────────────────────
-- 8. AI SCORING FUNCTION — candidate match (PostgreSQL baseline)
--    Full ML scoring runs in background workers; this is a fast
--    lightweight SQL fallback for synchronous queries.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_candidate_match_score(
  p_candidate_id UUID,
  p_required_skills TEXT[],
  p_visa_types TEXT[],
  p_max_rate DECIMAL,
  p_location TEXT
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_candidate RECORD;
  v_score INTEGER := 0;
  v_skill_match DECIMAL;
  v_candidate_skills TEXT[];
BEGIN
  SELECT * INTO v_candidate FROM public.candidates WHERE id = p_candidate_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  v_candidate_skills := v_candidate.skills;

  -- Skill overlap (40 pts)
  IF array_length(p_required_skills, 1) > 0 THEN
    SELECT COUNT(*)::DECIMAL / array_length(p_required_skills, 1)
    INTO v_skill_match
    FROM unnest(p_required_skills) rs
    WHERE rs = ANY(v_candidate_skills);
    v_score := v_score + ROUND(v_skill_match * 40);
  END IF;

  -- Visa compatibility (20 pts)
  IF p_visa_types IS NULL OR array_length(p_visa_types, 1) = 0
     OR v_candidate.visa_status::TEXT = ANY(p_visa_types) THEN
    v_score := v_score + 20;
  END IF;

  -- Rate fit (20 pts) — full score if candidate rate ≤ max_rate
  IF p_max_rate IS NULL OR v_candidate.pay_rate IS NULL THEN
    v_score := v_score + 10; -- neutral
  ELSIF v_candidate.pay_rate <= p_max_rate THEN
    v_score := v_score + 20;
  ELSIF v_candidate.pay_rate <= p_max_rate * 1.1 THEN
    v_score := v_score + 10; -- within 10% tolerance
  END IF;

  -- Location (10 pts)
  IF p_location IS NULL OR p_location = '' THEN
    v_score := v_score + 5; -- neutral
  ELSIF v_candidate.current_location ILIKE '%' || p_location || '%' THEN
    v_score := v_score + 10;
  ELSIF v_candidate.willing_to_relocate THEN
    v_score := v_score + 5;
  END IF;

  -- Pipeline stage weighting (10 pts) — prefer candidates in_market
  v_score := v_score + CASE v_candidate.status::TEXT
    WHEN 'in_market' THEN 10
    WHEN 'active'    THEN 6
    WHEN 'on_hold'   THEN 2
    ELSE 0
  END;

  RETURN LEAST(v_score, 100);
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 9. EVENT AUTOMATION TRIGGERS (DB-level, lightweight)
--    Heavy automation runs in background workers; these handle
--    critical synchronous events only.
-- ────────────────────────────────────────────────────────────────

-- Auto-update vendor stats when submissions change
CREATE OR REPLACE FUNCTION public.refresh_vendor_submission_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.vendors
  SET submission_count = (
    SELECT COUNT(*) FROM public.submissions
    WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
  )
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vendor_submission_count ON public.submissions;
CREATE TRIGGER trg_vendor_submission_count
  AFTER INSERT OR UPDATE OR DELETE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.refresh_vendor_submission_count();

-- Auto-update vendor placement count
CREATE OR REPLACE FUNCTION public.refresh_vendor_placement_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.vendors
  SET placement_count = (
    SELECT COUNT(*) FROM public.placements
    WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
  )
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vendor_placement_count ON public.placements;
CREATE TRIGGER trg_vendor_placement_count
  AFTER INSERT OR UPDATE OR DELETE ON public.placements
  FOR EACH ROW EXECUTE FUNCTION public.refresh_vendor_placement_count();
