-- Phase C Updates: Invoices approval, HR Onboarding docs, Activities enhancements
-- Run this in your Supabase SQL editor

-- ============================================================
-- 1. INVOICES TABLE — add approval_status
-- ============================================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS approval_status  text  DEFAULT 'pending',   -- 'pending' | 'approved' | 'rejected'
  ADD COLUMN IF NOT EXISTS approved_by      uuid  REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at      timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ============================================================
-- 2. HR_ONBOARDING_DOCS TABLE (new)
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_onboarding_docs (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id  uuid        NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  doc_type      text        NOT NULL,  -- 'i9' | 'everify' | 'nca' | 'bgc' | 'offer_letter'
  status        text        DEFAULT 'pending',  -- 'pending' | 'uploaded' | 'verified' | 'rejected'
  file_url      text,
  file_name     text,
  notes         text,
  verified_by   uuid        REFERENCES auth.users(id),
  verified_at   timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (candidate_id, doc_type)
);

ALTER TABLE hr_onboarding_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_onboarding_docs_authenticated" ON hr_onboarding_docs;
CREATE POLICY "hr_onboarding_docs_authenticated"
  ON hr_onboarding_docs FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 3. CRM_ACTIVITIES TABLE — add hours, user assignment, reminders
-- ============================================================
ALTER TABLE crm_activities
  ADD COLUMN IF NOT EXISTS assigned_to   uuid        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_by   uuid        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS hours_logged  numeric(5,2),
  ADD COLUMN IF NOT EXISTS reminder_at   timestamptz,
  ADD COLUMN IF NOT EXISTS activity_date date        DEFAULT CURRENT_DATE;

-- ============================================================
-- 4. Supabase Storage bucket for HR docs (run once)
-- ============================================================
-- Run this separately in the Storage section or via SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('hr-docs', 'hr-docs', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policy — authenticated users can upload/read
-- DROP POLICY IF EXISTS "hr_docs_upload" ON storage.objects;
-- CREATE POLICY "hr_docs_upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'hr-docs' AND auth.role() = 'authenticated');
-- DROP POLICY IF EXISTS "hr_docs_read" ON storage.objects;
-- CREATE POLICY "hr_docs_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'hr-docs' AND auth.role() = 'authenticated');
-- DROP POLICY IF EXISTS "hr_docs_delete" ON storage.objects;
-- CREATE POLICY "hr_docs_delete" ON storage.objects
--   FOR DELETE USING (bucket_id = 'hr-docs' AND auth.role() = 'authenticated');
