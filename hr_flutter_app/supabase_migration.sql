-- ============================================================
-- San Synapse HR Flutter App - Supabase Migration
-- Run these in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Leave Types (Compensatory Off, Earned Leave, Leave Without Pay, etc.)
CREATE TABLE IF NOT EXISTS leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_paid boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed default leave types
INSERT INTO leave_types (name, code, is_paid) VALUES
  ('Compensatory Off', 'CO', true),
  ('Earned Leave', 'EL', true),
  ('Leave Without Pay', 'LWP', false)
ON CONFLICT (code) DO NOTHING;

-- 2. Leave Balances per employee per year
CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES leave_types(id) ON DELETE CASCADE,
  balance numeric DEFAULT 0,
  booked numeric DEFAULT 0,
  year int NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, leave_type_id, year)
);

-- 3. Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days numeric NOT NULL DEFAULT 1,
  reason text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Work Schedules (shift assignments per employee per day)
CREATE TABLE IF NOT EXISTS work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  shift_name text,
  start_time time,
  end_time time,
  status text DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'present', 'absent', 'weekend', 'holiday', 'leave')),
  hours_worked int,  -- stored in minutes for precision
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- Enable Row Level Security (RLS) for all new tables
-- ============================================================

ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- leave_types: anyone authenticated can read
CREATE POLICY "Anyone can read leave types"
  ON leave_types FOR SELECT
  TO authenticated USING (true);

-- leave_balances: users can read their own
CREATE POLICY "Users can read own leave balances"
  ON leave_balances FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- leave_requests: users can read their own + insert
CREATE POLICY "Users can read own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create leave requests"
  ON leave_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- work_schedules: users can read their own
CREATE POLICY "Users can read own work schedules"
  ON work_schedules FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Sample data for testing (replace 'YOUR_USER_ID' with actual UUID)
-- ============================================================

-- To seed leave balances for a user, run:
-- INSERT INTO leave_balances (user_id, leave_type_id, balance, booked, year)
-- SELECT 'YOUR_USER_ID', id,
--   CASE code WHEN 'CO' THEN 3 WHEN 'EL' THEN 18.8 ELSE 0 END,
--   0, 2026
-- FROM leave_types;

-- To add a work schedule entry:
-- INSERT INTO work_schedules (user_id, date, shift_name, start_time, end_time, status, hours_worked)
-- VALUES ('YOUR_USER_ID', '2026-02-16', 'Evening', '17:30', '02:30', 'present', 550);
