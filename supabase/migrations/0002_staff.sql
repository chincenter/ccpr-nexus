-- Generic updated_at trigger, reused by every table below.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  job_title text,
  system_role system_role not null default 'viewer',
  email text not null unique,
  phone text,
  is_active boolean not null default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create index staff_user_id_idx on public.staff(user_id);
create index staff_email_idx on public.staff(lower(email));
create index staff_system_role_idx on public.staff(system_role);

create trigger staff_set_updated_at
  before update on public.staff
  for each row execute function app.set_updated_at();

alter table public.staff enable row level security;

-- Security-definer helpers used throughout RLS policies -----------------
-- SECURITY DEFINER with a locked search_path so they can't be hijacked by
-- a session-local search_path change, and so they can read `staff` even
-- from within another table's restrictive policy evaluation.

create or replace function app.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.staff where user_id = auth.uid();
$$;

create or replace function app.current_role()
returns system_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select system_role from public.staff where user_id = auth.uid();
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app.current_role() = 'super_admin';
$$;

create or replace function app.is_management()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app.current_role() in ('super_admin', 'executive');
$$;

-- Auto-link a newly signed-up auth user to a pre-created staff row that
-- shares their email, so access is FK-based (staff.user_id) from then on,
-- never re-derived by matching email text on every query.
create or replace function app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.staff
  set user_id = new.id
  where lower(email) = lower(new.email)
    and user_id is null;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_auth_user();
