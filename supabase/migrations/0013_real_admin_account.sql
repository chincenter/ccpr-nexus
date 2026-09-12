-- Seeds the one real (non-demo) login for this environment: the actual
-- super_admin, matching the staff row created in 0011_demo_org_data.sql.
-- This is the standard Supabase seed pattern for creating an auth user
-- directly via SQL (bcrypt via pgcrypto) rather than through the GoTrue
-- signup API, useful for bootstrapping the very first account.
--
-- IMPORTANT: the password below is a one-time setup password. Whoever
-- owns lalnunboris@gmail.com should sign in and change it immediately
-- once Users & Access (password reset) ships, or via Supabase Auth's
-- "reset password" email flow in the meantime.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'authenticated',
  'authenticated',
  'lalnunboris@gmail.com',
  crypt('CcprNexus!Setup2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '{"sub":"ffffffff-ffff-ffff-ffff-ffffffffffff","email":"lalnunboris@gmail.com","email_verified":true}'::jsonb,
  'email',
  now(),
  now(),
  now()
);

-- The on_auth_user_created trigger (0002_staff.sql) links this user to the
-- pre-existing staff row with the same email automatically on insert.
