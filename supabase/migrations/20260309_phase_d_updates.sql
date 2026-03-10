-- Phase D Updates: Microsoft Graph (Outlook Email + Calendar) + QuickBooks
-- Run this in your Supabase SQL editor

-- ============================================================
-- 1. MICROSOFT_TOKENS TABLE
--    Stores OAuth2 tokens for Outlook/Graph API per user
-- ============================================================
CREATE TABLE IF NOT EXISTS microsoft_tokens (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token  text,
  refresh_token text        NOT NULL,
  expires_at    timestamptz NOT NULL,
  scope         text,
  ms_email      text,        -- the Microsoft account email (may differ from CRM email)
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE microsoft_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_microsoft_tokens" ON microsoft_tokens;
CREATE POLICY "own_microsoft_tokens"
  ON microsoft_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can read all tokens (needed for shared send-from account)
DROP POLICY IF EXISTS "admin_microsoft_tokens_read" ON microsoft_tokens;
CREATE POLICY "admin_microsoft_tokens_read"
  ON microsoft_tokens FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. QUICKBOOKS_TOKENS TABLE
--    Stores OAuth2 tokens for QuickBooks Online per org
-- ============================================================
CREATE TABLE IF NOT EXISTS quickbooks_tokens (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token  text        NOT NULL,
  refresh_token text        NOT NULL,
  realm_id      text        NOT NULL,  -- QuickBooks company ID
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE quickbooks_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_quickbooks_tokens" ON quickbooks_tokens;
CREATE POLICY "admin_quickbooks_tokens"
  ON quickbooks_tokens FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 3. INTERVIEWS TABLE — add Outlook calendar event ID
-- ============================================================
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS outlook_event_id text,
  ADD COLUMN IF NOT EXISTS outlook_event_url text,
  ADD COLUMN IF NOT EXISTS calendar_synced_at timestamptz;

-- ============================================================
-- 4. TIMESHEETS — add QuickBooks sync tracking
-- ============================================================
-- (timesheets table may vary; apply to whichever table holds timesheets)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS qb_synced_at   timestamptz,
  ADD COLUMN IF NOT EXISTS qb_entity_id   text,   -- QuickBooks TimeActivity/Bill ID
  ADD COLUMN IF NOT EXISTS qb_sync_error  text;

-- ============================================================
-- 5. SENT_EMAILS LOG — track outbound emails
-- ============================================================
CREATE TABLE IF NOT EXISTS sent_emails (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_by      uuid        NOT NULL REFERENCES auth.users(id),
  to_address   text        NOT NULL,
  cc_address   text,
  subject      text        NOT NULL,
  body         text,
  graph_msg_id text,        -- Microsoft Graph message ID
  sent_at      timestamptz DEFAULT now(),
  status       text        DEFAULT 'sent'  -- 'sent' | 'failed'
);

ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sent_emails_own" ON sent_emails;
CREATE POLICY "sent_emails_own"
  ON sent_emails FOR SELECT
  USING (sent_by = auth.uid());

DROP POLICY IF EXISTS "sent_emails_admin" ON sent_emails;
CREATE POLICY "sent_emails_admin"
  ON sent_emails FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
