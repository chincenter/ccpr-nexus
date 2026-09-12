create type risk_category as enum (
  'operational', 'financial', 'security', 'reputational', 'programmatic', 'compliance', 'other'
);

create type risk_level as enum ('low', 'medium', 'high');

create type risk_status as enum ('open', 'mitigating', 'monitoring', 'closed');

create table public.risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete cascade,
  title text not null,
  category risk_category not null default 'operational',
  description text,
  likelihood risk_level not null default 'medium',
  impact risk_level not null default 'medium',
  mitigation text,
  responsible_staff_id uuid references public.staff(id),
  status risk_status not null default 'open',
  due_date date,
  review_date date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  constraint risks_scope_chk check (project_id is not null or programme_id is not null)
);

create index risks_project_idx on public.risks(project_id);
create index risks_programme_idx on public.risks(programme_id);
create index risks_status_idx on public.risks(status);
create index risks_responsible_idx on public.risks(responsible_staff_id);

create trigger risks_set_updated_at
  before update on public.risks
  for each row execute function app.set_updated_at();

create trigger audit_risks
  after insert or update or delete on public.risks
  for each row execute function app.audit_row_change();

alter table public.risks enable row level security;

create or replace function app.has_risk_access(p_project_id uuid, p_programme_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (p_project_id is not null and app.has_project_access(p_project_id))
    or (p_programme_id is not null and app.has_programme_access(p_programme_id));
$$;

create policy risks_select on public.risks
  for select using (app.has_risk_access(project_id, programme_id));

create policy risks_insert on public.risks
  for insert with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());

create policy risks_update on public.risks
  for update
  using (app.has_risk_access(project_id, programme_id) and app.is_operational_role())
  with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());

create policy risks_delete on public.risks
  for delete using (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
