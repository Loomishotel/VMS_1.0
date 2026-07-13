-- ==========================================
-- VISITOR MANAGEMENT SYSTEM (VMS) SCHEMAS
-- ==========================================

-- Enable PGCrypto extension for password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Role table
CREATE TABLE IF NOT EXISTS "Role" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "isSystemRole" BOOLEAN DEFAULT FALSE
);

-- 2. Create Permission table
CREATE TABLE IF NOT EXISTS "Permission" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT UNIQUE NOT NULL,
  "description" TEXT
);

-- 3. Create RolePermission table
CREATE TABLE IF NOT EXISTS "RolePermission" (
  "roleId" UUID REFERENCES "Role"("id") ON DELETE CASCADE,
  "permissionId" UUID REFERENCES "Permission"("id") ON DELETE CASCADE,
  PRIMARY KEY ("roleId", "permissionId")
);

-- 4. Create Branch table
CREATE TABLE IF NOT EXISTS "Branch" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE
);

-- 5. Create Department table
CREATE TABLE IF NOT EXISTS "Department" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "branchId" UUID REFERENCES "Branch"("id") ON DELETE CASCADE
);

-- 6. Create User Profile table (linked to auth.users)
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY REFERENCES auth.users("id") ON DELETE CASCADE,
  "email" TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  "roleId" UUID REFERENCES "Role"("id"),
  "branchId" UUID REFERENCES "Branch"("id"),
  "phone" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "mfaEnabled" BOOLEAN DEFAULT FALSE,
  "lastLoginAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger function to automatically sync auth.users inserts into the public "User" table
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

-- Trigger to execute the sync function on INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 7. Create Employee table
CREATE TABLE IF NOT EXISTS "Employee" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fullName" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT NOT NULL,
  "floor" TEXT,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "departmentId" UUID REFERENCES "Department"("id") ON DELETE RESTRICT,
  "branchId" UUID REFERENCES "Branch"("id") ON DELETE CASCADE
);

-- 8. Create Visitor table
CREATE TABLE IF NOT EXISTS "Visitor" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "photoUrl" TEXT,
  "idDocumentType" TEXT,
  "idDocumentNumber" TEXT,
  "company" TEXT,
  "visitorType" TEXT DEFAULT 'Guest' NOT NULL,
  "isBlacklisted" BOOLEAN DEFAULT FALSE,
  "location" TEXT,
  "blacklistFlag" TEXT DEFAULT 'none' NOT NULL,
  "flaggedByUserId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "flaggedAt" TIMESTAMP WITH TIME ZONE,
  "flagReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create Visit table
CREATE TABLE IF NOT EXISTS "Visit" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visitorId" UUID REFERENCES "Visitor"("id") ON DELETE CASCADE,
  "hostEmployeeId" UUID REFERENCES "Employee"("id") ON DELETE RESTRICT,
  "invitationId" UUID,
  "branchId" UUID REFERENCES "Branch"("id") ON DELETE CASCADE,
  "purpose" TEXT NOT NULL,
  "status" TEXT DEFAULT 'Expected' NOT NULL,
  "scheduledAt" TIMESTAMP WITH TIME ZONE,
  "checkedInAt" TIMESTAMP WITH TIME ZONE,
  "checkedOutAt" TIMESTAMP WITH TIME ZONE,
  "deniedReason" TEXT,
  "zoneAccess" TEXT,
  "additionalGuests" INTEGER DEFAULT 0 NOT NULL,
  "createdByUserId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create Invitation table
CREATE TABLE IF NOT EXISTS "Invitation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visitorId" UUID REFERENCES "Visitor"("id") ON DELETE CASCADE,
  "hostEmployeeId" UUID REFERENCES "Employee"("id") ON DELETE RESTRICT,
  "qrToken" TEXT UNIQUE NOT NULL,
  "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint to Visit for invitationId
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL;

-- 11. Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipientUserId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "recipientVisitorId" UUID REFERENCES "Visitor"("id") ON DELETE SET NULL,
  "visitId" UUID REFERENCES "Visit"("id") ON DELETE CASCADE,
  "channel" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT DEFAULT 'Queued' NOT NULL,
  "sentAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Create Badge table
CREATE TABLE IF NOT EXISTS "Badge" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visitId" UUID UNIQUE REFERENCES "Visit"("id") ON DELETE CASCADE,
  "printedAt" TIMESTAMP WITH TIME ZONE,
  "printCount" INTEGER DEFAULT 0 NOT NULL,
  "badgeNumber" TEXT UNIQUE NOT NULL
);

-- 13. Create AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "beforeState" JSONB,
  "afterState" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Create Blacklist table
CREATE TABLE IF NOT EXISTS "Blacklist" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visitorId" UUID REFERENCES "Visitor"("id") ON DELETE SET NULL,
  "fullName" TEXT NOT NULL,
  "idDocumentNumber" TEXT,
  "reason" TEXT NOT NULL,
  "severity" TEXT DEFAULT 'Medium' NOT NULL,
  "addedByUserId" UUID REFERENCES "User"("id") ON DELETE RESTRICT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Create Setting table
CREATE TABLE IF NOT EXISTS "Setting" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "branchId" UUID REFERENCES "Branch"("id") ON DELETE CASCADE,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  CONSTRAINT "Setting_branchId_key_key" UNIQUE ("branchId", "key")
);

-- 16. Create Document table
CREATE TABLE IF NOT EXISTS "Document" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "visitorId" UUID REFERENCES "Visitor"("id") ON DELETE CASCADE,
  "visitId" UUID REFERENCES "Visit"("id") ON DELETE SET NULL,
  "documentType" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- BOOTSTRAP DATA (SEED FILES)
-- ==========================================

-- Seed Roles
INSERT INTO "Role" ("id", "name", "description", "isSystemRole") VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin', 'Overall system administration and configuration access', TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Security', 'Lobby guard and safety blacklist controls', TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Employee', 'Company host employee profile', TRUE)
ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";

-- Seed Permissions
INSERT INTO "Permission" ("code", "description") VALUES
('visitor.create', 'Register new visitors'),
('visitor.view', 'View visitor registry'),
('visitor.blacklist', 'Blacklist visitor entries'),
('blacklist.manage', 'Modify security blacklists'),
('report.view', 'View trend analytics reports'),
('evac.trigger', 'Trigger evacuation protocols')
ON CONFLICT ("code") DO NOTHING;

-- Seed Branch
INSERT INTO "Branch" ("id", "name", "address", "timezone") VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Silicon Valley HQ', '300 Innovation Way, San Jose, CA', 'America/Los_Angeles')
ON CONFLICT DO NOTHING;

-- Seed Departments
INSERT INTO "Department" ("id", "name", "branchId") VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'Engineering', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'Human Resources', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'Facilities', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 'Executive Staff', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11')
ON CONFLICT DO NOTHING;

-- Seed Host Employees
INSERT INTO "Employee" ("id", "fullName", "email", "phone", "floor", "departmentId", "branchId", "isActive") VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'Sarah Jenkins', 'sarah.j@vms.local', '+1 (555) 101-2001', '3rd Floor', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', TRUE),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'David Chen', 'david.c@vms.local', '+1 (555) 101-2002', '2nd Floor', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', TRUE),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'Emma Rodriguez', 'emma.r@vms.local', '+1 (555) 101-2003', 'Ground Floor', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', TRUE),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'Robert Sterling', 'robert.s@vms.local', '+1 (555) 101-2004', '4th Floor', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', TRUE),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'Lisa Monroe', 'lisa.m@vms.local', '+1 (555) 101-2005', '4th Floor', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', TRUE)
ON CONFLICT DO NOTHING;


-- ==========================================
-- CREATE AUTH USERS IN SUPABASE auth.users
-- ==========================================

-- Admin User
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change_token_new, recovery_token, email_change,
  phone, phone_change_token, phone_change, email_change_token_current, reauthentication_token
) VALUES (
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'admin@vms.local', crypt('Admin@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"System Admin"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Security Users
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change_token_new, recovery_token, email_change,
  phone, phone_change_token, phone_change, email_change_token_current, reauthentication_token
) VALUES 
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'security@vms.local', crypt('Security@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Guard"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
),
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'security2@vms.local', crypt('Security@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Sam Guard"}', now(), now(),
  '', '', '', '', NULL, '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Employee Users
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change_token_new, recovery_token, email_change,
  phone, phone_change_token, phone_change, email_change_token_current, reauthentication_token
) VALUES 
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
) ON CONFLICT (id) DO NOTHING;

-- Seed Identities so GoTrue can associate logins
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES 
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11", "email": "admin@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', now(), now(), now()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13", "email": "security@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', now(), now(), now()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23", "email": "security2@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11", "email": "sarah.j@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12", "email": "david.c@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13", "email": "emma.r@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14", "email": "robert.s@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15", "email": "lisa.m@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', now(), now(), now())
ON CONFLICT DO NOTHING;


-- ==========================================
-- MAP AUTH USERS TO PUBLIC "User" TABLE
-- ==========================================

INSERT INTO "User" ("id", "email", "fullName", "roleId", "branchId", "phone") VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'admin@vms.local', 'System Admin', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 019-9000'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', 'security@vms.local', 'Marcus Guard', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 019-9002'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', 'security2@vms.local', 'Sam Guard', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 019-9004'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'sarah.j@vms.local', 'Sarah Jenkins', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2001'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'david.c@vms.local', 'David Chen', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2002'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'emma.r@vms.local', 'Emma Rodriguez', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2003'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'robert.s@vms.local', 'Robert Sterling', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2004'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'lisa.m@vms.local', 'Lisa Monroe', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2005')
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- SEED SAMPLE VISITORS AND VISITS
-- ==========================================

INSERT INTO "Visitor" ("id", "fullName", "email", "phone", "company", "visitorType", "isBlacklisted") VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'Alice Miller', 'alice.m@gmail.com', '+1 (555) 234-5678', 'TechCorp', 'Vendor', FALSE),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'Bob Smith', 'bob.s@yahoo.com', '+1 (555) 876-5432', 'DesignStudio', 'Guest', FALSE),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'Mallory Hax', 'mallory@threat.net', '+1 (555) 666-9999', 'CompeteInc', 'Guest', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Add Mallory to Security Blacklist table
INSERT INTO "Blacklist" ("visitorId", "fullName", "reason", "severity", "addedByUserId") VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'Mallory Hax', 'Attempted unauthorized server room entry during executive presentation.', 'High', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13')
ON CONFLICT DO NOTHING;

-- Seed Sample Visits
INSERT INTO "Visit" ("id", "visitorId", "hostEmployeeId", "branchId", "purpose", "status", "scheduledAt", "checkedInAt") VALUES
('aa00bc99-9c0b-4ef8-bb6d-6bb9bd38aa11', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Scheduled server maintenance', 'CheckedIn', now() - INTERVAL '2 hours', now() - INTERVAL '1 hour 45 minutes'),
('aa00bc99-9c0b-4ef8-bb6d-6bb9bd38aa12', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Product design brainstorm', 'Waiting', now() - INTERVAL '10 minutes', now() - INTERVAL '5 minutes')
ON CONFLICT DO NOTHING;

-- Enable Realtime for the Visit table
ALTER TABLE "Visit" REPLICA IDENTITY FULL;
alter publication supabase_realtime add table "Visit";
