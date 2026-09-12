create table public.activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  output_id uuid not null references public.outputs(id),
  name text not null,
  description text,
  location_id uuid references public.locations(id),
  responsible_staff_id uuid references public.staff(id),
  start_date date,
  end_date date,
  target numeric(14, 2) check (target is null or target >= 0),
  actual numeric(14, 2) check (actual is null or actual >= 0),
  budget numeric(14, 2) check (budget is null or budget >= 0),
  status activity_status not null default 'not_started',
  priority priority_level not null default 'medium',
  verification_status approval_status not null default 'draft',
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  constraint activities_dates_chk check (end_date is null or start_date is null or end_date >= start_date)
);

create index activities_project_idx on public.activities(project_id);
create index activities_output_idx on public.activities(output_id);
create index activities_responsible_idx on public.activities(responsible_staff_id);
create index activities_location_idx on public.activities(location_id);
create index activities_status_idx on public.activities(status);

-- An activity's project_id is always derived from its output, never taken
-- from client input, so it can never drift into an isolated/orphan record
-- even if the client sends a mismatched project_id.
create or replace function app.activities_sync_project_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.project_id := app.project_id_for_output(new.output_id);
  if new.project_id is null then
    raise exception 'output % does not resolve to a project', new.output_id;
  end if;
  return new;
end;
$$;

create trigger activities_sync_project_id
  before insert or update of output_id on public.activities
  for each row execute function app.activities_sync_project_id();

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function app.set_updated_at();

alter table public.activities enable row level security;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  name text not null,
  description text,
  responsible_staff_id uuid references public.staff(id),
  start_date date,
  due_date date,
  status task_status not null default 'not_started',
  progress numeric(5, 2) not null default 0 check (progress between 0 and 100),
  priority priority_level not null default 'medium',
  dependency_task_id uuid references public.tasks(id),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  constraint tasks_dates_chk check (due_date is null or start_date is null or due_date >= start_date),
  constraint tasks_no_self_dependency check (dependency_task_id is null or dependency_task_id <> id)
);

create index tasks_activity_idx on public.tasks(activity_id);
create index tasks_responsible_idx on public.tasks(responsible_staff_id);
create index tasks_status_idx on public.tasks(status);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function app.set_updated_at();

alter table public.tasks enable row level security;

create or replace function app.project_id_for_activity(p_activity_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select project_id from public.activities where id = p_activity_id;
$$;

create or replace function app.project_id_for_task(p_task_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.project_id
  from public.tasks t
  join public.activities a on a.id = t.activity_id
  where t.id = p_task_id;
$$;
