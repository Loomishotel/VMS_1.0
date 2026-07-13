-- =====================================================
-- SEED: Distinct Admin, Receptionist, Security, and Employee Users per Office Location
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- STEP -1: Re-create the handle_new_auth_user trigger function with dynamic logic
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
  v_branch_id UUID;
  v_full_name TEXT;
BEGIN
  -- 1. Determine role based on email pattern
  IF NEW.email = 'admin@vms.local' OR NEW.email LIKE 'admin.%@vms.local' THEN
    v_role_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Admin
  ELSIF NEW.email IN ('security@vms.local', 'security2@vms.local') OR NEW.email LIKE 'security.%@vms.local' THEN
    v_role_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'; -- Security
  ELSE
    v_role_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'; -- default Employee role
  END IF;

  -- 2. Try to lookup from public.Employee table first by email to get their branch and actual name
  SELECT "branchId", "fullName"
  INTO v_branch_id, v_full_name
  FROM public."Employee"
  WHERE email = NEW.email;

  -- 3. If not found in Employee, fall back to meta_data and email pattern
  IF v_full_name IS NULL THEN
    v_full_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    );
  END IF;

  IF v_branch_id IS NULL THEN
    -- Try to get branch_id from metadata if present
    IF (NEW.raw_user_meta_data->>'branch_id') IS NOT NULL THEN
      v_branch_id := (NEW.raw_user_meta_data->>'branch_id')::UUID;
    -- Otherwise, infer from email address pattern
    ELSIF NEW.email LIKE '%.mum@%' THEN
      v_branch_id := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12'; -- Mumbai
    ELSIF NEW.email LIKE '%.pun@%' THEN
      v_branch_id := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13'; -- Pune
    ELSIF NEW.email LIKE '%.gur@%' THEN
      v_branch_id := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14'; -- Gurgaon
    ELSE
      v_branch_id := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11'; -- Default to Bangalore HQ
    END IF;
  END IF;

  -- 4. Insert or update the public.User profile record
  INSERT INTO public."User" ("id", "email", "fullName", "roleId", "branchId", "phone", "isActive")
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_role_id,
    v_branch_id,
    NEW.phone,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    "email" = EXCLUDED.email,
    "fullName" = EXCLUDED."fullName",
    "roleId" = EXCLUDED."roleId",
    "branchId" = EXCLUDED."branchId",
    "phone" = EXCLUDED."phone";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PRE-MIGRATION CLEANUP: To prevent unique constraint violations on User_email_key and Employee_email_key
-- when assigning the new IDs (d51-d55) to Indian staff, we must first revert the old IDs (d11-d15) to use the legacy US employee emails.
UPDATE public."User" SET email = 'sarah.j@vms.local', "fullName" = 'Sarah Jenkins' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11';
UPDATE public."User" SET email = 'david.c@vms.local', "fullName" = 'David Chen' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12';
UPDATE public."User" SET email = 'emma.r@vms.local', "fullName" = 'Emma Rodriguez' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13';
UPDATE public."User" SET email = 'robert.s@vms.local', "fullName" = 'Robert Sterling' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14';
UPDATE public."User" SET email = 'lisa.m@vms.local', "fullName" = 'Lisa Monroe' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15';

UPDATE public."Employee" SET email = 'sarah.j@vms.local', "fullName" = 'Sarah Jenkins' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11';
UPDATE public."Employee" SET email = 'david.c@vms.local', "fullName" = 'David Chen' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12';
UPDATE public."Employee" SET email = 'emma.r@vms.local', "fullName" = 'Emma Rodriguez' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13';
UPDATE public."Employee" SET email = 'robert.s@vms.local', "fullName" = 'Robert Sterling' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14';
UPDATE public."Employee" SET email = 'lisa.m@vms.local', "fullName" = 'Lisa Monroe' WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15';


-- STEP 0: Ensure all Indian branches exist in the Branch table (prevents FK violation)
INSERT INTO public."Branch" ("id", "name", "address", "timezone", "isActive") VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Bangalore HQ', '14 MG Road, Bengaluru, Karnataka 560001', 'Asia/Kolkata', TRUE),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Mumbai Office', '42 Nariman Point, Mumbai, Maharashtra 400021', 'Asia/Kolkata', TRUE),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'Pune Office', '7 Baner Road, Pune, Maharashtra 411045', 'Asia/Kolkata', TRUE),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'Gurgaon Office', 'DLF Cyber City, Sector 25, Gurgaon, Haryana 122002', 'Asia/Kolkata', TRUE)
ON CONFLICT (id) DO UPDATE SET
  "name" = EXCLUDED."name",
  "address" = EXCLUDED."address",
  "timezone" = EXCLUDED."timezone",
  "isActive" = EXCLUDED."isActive";

-- STEP 1: Insert into auth.users (Credentials for authentication)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change_token_new, recovery_token, email_change,
  phone, phone_change_token, phone_change, email_change_token_current, reauthentication_token
) VALUES 
-- ── Bangalore HQ Staff & Employees ──
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a101', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'admin.blr@vms.local', crypt('Admin@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Prakash Raj"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c101', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'security.blr@vms.local', crypt('Security@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Guard"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
-- ── Bangalore HQ Employees (US Staff) ──
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'sarah.j@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Jenkins"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'david.c@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"David Chen"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'emma.r@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Emma Rodriguez"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'robert.s@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Robert Sterling"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'lisa.m@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Lisa Monroe"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
-- ── Bangalore HQ Employees (Indian Staff) ──
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'priya.s@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Sharma"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'arjun.n@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Arjun Nair"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d53', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'kavitha.r@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Kavitha Reddy"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d54', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'suresh.i@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Suresh Iyer"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d55', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'deepa.m@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Deepa Menon"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),

-- ── Mumbai Office Staff & Employees ──
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a102', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'admin.mum@vms.local', crypt('Admin@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Karan Johar"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c102', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'security.mum@vms.local', crypt('Security@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Vijay Salgaonkar"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'rahul.d@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Rahul Desai"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'sneha.p@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Sneha Patil"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'anita.j@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Anita Joshi"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'vikram.m@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Vikram Mehta"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d25', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'pooja.k@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Pooja Kulkarni"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),

-- ── Pune Office Staff & Employees ──
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a103', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'admin.pun@vms.local', crypt('Admin@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Aditya Birla"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c103', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'security.pun@vms.local', crypt('Security@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Tanaji Malusare"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d31', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'amit.k@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Amit Kulkarni"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'neha.d@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Neha Deshpande"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'ravi.b@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Ravi Bhosale"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'sunita.w@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Sunita Wagh"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'kiran.j@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Kiran Jadhav"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),

-- ── Gurgaon Office Staff & Employees ──
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a104', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'admin.gur@vms.local', crypt('Admin@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Rakesh Jhunjhunwala"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c104', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'security.gur@vms.local', crypt('Security@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Baldev Singh"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'rohit.g@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Rohit Gupta"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'anjali.s@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Anjali Singh"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'manish.v@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Manish Verma"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'pooja.a@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Pooja Agarwal"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'sanjay.k@vms.local', crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Sanjay Khanna"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = now(),
  updated_at = now();

-- STEP 2: Seed Identities so GoTrue can authenticate them
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES 
-- Bangalore HQ Staff & Employees
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a101', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a101', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a101", "email": "admin.blr@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a101', now(), now(), now()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c101', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c101', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c101", "email": "security.blr@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c101', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11", "email": "sarah.j@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12", "email": "david.c@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13", "email": "emma.r@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14", "email": "robert.s@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15", "email": "lisa.m@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d51", "email": "priya.s@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d52", "email": "arjun.n@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d53', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d53', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d53", "email": "kavitha.r@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d53', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d54', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d54', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d54", "email": "suresh.i@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d54', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d55', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d55', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d55", "email": "deepa.m@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d55', now(), now(), now()),

-- Mumbai Office Staff & Employees
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a102', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a102', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a102", "email": "admin.mum@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a102', now(), now(), now()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c102', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c102', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c102", "email": "security.mum@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c102', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21", "email": "rahul.d@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22", "email": "sneha.p@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23", "email": "anita.j@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24", "email": "vikram.m@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d25', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d25', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d25", "email": "pooja.k@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d25', now(), now(), now()),

-- Pune Office Staff & Employees
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a103', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a103', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a103", "email": "admin.pun@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a103', now(), now(), now()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c103', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c103', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c103", "email": "security.pun@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c103', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d31', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d31', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d31", "email": "amit.k@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d31', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32", "email": "neha.d@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33", "email": "ravi.b@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34", "email": "sunita.w@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35", "email": "kiran.j@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35', now(), now(), now()),

-- Gurgaon Office Staff & Employees
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a104', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a104', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a104", "email": "admin.gur@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a104', now(), now(), now()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c104', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c104', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c104", "email": "security.gur@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c104', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41", "email": "rohit.g@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42", "email": "anjali.s@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43", "email": "manish.v@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44", "email": "pooja.a@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d45", "email": "sanjay.k@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', now(), now(), now())
ON CONFLICT DO NOTHING;

-- STEP 3: Map auth users to public "User" profiles with correct branchIds
INSERT INTO public."User" ("id", "email", "fullName", "roleId", "branchId", "phone") VALUES
-- Bangalore HQ Staff & Employees
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a101', 'admin.blr@vms.local', 'Prakash Raj', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+91 99887 76655'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c101', 'security.blr@vms.local', 'Marcus Guard', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+91 99887 76657'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'sarah.j@vms.local', 'Sarah Jenkins', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2001'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'david.c@vms.local', 'David Chen', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2002'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'emma.r@vms.local', 'Emma Rodriguez', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2003'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'robert.s@vms.local', 'Robert Sterling', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2004'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'lisa.m@vms.local', 'Lisa Monroe', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2005'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d51', 'priya.s@vms.local', 'Priya Sharma', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+91 98450 11001'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d52', 'arjun.n@vms.local', 'Arjun Nair', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+91 98450 11002'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d53', 'kavitha.r@vms.local', 'Kavitha Reddy', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+91 98450 11003'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d54', 'suresh.i@vms.local', 'Suresh Iyer', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+91 98450 11004'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d55', 'deepa.m@vms.local', 'Deepa Menon', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+91 98450 11005'),

-- Mumbai Office Staff & Employees
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a102', 'admin.mum@vms.local', 'Karan Johar', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', '+91 98765 43210'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c102', 'security.mum@vms.local', 'Vijay Salgaonkar', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', '+91 98765 43212'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'rahul.d@vms.local', 'Rahul Desai', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', '+91 98200 21001'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'sneha.p@vms.local', 'Sneha Patil', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', '+91 98200 21002'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', 'anita.j@vms.local', 'Anita Joshi', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', '+91 98200 21003'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', 'vikram.m@vms.local', 'Vikram Mehta', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', '+91 98200 21004'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d25', 'pooja.k@vms.local', 'Pooja Kulkarni', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', '+91 98200 21005'),

-- Pune Office Staff & Employees
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a103', 'admin.pun@vms.local', 'Aditya Birla', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', '+91 95450 12345'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c103', 'security.pun@vms.local', 'Tanaji Malusare', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', '+91 95450 12347'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d31', 'amit.k@vms.local', 'Amit Kulkarni', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', '+91 98220 31001'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32', 'neha.d@vms.local', 'Neha Deshpande', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', '+91 98220 31002'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33', 'ravi.b@vms.local', 'Ravi Bhosale', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', '+91 98220 31003'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34', 'sunita.w@vms.local', 'Sunita Wagh', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', '+91 98220 31004'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35', 'kiran.j@vms.local', 'Kiran Jadhav', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', '+91 98220 31005'),

-- Gurgaon Office Staff & Employees
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38a104', 'admin.gur@vms.local', 'Rakesh Jhunjhunwala', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', '+91 98110 56789'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd38c104', 'security.gur@vms.local', 'Baldev Singh', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', '+91 98110 56791'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d41', 'rohit.g@vms.local', 'Rohit Gupta', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', '+91 98110 41001'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d42', 'anjali.s@vms.local', 'Anjali Singh', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', '+91 98110 41002'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d43', 'manish.v@vms.local', 'Manish Verma', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', '+91 98110 41003'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'pooja.a@vms.local', 'Pooja Agarwal', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', '+91 98110 41004'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'sanjay.k@vms.local', 'Sanjay Khanna', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', '+91 98110 41005')
ON CONFLICT (id) DO UPDATE SET
  "email" = EXCLUDED."email",
  "fullName" = EXCLUDED."fullName",
  "roleId" = EXCLUDED."roleId",
  "branchId" = EXCLUDED."branchId",
  "phone" = EXCLUDED."phone";

-- STEP 4: Fix confirmation fields to bypass GoTrue errors
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  phone_change = COALESCE(phone_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE email LIKE '%@vms.local';

-- STEP 5: Sync email address changes inside auth.identities
UPDATE auth.identities
SET identity_data = jsonb_build_object('sub', user_id, 'email', u.email)
FROM auth.users u
WHERE auth.identities.user_id = u.id AND u.email LIKE '%@vms.local';

