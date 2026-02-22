-- ============================================================
-- Fix candidates table: add columns expected by the web app
-- The table was created with a different schema from the migration,
-- so we add the missing columns here to bring it in sync.
-- ============================================================

-- Add missing columns (safe with IF NOT EXISTS via DO block)
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS recruiter_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status public.candidate_status DEFAULT 'in_market',
  ADD COLUMN IF NOT EXISTS current_location TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS pay_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS resume_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Copy location → current_location where not already set
UPDATE public.candidates
SET current_location = location
WHERE current_location IS NULL AND location IS NOT NULL;

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
