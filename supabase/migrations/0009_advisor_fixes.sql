-- Lock down search_path on the one trigger function that was missing it.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- PostGIS doesn't support ALTER EXTENSION ... SET SCHEMA, so move it by
-- dropping and recreating in `extensions` (the Supabase convention for
-- extension schemas). The table is empty at this point in Phase 0, so
-- dropping the one dependent column and re-adding it is safe.
alter table public.locations drop column coordinates;
drop extension postgis;
create schema if not exists extensions;
create extension postgis with schema extensions;
alter table public.locations add column coordinates extensions.geography(Point, 4326);
create index locations_coordinates_idx on public.locations using gist (coordinates);

-- NOTE: extensions.spatial_ref_sys (PostGIS's read-only SRID reference
-- table) still shows an RLS-disabled advisory. It's owned by the
-- extension-installer role, not the migration role, so `ALTER TABLE ...
-- ENABLE ROW LEVEL SECURITY` on it fails with "must be owner of table"
-- on hosted Supabase. The table holds only public coordinate-system
-- definitions (no NGO data), so this is accepted as a known PostGIS/
-- Supabase platform limitation rather than a real exposure.

-- Split every `for all` write policy into explicit insert/update/delete
-- policies. `for all` also matches SELECT, so it was double-evaluating
-- alongside each table's dedicated `_select` policy on every read.

drop policy programme_access_write on public.programme_access;
create policy programme_access_insert on public.programme_access
  for insert with check (app.is_management());
create policy programme_access_update on public.programme_access
  for update using (app.is_management()) with check (app.is_management());
create policy programme_access_delete on public.programme_access
  for delete using (app.is_management());

drop policy project_team_write on public.project_team;
create policy project_team_insert on public.project_team
  for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy project_team_update on public.project_team
  for update
  using (app.has_project_access(project_id) and app.is_operational_role())
  with check (app.has_project_access(project_id) and app.is_operational_role());
create policy project_team_delete on public.project_team
  for delete using (app.has_project_access(project_id) and app.is_operational_role());

drop policy objectives_write on public.objectives;
create policy objectives_insert on public.objectives
  for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy objectives_update on public.objectives
  for update
  using (app.has_project_access(project_id) and app.is_operational_role())
  with check (app.has_project_access(project_id) and app.is_operational_role());
create policy objectives_delete on public.objectives
  for delete using (app.has_project_access(project_id) and app.is_operational_role());

drop policy outcomes_write on public.outcomes;
create policy outcomes_insert on public.outcomes
  for insert with check (app.has_project_access(app.project_id_for_objective(objective_id)) and app.is_operational_role());
create policy outcomes_update on public.outcomes
  for update
  using (app.has_project_access(app.project_id_for_objective(objective_id)) and app.is_operational_role())
  with check (app.has_project_access(app.project_id_for_objective(objective_id)) and app.is_operational_role());
create policy outcomes_delete on public.outcomes
  for delete using (app.has_project_access(app.project_id_for_objective(objective_id)) and app.is_operational_role());

drop policy outputs_write on public.outputs;
create policy outputs_insert on public.outputs
  for insert with check (app.has_project_access(app.project_id_for_outcome(outcome_id)) and app.is_operational_role());
create policy outputs_update on public.outputs
  for update
  using (app.has_project_access(app.project_id_for_outcome(outcome_id)) and app.is_operational_role())
  with check (app.has_project_access(app.project_id_for_outcome(outcome_id)) and app.is_operational_role());
create policy outputs_delete on public.outputs
  for delete using (app.has_project_access(app.project_id_for_outcome(outcome_id)) and app.is_operational_role());

drop policy locations_write on public.locations;
create policy locations_insert on public.locations
  for insert with check (app.current_role() is not null and app.current_role() <> 'viewer');
create policy locations_update on public.locations
  for update
  using (app.current_role() is not null and app.current_role() <> 'viewer')
  with check (app.current_role() is not null and app.current_role() <> 'viewer');
create policy locations_delete on public.locations
  for delete using (app.current_role() is not null and app.current_role() <> 'viewer');

drop policy project_locations_write on public.project_locations;
create policy project_locations_insert on public.project_locations
  for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy project_locations_update on public.project_locations
  for update
  using (app.has_project_access(project_id) and app.is_operational_role())
  with check (app.has_project_access(project_id) and app.is_operational_role());
create policy project_locations_delete on public.project_locations
  for delete using (app.has_project_access(project_id) and app.is_operational_role());

-- A few genuinely hot join-key foreign keys that were missing an index.
-- (created_by/updated_by audit columns are skipped: they're rarely
-- filtered on and don't justify the extra index-maintenance cost yet.)
create index programme_access_staff_idx on public.programme_access(staff_id);
create index project_team_staff_idx on public.project_team(staff_id);
create index project_locations_location_idx on public.project_locations(location_id);
create index tasks_dependency_idx on public.tasks(dependency_task_id);
