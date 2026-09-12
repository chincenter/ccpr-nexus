create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category programme_category not null,
  description text,
  lead_staff_id uuid references public.staff(id),
  status lifecycle_status not null default 'planning',
  start_date date,
  end_date date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  constraint programmes_dates_chk check (end_date is null or start_date is null or end_date >= start_date)
);

create index programmes_lead_staff_idx on public.programmes(lead_staff_id);
create index programmes_status_idx on public.programmes(status);
create index programmes_category_idx on public.programmes(category);

create trigger programmes_set_updated_at
  before update on public.programmes
  for each row execute function app.set_updated_at();

alter table public.programmes enable row level security;

-- Which staff (typically programme_manager) can manage a whole programme,
-- beyond whoever is set as its lead_staff_id.
create table public.programme_access (
  programme_id uuid not null references public.programmes(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (programme_id, staff_id)
);

alter table public.programme_access enable row level security;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  programme_id uuid not null references public.programmes(id),
  donor text,
  project_officer_id uuid references public.staff(id),
  description text,
  start_date date,
  end_date date,
  status lifecycle_status not null default 'planning',
  budget numeric(14, 2) check (budget is null or budget >= 0),
  target_beneficiaries integer check (target_beneficiaries is null or target_beneficiaries >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  constraint projects_dates_chk check (end_date is null or start_date is null or end_date >= start_date)
);

create index projects_programme_idx on public.projects(programme_id);
create index projects_project_officer_idx on public.projects(project_officer_id);
create index projects_status_idx on public.projects(status);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function app.set_updated_at();

alter table public.projects enable row level security;

-- Project team membership (project assistants, M&E, finance focal points,
-- etc. assigned to a specific project beyond the single project_officer_id).
create table public.project_team (
  project_id uuid not null references public.projects(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  role_on_project text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, staff_id)
);

alter table public.project_team enable row level security;

-- Scope helpers that depend on the tables above -------------------------

create or replace function app.has_programme_access(p_programme_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    app.is_management()
    or exists (
      select 1 from public.programmes p
      where p.id = p_programme_id and p.lead_staff_id = app.current_staff_id()
    )
    or exists (
      select 1 from public.programme_access pa
      where pa.programme_id = p_programme_id and pa.staff_id = app.current_staff_id()
    );
$$;

create or replace function app.has_project_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    app.is_management()
    or exists (
      select 1 from public.projects pr
      where pr.id = p_project_id
        and (
          pr.project_officer_id = app.current_staff_id()
          or app.has_programme_access(pr.programme_id)
        )
    )
    or exists (
      select 1 from public.project_team pt
      where pt.project_id = p_project_id and pt.staff_id = app.current_staff_id()
    );
$$;
