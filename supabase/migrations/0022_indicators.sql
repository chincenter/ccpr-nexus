create type indicator_result_type as enum ('objective', 'outcome', 'output');

create table public.indicators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete cascade,
  result_type indicator_result_type,
  result_id uuid,
  name text not null,
  definition text,
  unit text,
  baseline numeric,
  target numeric,
  actual numeric,
  reporting_period text,
  data_source text,
  responsible_staff_id uuid references public.staff(id),
  verification_status approval_status not null default 'draft',
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  constraint indicators_scope_chk check (project_id is not null or programme_id is not null),
  constraint indicators_result_chk check (
    (result_type is null and result_id is null) or (result_type is not null and result_id is not null)
  ),
  constraint indicators_baseline_nonneg check (baseline is null or baseline >= 0),
  constraint indicators_target_nonneg check (target is null or target >= 0),
  constraint indicators_actual_nonneg check (actual is null or actual >= 0)
);

create index indicators_project_idx on public.indicators(project_id);
create index indicators_programme_idx on public.indicators(programme_id);
create index indicators_responsible_idx on public.indicators(responsible_staff_id);

create trigger indicators_set_updated_at
  before update on public.indicators
  for each row execute function app.set_updated_at();

create trigger audit_indicators
  after insert or update or delete on public.indicators
  for each row execute function app.audit_row_change();

alter table public.indicators enable row level security;

-- Same project-or-programme scoping shape as risks; reuse that check.
create policy indicators_select on public.indicators
  for select using (app.has_risk_access(project_id, programme_id));

create policy indicators_insert on public.indicators
  for insert with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());

create policy indicators_update on public.indicators
  for update
  using (app.has_risk_access(project_id, programme_id) and (app.is_operational_role() or app.current_role() = 'me_meal'))
  with check (app.has_risk_access(project_id, programme_id) and (app.is_operational_role() or app.current_role() = 'me_meal'));

create policy indicators_delete on public.indicators
  for delete using (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
