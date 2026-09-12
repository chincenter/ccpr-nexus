create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  currency text not null default 'USD',
  approved_budget numeric(14, 2) not null default 0 check (approved_budget >= 0),
  revised_budget numeric(14, 2) check (revised_budget is null or revised_budget >= 0),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function app.set_updated_at();

create trigger audit_budgets
  after insert or update or delete on public.budgets
  for each row execute function app.audit_row_change();

alter table public.budgets enable row level security;

create table public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  line_name text not null,
  category text,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create index budget_lines_budget_idx on public.budget_lines(budget_id);

create trigger budget_lines_set_updated_at
  before update on public.budget_lines
  for each row execute function app.set_updated_at();

create trigger audit_budget_lines
  after insert or update or delete on public.budget_lines
  for each row execute function app.audit_row_change();

alter table public.budget_lines enable row level security;

create table public.expenditures (
  id uuid primary key default gen_random_uuid(),
  budget_line_id uuid not null references public.budget_lines(id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  expense_date date not null default current_date,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create index expenditures_line_idx on public.expenditures(budget_line_id);

create trigger expenditures_set_updated_at
  before update on public.expenditures
  for each row execute function app.set_updated_at();

create trigger audit_expenditures
  after insert or update or delete on public.expenditures
  for each row execute function app.audit_row_change();

alter table public.expenditures enable row level security;

create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  budget_line_id uuid not null references public.budget_lines(id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  commitment_date date not null default current_date,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create index commitments_line_idx on public.commitments(budget_line_id);

create trigger commitments_set_updated_at
  before update on public.commitments
  for each row execute function app.set_updated_at();

create trigger audit_commitments
  after insert or update or delete on public.commitments
  for each row execute function app.audit_row_change();

alter table public.commitments enable row level security;

-- Scope helpers -----------------------------------------------------
create or replace function app.project_id_for_budget(p_budget_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select project_id from public.budgets where id = p_budget_id;
$$;

create or replace function app.project_id_for_budget_line(p_budget_line_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select b.project_id from public.budget_lines bl join public.budgets b on b.id = bl.budget_id
  where bl.id = p_budget_line_id;
$$;

-- Finance data is deliberately narrower than most project data: seen by
-- finance staff, management, and the project's own operational team, but
-- not by project_assistant or viewer (least privilege, per spec section 8/22).
create or replace function app.has_finance_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app.has_project_access(p_project_id)
    and (app.is_operational_role() or app.current_role() = 'finance');
$$;

create policy budgets_select on public.budgets
  for select using (app.has_finance_access(project_id));
create policy budgets_insert on public.budgets
  for insert with check (app.has_finance_access(project_id) and app.current_role() in ('finance', 'super_admin', 'executive'));
create policy budgets_update on public.budgets
  for update
  using (app.has_finance_access(project_id) and app.current_role() in ('finance', 'super_admin', 'executive'))
  with check (app.has_finance_access(project_id) and app.current_role() in ('finance', 'super_admin', 'executive'));

create policy budget_lines_select on public.budget_lines
  for select using (app.has_finance_access(app.project_id_for_budget(budget_id)));
create policy budget_lines_insert on public.budget_lines
  for insert with check (app.has_finance_access(app.project_id_for_budget(budget_id)) and app.current_role() in ('finance', 'super_admin', 'executive'));
create policy budget_lines_update on public.budget_lines
  for update
  using (app.has_finance_access(app.project_id_for_budget(budget_id)) and app.current_role() in ('finance', 'super_admin', 'executive'))
  with check (app.has_finance_access(app.project_id_for_budget(budget_id)) and app.current_role() in ('finance', 'super_admin', 'executive'));

create policy expenditures_select on public.expenditures
  for select using (app.has_finance_access(app.project_id_for_budget_line(budget_line_id)));
create policy expenditures_insert on public.expenditures
  for insert with check (app.has_finance_access(app.project_id_for_budget_line(budget_line_id)) and app.current_role() in ('finance', 'super_admin', 'executive'));
create policy expenditures_update on public.expenditures
  for update
  using (app.has_finance_access(app.project_id_for_budget_line(budget_line_id)) and app.current_role() in ('finance', 'super_admin', 'executive'))
  with check (app.has_finance_access(app.project_id_for_budget_line(budget_line_id)) and app.current_role() in ('finance', 'super_admin', 'executive'));

create policy commitments_select on public.commitments
  for select using (app.has_finance_access(app.project_id_for_budget_line(budget_line_id)));
create policy commitments_insert on public.commitments
  for insert with check (app.has_finance_access(app.project_id_for_budget_line(budget_line_id)) and app.current_role() in ('finance', 'super_admin', 'executive'));
create policy commitments_update on public.commitments
  for update
  using (app.has_finance_access(app.project_id_for_budget_line(budget_line_id)) and app.current_role() in ('finance', 'super_admin', 'executive'))
  with check (app.has_finance_access(app.project_id_for_budget_line(budget_line_id)) and app.current_role() in ('finance', 'super_admin', 'executive'));
