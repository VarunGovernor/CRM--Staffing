-- Create employee-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('employee-files', 'employee-files', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload/read their own files
DROP POLICY IF EXISTS "employee_files_upload" ON storage.objects;
CREATE POLICY "employee_files_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'employee-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "employee_files_read" ON storage.objects;
CREATE POLICY "employee_files_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'employee-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
