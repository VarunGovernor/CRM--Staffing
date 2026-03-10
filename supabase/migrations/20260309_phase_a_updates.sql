-- Phase A Updates: Contacts table, Placement new columns, Interview new columns
-- Run this in your Supabase SQL editor

-- ============================================================
-- 1. CONTACTS TABLE (new — Name / Title / VISA only)
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  title       text,
  visa        text,
  created_at  timestamptz DEFAULT now(),
  created_by  uuid        REFERENCES auth.users(id)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_all_authenticated" ON contacts;
CREATE POLICY "contacts_all_authenticated"
  ON contacts FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 2. PLACEMENTS TABLE — new columns
-- ============================================================
ALTER TABLE placements
  ADD COLUMN IF NOT EXISTS rate_type              text    DEFAULT 'hourly',       -- 'hourly' | 'annually'
  ADD COLUMN IF NOT EXISTS bgc_status             text    DEFAULT 'pending',      -- 'pending' | 'initiated' | 'done'
  ADD COLUMN IF NOT EXISTS offer_letter_status    text    DEFAULT 'pending',      -- 'pending' | 'sent' | 'signed'
  ADD COLUMN IF NOT EXISTS vendor_contact_phone   text,
  ADD COLUMN IF NOT EXISTS vendor_contact_email   text,
  ADD COLUMN IF NOT EXISTS vendor_contact_address text;

-- ============================================================
-- 3. INTERVIEWS TABLE — new columns
-- ============================================================
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS timezone           text    DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS interview_status   text    DEFAULT 'scheduled',   -- 'scheduled' | 'completed' | 'rescheduled' | 'cancelled' | 'no_show'
  ADD COLUMN IF NOT EXISTS vendor_company     text;
