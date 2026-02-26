-- ─────────────────────────────────────────────────────────────────
-- vendors: add all columns used by the CRM frontend
-- Safe to run multiple times (IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS website         TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms   TEXT,
  ADD COLUMN IF NOT EXISTS ai_score        INTEGER DEFAULT NULL,   -- 0-100
  ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS placement_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_payment_days INTEGER DEFAULT NULL;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
