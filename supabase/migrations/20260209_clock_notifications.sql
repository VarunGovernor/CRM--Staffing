-- Clock In/Out, Notifications & Manager Assignment Schema
-- Adds employee time tracking, in-app notifications, and reports_to relationship

-- 1. Add 'employee' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'employee';

-- 2. Add reports_to column to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

CREATE INDEX IF NOT EXISTS idx_user_profiles_reports_to ON public.user_profiles(reports_to);

-- 3. Clock Entries table
CREATE TABLE IF NOT EXISTS public.clock_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    clock_in TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clock_out TIMESTAMPTZ
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clock_entries_user_id ON public.clock_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_clock_entries_clock_in ON public.clock_entries(clock_in);
CREATE INDEX IF NOT EXISTS idx_clock_entries_user_clock ON public.clock_entries(user_id, clock_in DESC);

-- 4. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 5. Audit Logs table (formalize what auditLog.js uses)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    module TEXT,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    severity TEXT DEFAULT 'info',
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- 6. Enable RLS
ALTER TABLE public.clock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Clock Entries: Users can manage their own, admin can see all
DROP POLICY IF EXISTS "users_manage_own_clock" ON public.clock_entries;
CREATE POLICY "users_manage_own_clock"
ON public.clock_entries
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_view_all_clock" ON public.clock_entries;
CREATE POLICY "admin_view_all_clock"
ON public.clock_entries
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

DROP POLICY IF EXISTS "manager_view_reports_clock" ON public.clock_entries;
CREATE POLICY "manager_view_reports_clock"
ON public.clock_entries
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = clock_entries.user_id AND reports_to = auth.uid()
    )
);

-- Notifications: Users can manage their own
DROP POLICY IF EXISTS "users_manage_own_notifications" ON public.notifications;
CREATE POLICY "users_manage_own_notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow any authenticated user to insert notifications (for cross-user notifications)
DROP POLICY IF EXISTS "authenticated_insert_notifications" ON public.notifications;
CREATE POLICY "authenticated_insert_notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Audit Logs: Admin can view all, users can view own
DROP POLICY IF EXISTS "admin_view_all_audit" ON public.audit_logs;
CREATE POLICY "admin_view_all_audit"
ON public.audit_logs
FOR ALL
TO authenticated
USING (public.has_role('admin'));

DROP POLICY IF EXISTS "users_view_own_audit" ON public.audit_logs;
CREATE POLICY "users_view_own_audit"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "authenticated_insert_audit" ON public.audit_logs;
CREATE POLICY "authenticated_insert_audit"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
