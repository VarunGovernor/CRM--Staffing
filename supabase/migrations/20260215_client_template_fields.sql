-- ============================================================
-- Migration: Client Template Field Additions
-- Date: 2026-02-15
-- Description: Adds missing fields per client template specs
--   - Candidate: alternate_phone, emergency_contact, full_address,
--                visa_copy_url, relocation_places, date_of_birth
--   - Submissions: client_name
--   - Interviews: technology, client_name
--   - Placements: technology, final_interview_date, final_interview_time,
--                 vendor_contact_name, vendor_contact_details, client_address, offer_type
-- ============================================================

-- ===================== CANDIDATES =====================
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS alternate_phone TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS full_address TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS visa_copy_url TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS relocation_places TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- ===================== SUBMISSIONS =====================
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS client_name TEXT;

-- ===================== INTERVIEWS =====================
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS technology TEXT;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS client_name TEXT;

-- ===================== PLACEMENTS =====================
ALTER TABLE placements ADD COLUMN IF NOT EXISTS technology TEXT;
ALTER TABLE placements ADD COLUMN IF NOT EXISTS final_interview_date DATE;
ALTER TABLE placements ADD COLUMN IF NOT EXISTS final_interview_time TEXT;
ALTER TABLE placements ADD COLUMN IF NOT EXISTS vendor_contact_name TEXT;
ALTER TABLE placements ADD COLUMN IF NOT EXISTS vendor_contact_details TEXT;
ALTER TABLE placements ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE placements ADD COLUMN IF NOT EXISTS offer_type TEXT; -- 'c2c', 'w2', 'full_time'
