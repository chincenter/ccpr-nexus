-- Phase 4 Humanitarian: close gaps identified in inspection (see conversation).
-- Additive only. Reuses existing approval_status enum, has_project_access(),
-- is_operational_role(), is_management(), project_id_for_household/distribution().

-- 1. Distribution operational status (Planned/In Progress/Completed/Cancelled/Verified)
create type distribution_status as enum ('planned', 'in_progress', 'completed', 'cancelled', 'verified');
alter table distributions add column status distribution_status not null default 'planned';

-- 2. Needs assessment review workflow — reuse the exact enum M&E already uses
alter table needs_assessments add column verification_status approval_status not null default 'submitted';

-- 3. Assistance plan fields required to compute achievement (target_households/target_beneficiaries
--    did not exist anywhere in the schema before this migration)
alter table assistance_plans
  add column target_households integer,
  add column target_beneficiaries integer,
  add column responsible_staff_id uuid references staff(id),
  add column location_id uuid references locations(id),
  add column activity_id uuid references activities(id);

-- 4. distribution_items: support archive/restore instead of only hard delete
alter table distribution_items add column archived_at timestamptz;

-- 5. Data-quality guards
alter table households
  add constraint households_size_nonneg check (household_size is null or household_size >= 0);
alter table assistance_plans
  add constraint assistance_plans_qty_nonneg check (planned_quantity is null or planned_quantity >= 0),
  add constraint assistance_plans_targets_nonneg check (
    (target_households is null or target_households >= 0)
    and (target_beneficiaries is null or target_beneficiaries >= 0)
  );
alter table distribution_items
  add constraint distribution_items_qty_nonneg check (quantity >= 0);

-- 6. RBAC: project_assistant/field staff may create+update field-level implementation
--    records (households, beneficiaries, distributions, distribution items) within
--    their assigned projects. Planning-level entities (assessments, assistance plans)
--    stay at is_operational_role() — unchanged.
create or replace function app.is_humanitarian_field_role()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select app.current_role() in ('super_admin', 'executive', 'programme_manager', 'project_officer', 'project_assistant');
$function$;

drop policy households_insert on households;
create policy households_insert on households for insert
  with check (app.has_project_access(project_id) and app.is_humanitarian_field_role());

drop policy households_update on households;
create policy households_update on households for update
  using (app.has_project_access(project_id) and app.is_humanitarian_field_role())
  with check (app.has_project_access(project_id) and app.is_humanitarian_field_role());

drop policy beneficiaries_insert on beneficiaries;
create policy beneficiaries_insert on beneficiaries for insert
  with check (app.has_project_access(app.project_id_for_household(household_id)) and app.is_humanitarian_field_role());

drop policy beneficiaries_update on beneficiaries;
create policy beneficiaries_update on beneficiaries for update
  using (app.has_project_access(app.project_id_for_household(household_id)) and app.is_humanitarian_field_role())
  with check (app.has_project_access(app.project_id_for_household(household_id)) and app.is_humanitarian_field_role());

drop policy distributions_insert on distributions;
create policy distributions_insert on distributions for insert
  with check (app.has_project_access(project_id) and app.is_humanitarian_field_role());

-- Self-approval guard: only management can move a distribution to 'verified'.
drop policy distributions_update on distributions;
create policy distributions_update on distributions for update
  using (app.has_project_access(project_id) and app.is_humanitarian_field_role())
  with check (
    app.has_project_access(project_id) and app.is_humanitarian_field_role()
    and (status is distinct from 'verified' or app.is_management())
  );

drop policy distribution_items_insert on distribution_items;
create policy distribution_items_insert on distribution_items for insert
  with check (app.has_project_access(app.project_id_for_distribution(distribution_id)) and app.is_humanitarian_field_role());

-- distribution_items previously had no UPDATE policy at all (create/delete only).
create policy distribution_items_update on distribution_items for update
  using (app.has_project_access(app.project_id_for_distribution(distribution_id)) and app.is_humanitarian_field_role())
  with check (app.has_project_access(app.project_id_for_distribution(distribution_id)) and app.is_humanitarian_field_role());

-- 7. Needs assessment self-approval guard, matching the distributions pattern above.
drop policy needs_assessments_update on needs_assessments;
create policy needs_assessments_update on needs_assessments for update
  using (app.has_project_access(project_id) and app.is_operational_role())
  with check (
    app.has_project_access(project_id) and app.is_operational_role()
    and (verification_status is distinct from 'approved' or app.is_management())
  );

-- 8. Beneficiary PII minimization: project access alone is not enough to see
--    beneficiary-level data (gender/age group/vulnerability category). Restrict to
--    roles that need it for their work, matching Finance's has_finance_access() pattern.
drop policy beneficiaries_select on beneficiaries;
create policy beneficiaries_select on beneficiaries for select
  using (
    app.has_project_access(app.project_id_for_household(household_id))
    and (app.is_operational_role() or app.current_role() = 'me_meal')
  );
