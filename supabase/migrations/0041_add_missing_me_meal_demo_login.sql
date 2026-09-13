-- DEMO DATA — NOT REAL CCPR DATA
--
-- Root cause of the "me_meal access gap" flagged in M&E verification:
-- 0014_demo_login_accounts.sql created auth.users rows for 4 demo staff
-- (viewer, project officer, finance, project assistant) but never included
-- the "Demo MEAL Officer" staff row (id ...116, system_role = 'me_meal').
-- No code, RLS, or naming defect was found anywhere — every check already
-- uses 'me_meal' consistently (grep-verified across frontend, actions,
-- RLS policies, and the indicator verification trigger). The role simply
-- had no login account to test it with. This adds exactly one account,
-- using the identical mechanism and demo password as 0014, so it's picked
-- up by the existing app.handle_new_auth_user() trigger (email-matches an
-- unlinked staff row -> sets staff.user_id) with no other code changes.

do $$
declare
  v_password text := crypt('CcprNexusDemo2026!', gen_salt('bf'));
  v_staff_id uuid := '11111111-1111-1111-1111-111111111116';
  v_email text := 'demo.meal@ccpr-nexus.test';
begin
  if exists (select 1 from auth.users where id = v_staff_id) then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_staff_id,
    'authenticated',
    'authenticated',
    v_email,
    v_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    v_staff_id,
    v_staff_id,
    jsonb_build_object('sub', v_staff_id, 'email', v_email, 'email_verified', true),
    'email',
    now(), now(), now()
  );
end $$;
