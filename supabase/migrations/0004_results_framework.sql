create table public.objectives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text,
  name text not null,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create index objectives_project_idx on public.objectives(project_id);

create trigger objectives_set_updated_at
  before update on public.objectives
  for each row execute function app.set_updated_at();

alter table public.objectives enable row level security;

create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.objectives(id) on delete cascade,
  code text,
  name text not null,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create index outcomes_objective_idx on public.outcomes(objective_id);

create trigger outcomes_set_updated_at
  before update on public.outcomes
  for each row execute function app.set_updated_at();

alter table public.outcomes enable row level security;

create table public.outputs (
  id uuid primary key default gen_random_uuid(),
  outcome_id uuid not null references public.outcomes(id) on delete cascade,
  code text,
  name text not null,
  description text,
  target numeric(14, 2),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create index outputs_outcome_idx on public.outputs(outcome_id);

create trigger outputs_set_updated_at
  before update on public.outputs
  for each row execute function app.set_updated_at();

alter table public.outputs enable row level security;

-- Walk an output up to its project, since RLS scoping is always by project.
create or replace function app.project_id_for_output(p_output_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ob.project_id
  from public.outputs o
  join public.outcomes oc on oc.id = o.outcome_id
  join public.objectives ob on ob.id = oc.objective_id
  where o.id = p_output_id;
$$;
