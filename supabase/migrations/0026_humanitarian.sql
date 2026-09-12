-- Humanitarian module (Phase 4, spec section 23): needs assessment ->
-- household -> beneficiary -> assistance plan -> distribution, all
-- connected to a project via real foreign keys (never free text).
--
-- "Minimize personal information" / "prevent duplicate beneficiary or
-- distribution records" from the spec drive two choices here:
--   - beneficiaries carry only age group + optional gender/vulnerability
--     category, never names beyond what the household record needs
--   - distribution_items has partial unique indexes so the same
--     household/beneficiary cannot be recorded twice in one distribution

create type age_group as enum ('child', 'youth', 'adult', 'elderly');

create type household_assistance_status as enum ('not_assessed', 'planned', 'assisted', 'ineligible');

create type assistance_type as enum ('food', 'nfi', 'cash', 'shelter', 'wash', 'protection', 'livelihood', 'other');

create type assistance_plan_status as enum ('planned', 'ongoing', 'completed', 'cancelled');

create table public.needs_assessments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  location_id uuid references public.locations(id),
  assessment_date date not null default current_date,
  population_estimate integer,
  priority priority_level not null default 'medium',
  needs text,
  findings text,
  conducted_by uuid references public.staff(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  location_id uuid references public.locations(id),
  household_code text not null,
  household_size integer,
  vulnerability_notes text,
  assistance_status household_assistance_status not null default 'not_assessed',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false,
  constraint households_project_code_uq unique (project_id, household_code)
);

create table public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  beneficiary_code text not null,
  age_group age_group not null default 'adult',
  gender text,
  vulnerability_category text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false,
  constraint beneficiaries_household_code_uq unique (household_id, beneficiary_code)
);

create table public.assistance_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  assistance_type assistance_type not null default 'other',
  unit text,
  planned_quantity numeric,
  target_criteria text,
  status assistance_plan_status not null default 'planned',
  start_date date,
  end_date date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create table public.distributions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  assistance_plan_id uuid references public.assistance_plans(id) on delete set null,
  location_id uuid references public.locations(id),
  distribution_date date not null default current_date,
  assistance_type assistance_type not null default 'other',
  unit text,
  notes text,
  conducted_by uuid references public.staff(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create table public.distribution_items (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid not null references public.distributions(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  beneficiary_id uuid references public.beneficiaries(id) on delete cascade,
  quantity numeric not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  constraint distribution_items_target_chk check (household_id is not null or beneficiary_id is not null)
);

create unique index distribution_items_household_uq
  on public.distribution_items(distribution_id, household_id)
  where household_id is not null;

create unique index distribution_items_beneficiary_uq
  on public.distribution_items(distribution_id, beneficiary_id)
  where beneficiary_id is not null;

create index needs_assessments_project_idx on public.needs_assessments(project_id);
create index households_project_idx on public.households(project_id);
create index beneficiaries_household_idx on public.beneficiaries(household_id);
create index assistance_plans_project_idx on public.assistance_plans(project_id);
create index distributions_project_idx on public.distributions(project_id);
create index distributions_plan_idx on public.distributions(assistance_plan_id);
create index distribution_items_distribution_idx on public.distribution_items(distribution_id);

create trigger needs_assessments_set_updated_at before update on public.needs_assessments for each row execute function app.set_updated_at();
create trigger households_set_updated_at before update on public.households for each row execute function app.set_updated_at();
create trigger beneficiaries_set_updated_at before update on public.beneficiaries for each row execute function app.set_updated_at();
create trigger assistance_plans_set_updated_at before update on public.assistance_plans for each row execute function app.set_updated_at();
create trigger distributions_set_updated_at before update on public.distributions for each row execute function app.set_updated_at();

create trigger audit_needs_assessments after insert or update or delete on public.needs_assessments for each row execute function app.audit_row_change();
create trigger audit_households after insert or update or delete on public.households for each row execute function app.audit_row_change();
create trigger audit_beneficiaries after insert or update or delete on public.beneficiaries for each row execute function app.audit_row_change();
create trigger audit_assistance_plans after insert or update or delete on public.assistance_plans for each row execute function app.audit_row_change();
create trigger audit_distributions after insert or update or delete on public.distributions for each row execute function app.audit_row_change();
create trigger audit_distribution_items after insert or update or delete on public.distribution_items for each row execute function app.audit_row_change();

alter table public.needs_assessments enable row level security;
alter table public.households enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.assistance_plans enable row level security;
alter table public.distributions enable row level security;
alter table public.distribution_items enable row level security;

create function app.project_id_for_household(p_household_id uuid)
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select project_id from public.households where id = p_household_id;
$$;

create function app.project_id_for_beneficiary(p_beneficiary_id uuid)
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select h.project_id from public.beneficiaries b join public.households h on h.id = b.household_id
  where b.id = p_beneficiary_id;
$$;

create function app.project_id_for_distribution(p_distribution_id uuid)
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select project_id from public.distributions where id = p_distribution_id;
$$;

create function app.project_id_for_distribution_item(p_item_id uuid)
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select d.project_id from public.distribution_items di join public.distributions d on d.id = di.distribution_id
  where di.id = p_item_id;
$$;

-- All Humanitarian data is project-scoped read access for anyone with
-- project access; writes require an operational role, matching risks.
create policy needs_assessments_select on public.needs_assessments for select using (app.has_project_access(project_id));
create policy needs_assessments_insert on public.needs_assessments for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy needs_assessments_update on public.needs_assessments for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy needs_assessments_delete on public.needs_assessments for delete using (app.has_project_access(project_id) and app.is_operational_role());

create policy households_select on public.households for select using (app.has_project_access(project_id));
create policy households_insert on public.households for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy households_update on public.households for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy households_delete on public.households for delete using (app.has_project_access(project_id) and app.is_operational_role());

create policy beneficiaries_select on public.beneficiaries for select using (app.has_project_access(app.project_id_for_household(household_id)));
create policy beneficiaries_insert on public.beneficiaries for insert with check (app.has_project_access(app.project_id_for_household(household_id)) and app.is_operational_role());
create policy beneficiaries_update on public.beneficiaries for update using (app.has_project_access(app.project_id_for_household(household_id)) and app.is_operational_role()) with check (app.has_project_access(app.project_id_for_household(household_id)) and app.is_operational_role());
create policy beneficiaries_delete on public.beneficiaries for delete using (app.has_project_access(app.project_id_for_household(household_id)) and app.is_operational_role());

create policy assistance_plans_select on public.assistance_plans for select using (app.has_project_access(project_id));
create policy assistance_plans_insert on public.assistance_plans for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy assistance_plans_update on public.assistance_plans for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy assistance_plans_delete on public.assistance_plans for delete using (app.has_project_access(project_id) and app.is_operational_role());

create policy distributions_select on public.distributions for select using (app.has_project_access(project_id));
create policy distributions_insert on public.distributions for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy distributions_update on public.distributions for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy distributions_delete on public.distributions for delete using (app.has_project_access(project_id) and app.is_operational_role());

create policy distribution_items_select on public.distribution_items for select using (app.has_project_access(app.project_id_for_distribution(distribution_id)));
create policy distribution_items_insert on public.distribution_items for insert with check (app.has_project_access(app.project_id_for_distribution(distribution_id)) and app.is_operational_role());
create policy distribution_items_delete on public.distribution_items for delete using (app.has_project_access(app.project_id_for_distribution(distribution_id)) and app.is_operational_role());
