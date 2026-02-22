-- ================================================================
-- Fix all mock data: pipeline distribution, placements, submissions
-- ================================================================

-- 1. DISTRIBUTE candidate statuses for a realistic pipeline view
-- Result: ~35% in_market, ~25% active, ~20% placed, ~12% on_hold, ~8% inactive
WITH ranked AS (
  SELECT candidate_id, (ROW_NUMBER() OVER (ORDER BY candidate_id) - 1) AS rn
  FROM candidates
)
UPDATE candidates c
SET status = CASE (r.rn % 20)
  WHEN 0  THEN 'in_market'::candidate_status
  WHEN 1  THEN 'active'::candidate_status
  WHEN 2  THEN 'in_market'::candidate_status
  WHEN 3  THEN 'placed'::candidate_status
  WHEN 4  THEN 'in_market'::candidate_status
  WHEN 5  THEN 'active'::candidate_status
  WHEN 6  THEN 'on_hold'::candidate_status
  WHEN 7  THEN 'in_market'::candidate_status
  WHEN 8  THEN 'active'::candidate_status
  WHEN 9  THEN 'placed'::candidate_status
  WHEN 10 THEN 'in_market'::candidate_status
  WHEN 11 THEN 'active'::candidate_status
  WHEN 12 THEN 'in_market'::candidate_status
  WHEN 13 THEN 'on_hold'::candidate_status
  WHEN 14 THEN 'placed'::candidate_status
  WHEN 15 THEN 'in_market'::candidate_status
  WHEN 16 THEN 'inactive'::candidate_status
  WHEN 17 THEN 'active'::candidate_status
  WHEN 18 THEN 'placed'::candidate_status
  ELSE         'in_market'::candidate_status
END
FROM ranked r
WHERE c.candidate_id = r.candidate_id;

-- 2. ADD MORE VENDORS for realistic placements display
INSERT INTO vendors (id, name, tier, contact_person, contact_email, is_active)
VALUES
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Infosys BPM', 'tier_1', 'Ravi Kumar', 'ravi@infosys.com', true),
  ('a1b2c3d4-0002-0000-0000-000000000002', 'Wipro Technologies', 'tier_1', 'Priya Sharma', 'priya@wipro.com', true),
  ('a1b2c3d4-0003-0000-0000-000000000003', 'Tata Consultancy', 'tier_1', 'Amit Patel', 'amit@tcs.com', true),
  ('a1b2c3d4-0004-0000-0000-000000000004', 'HCL Technologies', 'tier_2', 'Neha Singh', 'neha@hcl.com', true),
  ('a1b2c3d4-0005-0000-0000-000000000005', 'Cognizant Technology', 'tier_2', 'Raj Iyer', 'raj@cognizant.com', true),
  ('a1b2c3d4-0006-0000-0000-000000000006', 'Capgemini US', 'tier_2', 'Sara Johnson', 'sara@capgemini.com', true),
  ('a1b2c3d4-0007-0000-0000-000000000007', 'Accenture Federal', 'tier_1', 'Mike Brown', 'mike@accenture.com', true),
  ('a1b2c3d4-0008-0000-0000-000000000008', 'Deloitte Consulting', 'tier_1', 'Lisa Chen', 'lisa@deloitte.com', true)
ON CONFLICT (id) DO NOTHING;

-- 3. POPULATE placements with job titles, durations, vendor links
WITH placement_ranked AS (
  SELECT placement_id, (ROW_NUMBER() OVER (ORDER BY placement_id) - 1) AS rn
  FROM placements
),
vendor_list AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY id) - 1) AS vn FROM vendors
),
vendor_count AS (SELECT COUNT(*) AS cnt FROM vendors)
UPDATE placements p
SET
  job_title = (ARRAY[
    'Senior Java Developer', 'Full Stack Developer', 'DevOps Engineer',
    'Data Engineer', 'Python Developer', 'React Developer',
    'Cloud Architect', 'QA Automation Engineer', 'Scrum Master',
    'Business Analyst', 'Solutions Architect', 'Node.js Developer',
    'Angular Developer', 'Salesforce Developer', 'SAP Consultant',
    'Data Scientist', 'ML Engineer', 'UI/UX Designer',
    'Cyber Security Analyst', 'Network Engineer'
  ])[(pr.rn % 20) + 1],
  duration_months = (ARRAY[3, 6, 6, 12, 12, 12, 6, 12, 24, 6, 3, 12, 6, 12, 24, 12, 6, 12, 6, 12])[(pr.rn % 20) + 1],
  vendor_id = (SELECT id FROM vendor_list WHERE vl.vn = (pr.rn % (SELECT cnt FROM vendor_count)) LIMIT 1),
  status = (ARRAY[
    'active'::placement_status, 'active'::placement_status, 'active'::placement_status,
    'active'::placement_status, 'completed'::placement_status, 'active'::placement_status,
    'active'::placement_status, 'extended'::placement_status, 'active'::placement_status,
    'active'::placement_status
  ])[(pr.rn % 10) + 1]
FROM placement_ranked pr
CROSS JOIN vendor_list vl
WHERE p.placement_id = pr.placement_id
  AND vl.vn = (pr.rn % (SELECT cnt FROM vendor_count));

-- 4. BULK INSERT realistic submissions (30 rows)
DO $$
DECLARE
  cand_ids UUID[];
  vendor_ids UUID[];
  sp_ids UUID[];
  total_c INTEGER;
  total_v INTEGER;
  total_sp INTEGER;
  jobs TEXT[] := ARRAY['Senior Java Developer','Full Stack Developer','DevOps Engineer','Data Engineer','Python Developer','React Developer','Cloud Architect','QA Automation Engineer','Business Analyst','Solutions Architect','Node.js Developer','Angular Developer','SAP Consultant','Data Scientist','ML Engineer'];
  techs TEXT[] := ARRAY['Java/Spring Boot','React, Node.js','AWS, Docker, K8s','Python, Spark, Kafka','Python/Django','React, TypeScript','AWS/Azure','Selenium, Python','Agile, JIRA','Microservices, Java','Node.js, Express','Angular, TypeScript','SAP S/4HANA','Python, TensorFlow','Python, PyTorch'];
  sources TEXT[] := ARRAY['direct','linkedin','dice','indeed','glassdoor'];
  statuses submission_status[] := ARRAY['submitted','submitted','shortlisted','shortlisted','interview_scheduled','interview_scheduled','selected','rejected','submitted','interview_scheduled']::submission_status[];
  i INTEGER;
BEGIN
  SELECT ARRAY(SELECT id FROM candidates ORDER BY id) INTO cand_ids;
  SELECT ARRAY(SELECT id FROM vendors ORDER BY id) INTO vendor_ids;
  SELECT ARRAY(SELECT id FROM user_profiles WHERE role IN ('sales','recruiter') ORDER BY id) INTO sp_ids;
  total_c := array_length(cand_ids, 1);
  total_v := array_length(vendor_ids, 1);
  total_sp := COALESCE(array_length(sp_ids, 1), 1);

  FOR i IN 1..30 LOOP
    INSERT INTO submissions (
      id, candidate_id, vendor_id, sales_person_id,
      job_title, technology, client_name,
      submission_date, status, submission_source, rate,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      cand_ids[((i - 1) % total_c) + 1],
      vendor_ids[((i - 1) % total_v) + 1],
      CASE WHEN total_sp > 0 THEN sp_ids[((i - 1) % total_sp) + 1] ELSE NULL END,
      jobs[((i - 1) % 15) + 1],
      techs[((i - 1) % 15) + 1],
      (ARRAY['BluePeak Technologies','NovaHealth Systems','Vertex Retail Group','Apex Financial','Meridian Corp','Stellar Dynamics','Summit Analytics','Horizon Tech','Pinnacle Solutions','Granite Systems'])[(i % 10) + 1],
      CURRENT_DATE - (i * 3),
      statuses[((i - 1) % 10) + 1],
      sources[((i - 1) % 5) + 1],
      65 + (i * 2.5),
      NOW() - (i * INTERVAL '3 days'),
      NOW() - (i * INTERVAL '3 days')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 5. NOTIFY PostgREST to reload
NOTIFY pgrst, 'reload schema';
-- Fix the 2 old submissions that have no matching candidate.id
-- Update their candidate_id to real candidates.id values
WITH cand_sample AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM candidates LIMIT 10
)
UPDATE submissions s
SET candidate_id = (SELECT id FROM cand_sample WHERE rn = 1)
WHERE s.id = '886003ba-ca62-487e-9db6-404eb5686cbe';

WITH cand_sample AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM candidates LIMIT 10
)
UPDATE submissions s
SET candidate_id = (SELECT id FROM cand_sample WHERE rn = 2)
WHERE s.id = '641b47bc-21a6-4f88-83b9-0ca0cf87084c';

-- Also update technology for old submissions
UPDATE submissions SET technology = 'Java/Spring Boot' WHERE id = '886003ba-ca62-487e-9db6-404eb5686cbe' AND technology IS NULL;
UPDATE submissions SET technology = 'React, Node.js'   WHERE id = '641b47bc-21a6-4f88-83b9-0ca0cf87084c' AND technology IS NULL;

-- Distribute vendors more evenly across placements
-- (The CROSS JOIN approach had issues - use modulo on row number directly)
WITH placement_ranked AS (
  SELECT placement_id, (ROW_NUMBER() OVER (ORDER BY placement_id) - 1) AS rn FROM placements
),
vendor_ranked AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY id) - 1) AS vn, COUNT(*) OVER () AS cnt FROM vendors
)
UPDATE placements p
SET vendor_id = (
  SELECT id FROM vendor_ranked WHERE vn = (pr.rn % (SELECT cnt FROM vendor_ranked LIMIT 1))
)
FROM placement_ranked pr
WHERE p.placement_id = pr.placement_id;
