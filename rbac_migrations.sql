-- 1. Alter Visitor table to add flagging columns
ALTER TABLE "Visitor" 
ADD COLUMN IF NOT EXISTS "blacklistFlag" TEXT DEFAULT 'none' NOT NULL,
ADD COLUMN IF NOT EXISTS "flaggedByUserId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "flaggedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "flagReason" TEXT;

-- 2. Alter Visit table to add creator tracking
ALTER TABLE "Visit"
ADD COLUMN IF NOT EXISTS "createdByUserId" UUID REFERENCES "User"("id") ON DELETE SET NULL;

-- 3. Update the trigger function public.handle_new_auth_user
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
  v_full_name TEXT;
BEGIN
  IF NEW.email = 'admin@vms.local' THEN
    v_role_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  ELSIF NEW.email IN ('security@vms.local', 'security2@vms.local') THEN
    v_role_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
  ELSE
    v_role_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'; -- default Employee role
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.email = 'admin@vms.local' THEN 'System Admin'
      WHEN NEW.email = 'security@vms.local' THEN 'Marcus Guard'
      WHEN NEW.email = 'security2@vms.local' THEN 'Sam Guard'
      WHEN NEW.email = 'sarah.j@vms.local' THEN 'Sarah Jenkins'
      WHEN NEW.email = 'david.c@vms.local' THEN 'David Chen'
      WHEN NEW.email = 'emma.r@vms.local' THEN 'Emma Rodriguez'
      WHEN NEW.email = 'robert.s@vms.local' THEN 'Robert Sterling'
      WHEN NEW.email = 'lisa.m@vms.local' THEN 'Lisa Monroe'
      ELSE NEW.email
    END
  );

  INSERT INTO public."User" ("id", "email", "fullName", "roleId", "branchId", "phone", "isActive")
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_role_id,
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', -- Silicon Valley HQ
    NEW.phone,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    "email" = EXCLUDED.email,
    "fullName" = EXCLUDED."fullName",
    "roleId" = EXCLUDED."roleId";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Seed Lisa Monroe to Employee directory
INSERT INTO "Employee" ("id", "fullName", "email", "phone", "floor", "departmentId", "branchId", "isActive") VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'Lisa Monroe', 'lisa.m@vms.local', '+1 (555) 101-2005', '4th Floor', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', TRUE)
ON CONFLICT (id) DO UPDATE SET
  "fullName" = EXCLUDED."fullName",
  "email" = EXCLUDED."email",
  "phone" = EXCLUDED."phone",
  "floor" = EXCLUDED."floor",
  "departmentId" = EXCLUDED."departmentId",
  "branchId" = EXCLUDED."branchId",
  "isActive" = EXCLUDED."isActive";

-- 5. Seed new Auth users (Security 2, Receptionist 2, Employees 1-5)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change_token_new, recovery_token, email_change,
  phone, phone_change_token, phone_change, email_change_token_current, reauthentication_token
) VALUES 
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'security2@vms.local', crypt('Security@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sam Guard"}', now(), now(), '', '', '', '', NULL, '', '', '', ''),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.j@vms.local', crypt('Employee@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Jenkins"}', now(), now(), '', '', '', '', NULL, '', '', '', ''),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'david.c@vms.local', crypt('Employee@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Chen"}', now(), now(), '', '', '', '', NULL, '', '', '', ''),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emma.r@vms.local', crypt('Employee@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emma Rodriguez"}', now(), now(), '', '', '', '', NULL, '', '', '', ''),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'robert.s@vms.local', crypt('Employee@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Robert Sterling"}', now(), now(), '', '', '', '', NULL, '', '', '', ''),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lisa.m@vms.local', crypt('Employee@123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lisa Monroe"}', now(), now(), '', '', '', '', NULL, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES 
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23", "email": "security2@vms.local"}'::jsonb, 'email', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11", "email": "sarah.j@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12", "email": "david.c@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13", "email": "emma.r@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14", "email": "robert.s@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', now(), now(), now()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15", "email": "lisa.m@vms.local"}'::jsonb, 'email', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', now(), now(), now())
ON CONFLICT DO NOTHING;

-- 7. Seed public User profiles
INSERT INTO "User" ("id", "email", "fullName", "roleId", "branchId", "phone") VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', 'security2@vms.local', 'Sam Guard', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 019-9004'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'sarah.j@vms.local', 'Sarah Jenkins', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2001'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'david.c@vms.local', 'David Chen', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2002'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'emma.r@vms.local', 'Emma Rodriguez', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2003'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'robert.s@vms.local', 'Robert Sterling', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2004'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'lisa.m@vms.local', 'Lisa Monroe', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', '+1 (555) 101-2005')
ON CONFLICT (id) DO UPDATE SET
  "email" = EXCLUDED."email",
  "fullName" = EXCLUDED."fullName",
  "roleId" = EXCLUDED."roleId",
  "branchId" = EXCLUDED."branchId",
  "phone" = EXCLUDED."phone";

-- 8. Fix confirmation fields for seeded Auth users to bypass supabase gotrue errors
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
WHERE email IN (
  'admin@vms.local', 
  'security@vms.local', 'security2@vms.local', 'sarah.j@vms.local', 
  'david.c@vms.local', 'emma.r@vms.local', 'robert.s@vms.local', 'lisa.m@vms.local'
);
