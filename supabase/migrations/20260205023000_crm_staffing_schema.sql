-- CRM Staffing Application Schema
-- Role-based access with Admin, Recruiter, Sales, HR, Finance roles
-- Complete workflow: Candidate → Submission → Interview → Placement → HR → Invoicing → Compliance

-- 1. TYPES (ENUMs)
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'recruiter', 'sales', 'hr', 'finance');

DROP TYPE IF EXISTS public.candidate_status CASCADE;
CREATE TYPE public.candidate_status AS ENUM ('in_market', 'active', 'placed', 'on_hold', 'inactive');

DROP TYPE IF EXISTS public.visa_status CASCADE;
CREATE TYPE public.visa_status AS ENUM ('h1b', 'green_card', 'citizen', 'opt', 'cpt', 'l1', 'ead');

DROP TYPE IF EXISTS public.submission_status CASCADE;
CREATE TYPE public.submission_status AS ENUM ('submitted', 'shortlisted', 'rejected', 'interview_scheduled', 'selected');

DROP TYPE IF EXISTS public.vendor_tier CASCADE;
CREATE TYPE public.vendor_tier AS ENUM ('tier_1', 'tier_2', 'tier_3', 'direct_client');

DROP TYPE IF EXISTS public.interview_mode CASCADE;
CREATE TYPE public.interview_mode AS ENUM ('phone', 'video', 'in_person', 'technical', 'hr_round');

DROP TYPE IF EXISTS public.interview_round CASCADE;
CREATE TYPE public.interview_round AS ENUM ('round_1', 'round_2', 'round_3', 'final');

DROP TYPE IF EXISTS public.placement_status CASCADE;
CREATE TYPE public.placement_status AS ENUM ('active', 'completed', 'terminated', 'extended');

DROP TYPE IF EXISTS public.invoice_status CASCADE;
CREATE TYPE public.invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');

DROP TYPE IF EXISTS public.compliance_form_type CASCADE;
CREATE TYPE public.compliance_form_type AS ENUM ('i9', 'w2', 'everify', 'onboarding');

-- 2. CORE TABLES

-- User Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'recruiter'::public.user_role,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Candidates
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    visa_status public.visa_status NOT NULL,
    status public.candidate_status DEFAULT 'in_market'::public.candidate_status,
    skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    education TEXT,
    experience_years INTEGER,
    current_location TEXT,
    willing_to_relocate BOOLEAN DEFAULT false,
    pay_rate DECIMAL(10, 2),
    pay_percentage DECIMAL(5, 2),
    days_in_market INTEGER DEFAULT 0,
    recruiter_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    resume_url TEXT,
    linkedin_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Vendors/Clients
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tier public.vendor_tier NOT NULL,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    sales_person_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    job_title TEXT NOT NULL,
    job_description TEXT,
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status public.submission_status DEFAULT 'submitted'::public.submission_status,
    rate DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Interviews
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    interview_date DATE NOT NULL,
    interview_time TIME NOT NULL,
    interview_mode public.interview_mode NOT NULL,
    interview_round public.interview_round NOT NULL,
    mentor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    interviewer_name TEXT,
    feedback TEXT,
    result TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Placements
CREATE TABLE IF NOT EXISTS public.placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    duration_months INTEGER,
    bill_rate DECIMAL(10, 2) NOT NULL,
    pay_rate DECIMAL(10, 2) NOT NULL,
    status public.placement_status DEFAULT 'active'::public.placement_status,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- HR Onboarding
CREATE TABLE IF NOT EXISTS public.hr_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    placement_id UUID REFERENCES public.placements(id) ON DELETE SET NULL,
    personal_details JSONB,
    visa_tracking JSONB,
    allocation_status TEXT,
    onboarding_date DATE,
    hr_manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    documents_verified BOOLEAN DEFAULT false,
    background_check_completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Invoices & Timesheets
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    hours_worked DECIMAL(10, 2) NOT NULL,
    gross_earnings DECIMAL(10, 2) NOT NULL,
    deductions DECIMAL(10, 2) DEFAULT 0,
    net_pay DECIMAL(10, 2) NOT NULL,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status,
    bank_details JSONB,
    timesheet_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Forms
CREATE TABLE IF NOT EXISTS public.compliance_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    form_type public.compliance_form_type NOT NULL,
    form_data JSONB,
    document_url TEXT,
    generated_date DATE DEFAULT CURRENT_DATE,
    verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    verified_date DATE,
    is_verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_visa_status ON public.candidates(visa_status);
CREATE INDEX IF NOT EXISTS idx_candidates_recruiter_id ON public.candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_submissions_candidate_id ON public.submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_submissions_vendor_id ON public.submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_interviews_submission_id ON public.interviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON public.interviews(interview_date);
CREATE INDEX IF NOT EXISTS idx_placements_candidate_id ON public.placements(candidate_id);
CREATE INDEX IF NOT EXISTS idx_placements_vendor_id ON public.placements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_placements_status ON public.placements(status);
CREATE INDEX IF NOT EXISTS idx_invoices_placement_id ON public.invoices(placement_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_compliance_forms_candidate_id ON public.compliance_forms(candidate_id);

-- 4. FUNCTIONS (BEFORE RLS POLICIES)

-- Trigger function for user_profiles creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'recruiter'::public.user_role)
    );
    RETURN NEW;
END;
$$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role::TEXT = required_role AND up.is_active = true
)
$$;

-- Function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role::TEXT = ANY(required_roles) AND up.is_active = true
)
$$;

-- 5. ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_forms ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- User Profiles: Users can view all, but only update their own
DROP POLICY IF EXISTS "users_view_all_profiles" ON public.user_profiles;
CREATE POLICY "users_view_all_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
CREATE POLICY "users_update_own_profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_full_access_profiles" ON public.user_profiles;
CREATE POLICY "admin_full_access_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- Candidates: Recruiters, Sales, HR, Finance, Admin can access
DROP POLICY IF EXISTS "staff_access_candidates" ON public.candidates;
CREATE POLICY "staff_access_candidates"
ON public.candidates
FOR ALL
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'recruiter', 'sales', 'hr', 'finance']))
WITH CHECK (public.has_any_role(ARRAY['admin', 'recruiter', 'sales', 'hr', 'finance']));

-- Vendors: All authenticated users can view, Admin/Sales can modify
DROP POLICY IF EXISTS "users_view_vendors" ON public.vendors;
CREATE POLICY "users_view_vendors"
ON public.vendors
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_sales_manage_vendors" ON public.vendors;
CREATE POLICY "admin_sales_manage_vendors"
ON public.vendors
FOR ALL
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'sales']))
WITH CHECK (public.has_any_role(ARRAY['admin', 'sales']));

-- Submissions: Sales, Recruiters, Admin can access
DROP POLICY IF EXISTS "sales_recruiter_access_submissions" ON public.submissions;
CREATE POLICY "sales_recruiter_access_submissions"
ON public.submissions
FOR ALL
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'recruiter', 'sales']))
WITH CHECK (public.has_any_role(ARRAY['admin', 'recruiter', 'sales']));

-- Interviews: Recruiters, Sales, Admin can access
DROP POLICY IF EXISTS "staff_access_interviews" ON public.interviews;
CREATE POLICY "staff_access_interviews"
ON public.interviews
FOR ALL
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'recruiter', 'sales']))
WITH CHECK (public.has_any_role(ARRAY['admin', 'recruiter', 'sales']));

-- Placements: All staff can view, Admin/Sales/HR can modify
DROP POLICY IF EXISTS "staff_view_placements" ON public.placements;
CREATE POLICY "staff_view_placements"
ON public.placements
FOR SELECT
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'recruiter', 'sales', 'hr', 'finance']));

DROP POLICY IF EXISTS "admin_sales_hr_manage_placements" ON public.placements;
CREATE POLICY "admin_sales_hr_manage_placements"
ON public.placements
FOR ALL
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'sales', 'hr']))
WITH CHECK (public.has_any_role(ARRAY['admin', 'sales', 'hr']));

-- HR Onboarding: HR and Admin only
DROP POLICY IF EXISTS "hr_admin_access_onboarding" ON public.hr_onboarding;
CREATE POLICY "hr_admin_access_onboarding"
ON public.hr_onboarding
FOR ALL
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'hr']))
WITH CHECK (public.has_any_role(ARRAY['admin', 'hr']));

-- Invoices: Finance, Admin can access
DROP POLICY IF EXISTS "finance_admin_access_invoices" ON public.invoices;
CREATE POLICY "finance_admin_access_invoices"
ON public.invoices
FOR ALL
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'finance']))
WITH CHECK (public.has_any_role(ARRAY['admin', 'finance']));

-- Compliance Forms: HR, Admin can access
DROP POLICY IF EXISTS "hr_admin_access_compliance" ON public.compliance_forms;
CREATE POLICY "hr_admin_access_compliance"
ON public.compliance_forms
FOR ALL
TO authenticated
USING (public.has_any_role(ARRAY['admin', 'hr']))
WITH CHECK (public.has_any_role(ARRAY['admin', 'hr']));

-- 7. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. MOCK DATA
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    recruiter_uuid UUID := gen_random_uuid();
    sales_uuid UUID := gen_random_uuid();
    hr_uuid UUID := gen_random_uuid();
    finance_uuid UUID := gen_random_uuid();
    candidate1_uuid UUID := gen_random_uuid();
    candidate2_uuid UUID := gen_random_uuid();
    candidate3_uuid UUID := gen_random_uuid();
    vendor1_uuid UUID := gen_random_uuid();
    vendor2_uuid UUID := gen_random_uuid();
    submission1_uuid UUID := gen_random_uuid();
    placement1_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users (trigger creates user_profiles automatically)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@crmstaffing.com', crypt('Admin@2025', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Admin User', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (recruiter_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'recruiter@crmstaffing.com', crypt('Recruiter@2025', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Sarah Johnson', 'role', 'recruiter'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (sales_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'sales@crmstaffing.com', crypt('Sales@2025', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Michael Chen', 'role', 'sales'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (hr_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'hr@crmstaffing.com', crypt('HR@2025', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Emily Rodriguez', 'role', 'hr'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (finance_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'finance@crmstaffing.com', crypt('Finance@2025', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'David Thompson', 'role', 'finance'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Create vendors
    INSERT INTO public.vendors (id, name, tier, contact_person, contact_email, contact_phone) VALUES
        (vendor1_uuid, 'TechCorp Solutions', 'tier_1'::public.vendor_tier, 'John Smith', 'john@techcorp.com', '+1-555-0101'),
        (vendor2_uuid, 'Global IT Services', 'tier_2'::public.vendor_tier, 'Lisa Wang', 'lisa@globalit.com', '+1-555-0102')
    ON CONFLICT (id) DO NOTHING;

    -- Create candidates
    INSERT INTO public.candidates (id, first_name, last_name, email, phone, visa_status, status, skills, education, experience_years, current_location, pay_rate, recruiter_id, created_by, days_in_market) VALUES
        (candidate1_uuid, 'Rajesh', 'Kumar', 'rajesh.kumar@email.com', '+1-555-1001', 'h1b'::public.visa_status, 'active'::public.candidate_status, ARRAY['Java', 'Spring Boot', 'Microservices', 'AWS'], 'Masters in Computer Science', 8, 'San Francisco, CA', 85.00, recruiter_uuid, recruiter_uuid, 15),
        (candidate2_uuid, 'Priya', 'Sharma', 'priya.sharma@email.com', '+1-555-1002', 'green_card'::public.visa_status, 'in_market'::public.candidate_status, ARRAY['React', 'Node.js', 'TypeScript', 'MongoDB'], 'Bachelors in Information Technology', 5, 'Austin, TX', 75.00, recruiter_uuid, recruiter_uuid, 8),
        (candidate3_uuid, 'Michael', 'Anderson', 'michael.anderson@email.com', '+1-555-1003', 'citizen'::public.visa_status, 'placed'::public.candidate_status, ARRAY['Python', 'Django', 'PostgreSQL', 'Docker'], 'Masters in Software Engineering', 10, 'New York, NY', 95.00, recruiter_uuid, recruiter_uuid, 0)
    ON CONFLICT (id) DO NOTHING;

    -- Create submissions
    INSERT INTO public.submissions (id, candidate_id, vendor_id, sales_person_id, job_title, submission_date, status, rate) VALUES
        (submission1_uuid, candidate1_uuid, vendor1_uuid, sales_uuid, 'Senior Java Developer', CURRENT_DATE - INTERVAL '10 days', 'interview_scheduled'::public.submission_status, 95.00),
        (gen_random_uuid(), candidate2_uuid, vendor2_uuid, sales_uuid, 'Full Stack Developer', CURRENT_DATE - INTERVAL '5 days', 'shortlisted'::public.submission_status, 85.00)
    ON CONFLICT (id) DO NOTHING;

    -- Create interviews
    INSERT INTO public.interviews (submission_id, candidate_id, interview_date, interview_time, interview_mode, interview_round, mentor_id) VALUES
        (submission1_uuid, candidate1_uuid, CURRENT_DATE + INTERVAL '2 days', '14:00:00', 'video'::public.interview_mode, 'round_1'::public.interview_round, recruiter_uuid)
    ON CONFLICT (id) DO NOTHING;

    -- Create placements
    INSERT INTO public.placements (id, candidate_id, submission_id, vendor_id, client_name, job_title, start_date, duration_months, bill_rate, pay_rate, location) VALUES
        (placement1_uuid, candidate3_uuid, NULL, vendor1_uuid, 'Fortune 500 Tech Company', 'Senior Python Developer', CURRENT_DATE - INTERVAL '30 days', 12, 120.00, 95.00, 'New York, NY')
    ON CONFLICT (id) DO NOTHING;

    -- Create HR onboarding
    INSERT INTO public.hr_onboarding (candidate_id, placement_id, onboarding_date, hr_manager_id, documents_verified) VALUES
        (candidate3_uuid, placement1_uuid, CURRENT_DATE - INTERVAL '25 days', hr_uuid, true)
    ON CONFLICT (id) DO NOTHING;

    -- Create invoices
    INSERT INTO public.invoices (placement_id, candidate_id, invoice_number, period_start, period_end, hours_worked, gross_earnings, net_pay, status, created_by) VALUES
        (placement1_uuid, candidate3_uuid, 'INV-2025-001', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '16 days', 80.00, 7600.00, 7220.00, 'paid'::public.invoice_status, finance_uuid)
    ON CONFLICT (invoice_number) DO NOTHING;

    -- Create compliance forms
    INSERT INTO public.compliance_forms (candidate_id, form_type, generated_date, verified_by, is_verified) VALUES
        (candidate3_uuid, 'i9'::public.compliance_form_type, CURRENT_DATE - INTERVAL '28 days', hr_uuid, true),
        (candidate3_uuid, 'everify'::public.compliance_form_type, CURRENT_DATE - INTERVAL '27 days', hr_uuid, true)
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;