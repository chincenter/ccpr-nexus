-- Every RLS policy calls helper functions in the `app` schema. Postgres
-- requires the *calling* role to have USAGE on the schema and EXECUTE on
-- the function even when the function itself is SECURITY DEFINER — that
-- grant was missing, which would have made every RLS-protected query fail
-- with "permission denied for schema app" for real (non-superuser) traffic
-- from the Supabase client. `anon` deliberately gets nothing here: every
-- table in this schema requires a signed-in staff member.
grant usage on schema app to authenticated;
grant execute on all functions in schema app to authenticated;
alter default privileges in schema app grant execute on functions to authenticated;
