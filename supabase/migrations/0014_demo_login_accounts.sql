-- DEMO DATA — NOT REAL CCPR DATA
-- A handful of demo logins across roles, so different access levels can
-- actually be explored (and were used to verify RLS denials below) without
-- needing a full invite flow yet. Shared password, clearly a demo-only
-- credential — documented in README, never used for the real admin account.

do $$
declare
  v_password text := crypt('CcprNexusDemo2026!', gen_salt('bf'));
  v_user record;
begin
  for v_user in
    select * from (values
      ('11111111-1111-1111-1111-111111111118', 'demo.viewer@ccpr-nexus.test'),
      ('11111111-1111-1111-1111-111111111107', 'demo.po.emergency@ccpr-nexus.test'),
      ('11111111-1111-1111-1111-111111111117', 'demo.finance@ccpr-nexus.test'),
      ('11111111-1111-1111-1111-111111111115', 'demo.assistant@ccpr-nexus.test')
    ) as t(staff_id, email)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user.staff_id::uuid,
      'authenticated',
      'authenticated',
      v_user.email,
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
      v_user.staff_id::uuid,
      v_user.staff_id::uuid,
      jsonb_build_object('sub', v_user.staff_id, 'email', v_user.email, 'email_verified', true),
      'email',
      now(), now(), now()
    );
  end loop;
end $$;
