-- =====================================================
-- FIX: Employee login + missing column patch
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- STEP 0: Add missing columns to Visit and Visitor tables
-- (These were in rbac_migrations.sql but may not have been applied to the live DB)
ALTER TABLE "Visit"
  ADD COLUMN IF NOT EXISTS "createdByUserId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "checkInCode"     TEXT UNIQUE;   -- ← Required for VMS check-in code feature

ALTER TABLE "Visitor"
  ADD COLUMN IF NOT EXISTS "blacklistFlag"    TEXT DEFAULT 'none' NOT NULL,
  ADD COLUMN IF NOT EXISTS "flaggedByUserId"  UUID REFERENCES "User"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "flaggedAt"        TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "flagReason"       TEXT;

-- STEP 1: Insert employee auth.users rows (must exist before public."User")
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change_token_new, recovery_token, email_change,
  phone, phone_change_token, phone_change, email_change_token_current, reauthentication_token
) VALUES 
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'sarah.j@vms.local',
  crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Jenkins"}',
  now(), now(), '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'david.c@vms.local',
  crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"David Chen"}',
  now(), now(), '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'emma.r@vms.local',
  crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Emma Rodriguez"}',
  now(), now(), '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'robert.s@vms.local',
  crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Robert Sterling"}',
  now(), now(), '', '', '', '', NULL, '', '', '', ''
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'lisa.m@vms.local',
  crypt('Employee@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Lisa Monroe"}',
  now(), now(), '', '', '', '', NULL, '', '', '', ''
)
ON CONFLICT (id) DO UPDATE SET
  email_confirmed_at = now(),
  updated_at = now();

-- STEP 2: Insert auth.identities (links login to auth.users)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11',
  '{"sub":"d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11","email":"sarah.j@vms.local"}'::jsonb,
  'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', now(), now(), now()
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12',
  '{"sub":"d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12","email":"david.c@vms.local"}'::jsonb,
  'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', now(), now(), now()
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13',
  '{"sub":"d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13","email":"emma.r@vms.local"}'::jsonb,
  'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', now(), now(), now()
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14',
  '{"sub":"d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14","email":"robert.s@vms.local"}'::jsonb,
  'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', now(), now(), now()
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15',
  '{"sub":"d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15","email":"lisa.m@vms.local"}'::jsonb,
  'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', now(), now(), now()
)
ON CONFLICT DO NOTHING;

-- STEP 3: Upsert public."User" profiles (FK to auth.users now satisfied)
INSERT INTO public."User" ("id", "email", "fullName", "roleId", "branchId", "phone", "isActive")
VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'sarah.j@vms.local',  'Sarah Jenkins',   'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2001', TRUE),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'david.c@vms.local',  'David Chen',      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2002', TRUE),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'emma.r@vms.local',   'Emma Rodriguez',  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2003', TRUE),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'robert.s@vms.local', 'Robert Sterling', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2004', TRUE),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'lisa.m@vms.local',   'Lisa Monroe',     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2005', TRUE)
ON CONFLICT (id) DO UPDATE SET
  "email"    = EXCLUDED."email",
  "fullName" = EXCLUDED."fullName",
  "roleId"   = EXCLUDED."roleId",
  "branchId" = EXCLUDED."branchId",
  "phone"    = EXCLUDED."phone",
  "isActive" = EXCLUDED."isActive";

-- STEP 4: Verify — should return 5 rows, all with role = 'Employee'
SELECT u.id, u.email, u."fullName", r.name AS role
FROM public."User" u
JOIN public."Role" r ON r.id = u."roleId"
WHERE u.email IN (
  'sarah.j@vms.local', 'david.c@vms.local', 'emma.r@vms.local',
  'robert.s@vms.local', 'lisa.m@vms.local'
);
