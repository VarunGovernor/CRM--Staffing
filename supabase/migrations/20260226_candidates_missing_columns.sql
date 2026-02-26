-- ============================================================
-- Add missing columns to candidates table
-- Fixes "Could not find column in schema cache" errors
-- ============================================================

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS full_name        TEXT,
  ADD COLUMN IF NOT EXISTS alternate_phone  TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth    DATE,
  ADD COLUMN IF NOT EXISTS full_address     TEXT,
  ADD COLUMN IF NOT EXISTS visa_copy_url    TEXT,
  ADD COLUMN IF NOT EXISTS relocation_places TEXT,
  ADD COLUMN IF NOT EXISTS deal_type        TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms    TEXT,
  ADD COLUMN IF NOT EXISTS nca_document_url TEXT;

-- Back-fill full_name from first_name + last_name for existing rows
UPDATE public.candidates
SET full_name = TRIM(CONCAT(first_name, ' ', last_name))
WHERE full_name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- ============================================================
-- Storage policies: allow all authenticated users to manage
-- candidate documents stored under the candidate-docs/ prefix
-- ============================================================

DROP POLICY IF EXISTS "candidate_docs_insert" ON storage.objects;
CREATE POLICY "candidate_docs_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'employee-files'
    AND (storage.foldername(name))[1] = 'candidate-docs'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "candidate_docs_select" ON storage.objects;
CREATE POLICY "candidate_docs_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'employee-files'
    AND (storage.foldername(name))[1] = 'candidate-docs'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "candidate_docs_delete" ON storage.objects;
CREATE POLICY "candidate_docs_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'employee-files'
    AND (storage.foldername(name))[1] = 'candidate-docs'
    AND auth.role() = 'authenticated'
  );

-- Reload PostgREST schema cache so new columns are immediately visible
NOTIFY pgrst, 'reload schema';
