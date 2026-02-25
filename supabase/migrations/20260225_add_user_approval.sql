-- ================================================================
-- Add admin approval layer to user_profiles
-- ================================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_role TEXT; -- role the user picked at signup, before admin confirms

-- Existing users and admins are auto-approved
UPDATE public.user_profiles
  SET is_approved = true, approved_at = created_at
  WHERE role = 'admin' OR is_active = true;
