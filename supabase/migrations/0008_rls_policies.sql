-- Roles that design/manage project structure (vs. viewer/finance/project_assistant
-- who only read or only touch their own assigned records).
create or replace function app.is_operational_role()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app.current_role() in ('super_admin', 'executive', 'programme_manager', 'project_officer');
$$;

create or replace function app.project_id_for_objective(p_objective_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select project_id from public.objectives where id = p_objective_id;
$$;

create or replace function app.project_id_for_outcome(p_outcome_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ob.project_id
  from public.outcomes oc
  join public.objectives ob on ob.id = oc.objective_id
  where oc.id = p_outcome_id;
$$;

-- staff -------------------------------------------------------------
create policy staff_select on public.staff
  for select using (app.current_staff_id() is not null);

create policy staff_insert on public.staff
  for insert with check (app.is_management());

create policy staff_update on public.staff
  for update using (app.is_management()) with check (app.is_management());

-- programmes ----------------------------------------------------------
create policy programmes_select on public.programmes
  for select using (app.current_staff_id() is not null);

create policy programmes_insert on public.programmes
  for insert with check (app.is_management());

create policy programmes_update on public.programmes
  for update
  using (app.is_management() or lead_staff_id = app.current_staff_id())
  with check (app.is_management() or lead_staff_id = app.current_staff_id());

-- programme_access ------------------------------------------------------
create policy programme_access_select on public.programme_access
  for select using (app.is_management() or staff_id = app.current_staff_id());

create policy programme_access_write on public.programme_access
  for all using (app.is_management()) with check (app.is_management());

-- projects ----------------------------------------------------------
create policy projects_select on public.projects
  for select using (app.has_project_access(id));

create policy projects_insert on public.projects
  for insert with check (
    app.is_management()
    or (app.current_role() = 'programme_manager' and app.has_programme_access(programme_id))
  );

create policy projects_update on public.projects
  for update
  using (app.has_project_access(id) and app.is_operational_role())
  with check (app.has_project_access(id) and app.is_operational_role());

-- project_team ------------------------------------------------------
create policy project_team_select on public.project_team
  for select using (app.has_project_access(project_id));

create policy project_team_write on public.project_team
  for all
  using (app.has_project_access(project_id) and app.is_operational_role())
  with check (app.has_project_access(project_id) and app.is_operational_role());

-- objectives / outcomes / outputs ------------------------------------
create policy objectives_select on public.objectives
  for select using (app.has_project_access(project_id));

create policy objectives_write on public.objectives
  for all
  using (app.has_project_access(project_id) and app.is_operational_role())
  with check (app.has_project_access(project_id) and app.is_operational_role());

create policy outcomes_select on public.outcomes
  for select using (app.has_project_access(app.project_id_for_objective(objective_id)));

create policy outcomes_write on public.outcomes
  for all
  using (app.has_project_access(app.project_id_for_objective(objective_id)) and app.is_operational_role())
  with check (app.has_project_access(app.project_id_for_objective(objective_id)) and app.is_operational_role());

create policy outputs_select on public.outputs
  for select using (app.has_project_access(app.project_id_for_outcome(outcome_id)));

create policy outputs_write on public.outputs
  for all
  using (app.has_project_access(app.project_id_for_outcome(outcome_id)) and app.is_operational_role())
  with check (app.has_project_access(app.project_id_for_outcome(outcome_id)) and app.is_operational_role());

-- locations -----------------------------------------------------------
-- Phase-1 baseline: non-sensitive locations are visible to any signed-in
-- staff member; sensitive ones (e.g. future mine/UXO sites) are visible
-- only to super_admin or staff on a project that uses that location.
-- Generalized-vs-precise coordinate views land with the Mine Action
-- module (Phase 4) — this is the safe default until then.
create policy locations_select on public.locations
  for select using (
    not is_sensitive
    or app.is_admin()
    or exists (
      select 1 from public.project_locations pl
      where pl.location_id = id and app.has_project_access(pl.project_id)
    )
  );

create policy locations_write on public.locations
  for all
  using (app.current_role() is not null and app.current_role() <> 'viewer')
  with check (app.current_role() is not null and app.current_role() <> 'viewer');

create policy project_locations_select on public.project_locations
  for select using (app.has_project_access(project_id));

create policy project_locations_write on public.project_locations
  for all
  using (app.has_project_access(project_id) and app.is_operational_role())
  with check (app.has_project_access(project_id) and app.is_operational_role());

-- activities ----------------------------------------------------------
create policy activities_select on public.activities
  for select using (app.has_project_access(project_id));

create policy activities_insert on public.activities
  for insert with check (app.has_project_access(project_id) and app.is_operational_role());

create policy activities_update on public.activities
  for update
  using (
    app.has_project_access(project_id)
    and (app.is_operational_role() or responsible_staff_id = app.current_staff_id())
  )
  with check (
    app.has_project_access(project_id)
    and (app.is_operational_role() or responsible_staff_id = app.current_staff_id())
  );

-- tasks -----------------------------------------------------------------
create policy tasks_select on public.tasks
  for select using (app.has_project_access(app.project_id_for_activity(activity_id)));

create policy tasks_insert on public.tasks
  for insert with check (
    app.has_project_access(app.project_id_for_activity(activity_id))
    and (app.is_operational_role() or app.current_role() = 'project_assistant')
  );

create policy tasks_update on public.tasks
  for update
  using (
    app.has_project_access(app.project_id_for_activity(activity_id))
    and (app.is_operational_role() or responsible_staff_id = app.current_staff_id())
  )
  with check (
    app.has_project_access(app.project_id_for_activity(activity_id))
    and (app.is_operational_role() or responsible_staff_id = app.current_staff_id())
  );

-- audit_log ---------------------------------------------------------
-- Insert-only, and only ever via the SECURITY DEFINER trigger function.
-- No role gets a direct INSERT/UPDATE/DELETE policy on this table.
create policy audit_log_select on public.audit_log
  for select using (app.is_management() or app.current_role() = 'me_meal');
