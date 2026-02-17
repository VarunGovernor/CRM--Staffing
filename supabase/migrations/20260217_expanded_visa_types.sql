-- Expanded Visa Status Types
-- Adds: us_citizen, h4_ead, tn_visa, e3, gc_ead, no_work_auth
-- Renames: citizen -> us_citizen (kept for backwards compatibility)

ALTER TYPE public.visa_status ADD VALUE IF NOT EXISTS 'us_citizen';
ALTER TYPE public.visa_status ADD VALUE IF NOT EXISTS 'h4_ead';
ALTER TYPE public.visa_status ADD VALUE IF NOT EXISTS 'tn_visa';
ALTER TYPE public.visa_status ADD VALUE IF NOT EXISTS 'e3';
ALTER TYPE public.visa_status ADD VALUE IF NOT EXISTS 'gc_ead';
ALTER TYPE public.visa_status ADD VALUE IF NOT EXISTS 'no_work_auth';

-- Migrate existing 'citizen' entries to 'us_citizen'
UPDATE public.candidates SET visa_status = 'us_citizen' WHERE visa_status = 'citizen';
