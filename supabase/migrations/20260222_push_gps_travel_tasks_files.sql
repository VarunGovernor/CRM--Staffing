-- ============================================================
-- Migration: Push Notifications, GPS Clock-In, Travel, Tasks, Files
-- Date: 2026-02-22
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. GPS fields on clock_entries
-- ──────────────────────────────────────────────
ALTER TABLE clock_entries
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distance_meters INTEGER;

-- ──────────────────────────────────────────────
-- 2. FCM push token on user_profiles
-- ──────────────────────────────────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- ──────────────────────────────────────────────
-- 3. Travel Requests
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS travel_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination      TEXT NOT NULL,
  purpose          TEXT NOT NULL,
  departure_date   DATE NOT NULL,
  return_date      DATE NOT NULL,
  estimated_budget NUMERIC(10,2),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  notes            TEXT,
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE travel_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "travel_requests_own" ON travel_requests;
CREATE POLICY "travel_requests_own" ON travel_requests
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "travel_requests_admin_hr" ON travel_requests;
CREATE POLICY "travel_requests_admin_hr" ON travel_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- ──────────────────────────────────────────────
-- 4. Travel Expenses
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS travel_expenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id   UUID REFERENCES travel_requests(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  category            TEXT NOT NULL
                        CHECK (category IN ('flight', 'hotel', 'meals', 'transport', 'other')),
  amount              NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  description         TEXT,
  receipt_url         TEXT,
  date                DATE NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE travel_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "travel_expenses_own" ON travel_expenses;
CREATE POLICY "travel_expenses_own" ON travel_expenses
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "travel_expenses_admin_hr" ON travel_expenses;
CREATE POLICY "travel_expenses_admin_hr" ON travel_expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- ──────────────────────────────────────────────
-- 5. Tasks
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  assigned_to  UUID REFERENCES auth.users(id),
  created_by   UUID NOT NULL REFERENCES auth.users(id),
  priority     TEXT DEFAULT 'medium'
                 CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_access" ON tasks;
CREATE POLICY "tasks_access" ON tasks
  FOR ALL USING (
    auth.uid() = assigned_to
    OR auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- ──────────────────────────────────────────────
-- 6. Employee Files
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT DEFAULT 'other'
                    CHECK (category IN ('offer_letter', 'payslip', 'contract', 'id_proof', 'other')),
  file_url        TEXT NOT NULL,
  file_size_bytes INTEGER,
  uploaded_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employee_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_files_own" ON employee_files;
CREATE POLICY "employee_files_own" ON employee_files
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "employee_files_admin_hr" ON employee_files;
CREATE POLICY "employee_files_admin_hr" ON employee_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- ──────────────────────────────────────────────
-- 7. Indexes
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS travel_requests_user_id_idx ON travel_requests(user_id);
CREATE INDEX IF NOT EXISTS travel_requests_status_idx ON travel_requests(status);
CREATE INDEX IF NOT EXISTS travel_expenses_user_id_idx ON travel_expenses(user_id);
CREATE INDEX IF NOT EXISTS travel_expenses_request_id_idx ON travel_expenses(travel_request_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON tasks(created_by);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS employee_files_user_id_idx ON employee_files(user_id);
