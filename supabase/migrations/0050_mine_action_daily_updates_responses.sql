-- Landmine / Mine Action phase: closes gaps identified in inspection.
-- Additive only. Reuses has_risk_access(), has_project_access(),
-- can_view_precise_coordinates(), project_id_for_hazard(), approval_status,
-- mine_action_status. Does not touch the existing coordinate-security design.

-- 1. Response / Clearance status — distinct from mine_action_status (hazard
-- lifecycle) because the spec's response states (planned/cancelled/verified)
-- don't map onto it cleanly.
create type response_status as enum ('planned', 'in_progress', 'completed', 'verified', 'closed', 'cancelled');

create table mine_responses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  hazard_id uuid not null references mine_hazards(id) on delete cascade,
  survey_id uuid references mine_surveys(id) on delete set null,
  location_id uuid references locations(id),
  activity_id uuid references activities(id),
  responsible_staff_id uuid references staff(id),
  status response_status not null default 'planned',
  progress integer not null default 0 check (progress between 0 and 100),
  start_date date,
  target_completion_date date,
  result text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references staff(id),
  updated_by uuid references staff(id),
  is_demo boolean not null default false,
  constraint mine_responses_dates_chk check (target_completion_date is null or start_date is null or target_completion_date >= start_date),
  -- A response marked Completed with progress left at 0 is very likely a data
  -- entry mistake (spec §11: "If status is Completed, progress should
  -- normally be 100 unless there is a documented reason" — 'result' is where
  -- that documented reason goes, so we only block the silent zero case).
  constraint mine_responses_completed_progress_chk check (status <> 'completed' or progress > 0 or result is not null)
);
create index mine_responses_project_idx on mine_responses(project_id);
create index mine_responses_hazard_idx on mine_responses(hazard_id);
create index mine_responses_status_idx on mine_responses(status);

-- 2. Daily Update — append-only operational history. No UPDATE action is
-- exposed in the application layer (only create + archive/restore for a
-- mistaken entry); see actions.ts. archived_at exists so a bad entry can be
-- hidden without deleting the audit trail.
create table mine_daily_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  hazard_id uuid not null references mine_hazards(id) on delete cascade,
  survey_id uuid references mine_surveys(id) on delete set null,
  response_id uuid references mine_responses(id) on delete set null,
  location_id uuid references locations(id),
  responsible_staff_id uuid references staff(id),
  update_date date not null default current_date,
  status_snapshot mine_action_status,
  progress integer check (progress is null or progress between 0 and 100),
  summary text not null,
  next_step text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references staff(id),
  is_demo boolean not null default false
);
create index mine_daily_updates_project_idx on mine_daily_updates(project_id);
create index mine_daily_updates_hazard_idx on mine_daily_updates(hazard_id);
create index mine_daily_updates_date_idx on mine_daily_updates(update_date);

-- 3. Hazard -> Survey link (mine_surveys had no hazard_id at all — the core
-- workflow relationship from spec §8 did not exist in the schema). Nullable:
-- a survey can still be a general project-level assessment not tied to one
-- specific hazard, and the 2 existing demo surveys predate this column.
alter table mine_surveys add column hazard_id uuid references mine_hazards(id) on delete set null;
create index mine_surveys_hazard_idx on mine_surveys(hazard_id);

-- Reuse the same verification workflow as everywhere else (M&E, Humanitarian
-- assessments) rather than inventing a second one.
alter table mine_surveys add column verification_status approval_status not null default 'submitted';

-- 4. MRE -> Activity link (spec §12: "Do NOT create a second Activity
-- system. If MRE is an implementation activity, link it to the existing
-- CCPR Activity").
alter table mre_sessions add column activity_id uuid references activities(id);

-- participants_total must never be able to drift from its components (spec
-- §12: "Do not allow inconsistent manually entered totals if they can be
-- calculated"). Convert the freely-editable column to a generated one; the
-- 2 existing demo rows already satisfy male+female=total so no data changes.
alter table mre_sessions drop column participants_total;
alter table mre_sessions add column participants_total integer generated always as (coalesce(participants_male, 0) + coalesce(participants_female, 0)) stored;
alter table mre_sessions add constraint mre_sessions_male_nonneg check (participants_male is null or participants_male >= 0);
alter table mre_sessions add constraint mre_sessions_female_nonneg check (participants_female is null or participants_female >= 0);

-- 5. RBAC: project_assistant/field staff get operational write access across
-- the module (unlike Humanitarian, hazard reporting IS a field-staff task —
-- spec §24 explicitly gives Field Staff broad operational access here,
-- narrowed only by can_view_precise_coordinates for the coordinate table).
create or replace function app.is_mine_action_field_role()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select app.current_role() in ('super_admin', 'executive', 'programme_manager', 'project_officer', 'project_assistant');
$function$;

drop policy mine_hazards_insert on mine_hazards;
create policy mine_hazards_insert on mine_hazards for insert
  with check (app.has_risk_access(project_id, programme_id) and app.is_mine_action_field_role());
drop policy mine_hazards_update on mine_hazards;
create policy mine_hazards_update on mine_hazards for update
  using (app.has_risk_access(project_id, programme_id) and app.is_mine_action_field_role())
  with check (app.has_risk_access(project_id, programme_id) and app.is_mine_action_field_role());

drop policy mine_surveys_insert on mine_surveys;
create policy mine_surveys_insert on mine_surveys for insert
  with check (app.has_project_access(project_id) and app.is_mine_action_field_role());
drop policy mine_surveys_update on mine_surveys;
create policy mine_surveys_update on mine_surveys for update
  using (app.has_project_access(project_id) and app.is_mine_action_field_role())
  with check (
    app.has_project_access(project_id) and app.is_mine_action_field_role()
    and (verification_status is distinct from 'approved' or app.is_management())
  );

drop policy mre_sessions_insert on mre_sessions;
create policy mre_sessions_insert on mre_sessions for insert
  with check (app.has_project_access(project_id) and app.is_mine_action_field_role());
drop policy mre_sessions_update on mre_sessions;
create policy mre_sessions_update on mre_sessions for update
  using (app.has_project_access(project_id) and app.is_mine_action_field_role())
  with check (app.has_project_access(project_id) and app.is_mine_action_field_role());

drop policy victim_assistance_insert on victim_assistance;
create policy victim_assistance_insert on victim_assistance for insert
  with check (app.has_project_access(project_id) and app.is_mine_action_field_role());
drop policy victim_assistance_update on victim_assistance;
create policy victim_assistance_update on victim_assistance for update
  using (app.has_project_access(project_id) and app.is_mine_action_field_role())
  with check (app.has_project_access(project_id) and app.is_mine_action_field_role());

-- Victim assistance PII minimization, matching Humanitarian's beneficiaries
-- pattern: project access alone is not enough; Finance/Viewer excluded even
-- if ever added to a project team.
drop policy victim_assistance_select on victim_assistance;
create policy victim_assistance_select on victim_assistance for select
  using (
    app.has_project_access(project_id)
    and (app.is_operational_role() or app.current_role() = 'me_meal')
  );

drop policy mine_hazard_coordinates_insert on mine_hazard_coordinates;
create policy mine_hazard_coordinates_insert on mine_hazard_coordinates for insert
  with check (app.can_view_precise_coordinates(app.project_id_for_hazard(hazard_id), app.programme_id_for_hazard(hazard_id)) and app.is_mine_action_field_role());
drop policy mine_hazard_coordinates_update on mine_hazard_coordinates;
create policy mine_hazard_coordinates_update on mine_hazard_coordinates for update
  using (app.can_view_precise_coordinates(app.project_id_for_hazard(hazard_id), app.programme_id_for_hazard(hazard_id)) and app.is_mine_action_field_role())
  with check (app.can_view_precise_coordinates(app.project_id_for_hazard(hazard_id), app.programme_id_for_hazard(hazard_id)) and app.is_mine_action_field_role());

-- 6. RLS for the two new tables.
alter table mine_responses enable row level security;
create policy mine_responses_select on mine_responses for select
  using (app.has_project_access(project_id));
create policy mine_responses_insert on mine_responses for insert
  with check (app.has_project_access(project_id) and app.is_mine_action_field_role());
create policy mine_responses_update on mine_responses for update
  using (app.has_project_access(project_id) and app.is_mine_action_field_role())
  with check (
    app.has_project_access(project_id) and app.is_mine_action_field_role()
    and (status is distinct from 'verified' or app.is_management())
  );

alter table mine_daily_updates enable row level security;
create policy mine_daily_updates_select on mine_daily_updates for select
  using (app.has_project_access(project_id));
create policy mine_daily_updates_insert on mine_daily_updates for insert
  with check (app.has_project_access(project_id) and app.is_mine_action_field_role());
-- Archive/restore only (toggle archived_at) — no content edit, by design.
create policy mine_daily_updates_update on mine_daily_updates for update
  using (app.has_project_access(project_id) and app.is_mine_action_field_role())
  with check (app.has_project_access(project_id) and app.is_mine_action_field_role());

-- 7. Evidence — recognize the mine-action entities (has_document_access()
-- has an exhaustive CASE with an `else false`; the CHECK constraint on
-- documents.entity_type is a second, separate allow-list — both were missed
-- for Humanitarian on the first pass, so fixing both together here).
create or replace function app.has_document_access(p_entity_type text, p_entity_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select case p_entity_type
    when 'project' then app.has_project_access(p_entity_id)
    when 'programme' then app.has_programme_access(p_entity_id)
    when 'activity' then app.has_project_access(app.project_id_for_activity(p_entity_id))
    when 'task' then app.has_project_access(app.project_id_for_task(p_entity_id))
    when 'risk' then exists (
      select 1 from public.risks r
      where r.id = p_entity_id and app.has_risk_access(r.project_id, r.programme_id)
    )
    when 'indicator' then exists (
      select 1 from public.indicators i
      where i.id = p_entity_id and app.has_risk_access(i.project_id, i.programme_id)
    )
    when 'indicator_measurement' then exists (
      select 1 from public.indicator_measurements m
      join public.indicators i on i.id = m.indicator_id
      where m.id = p_entity_id and app.has_risk_access(i.project_id, i.programme_id)
    )
    when 'needs_assessment' then exists (
      select 1 from public.needs_assessments a
      where a.id = p_entity_id and app.has_project_access(a.project_id)
    )
    when 'distribution' then exists (
      select 1 from public.distributions d
      where d.id = p_entity_id and app.has_project_access(d.project_id)
    )
    when 'mine_hazard' then exists (
      select 1 from public.mine_hazards h
      where h.id = p_entity_id and app.has_risk_access(h.project_id, h.programme_id)
    )
    when 'mine_survey' then exists (
      select 1 from public.mine_surveys s
      where s.id = p_entity_id and app.has_project_access(s.project_id)
    )
    when 'mine_daily_update' then exists (
      select 1 from public.mine_daily_updates u
      where u.id = p_entity_id and app.has_project_access(u.project_id)
    )
    when 'mine_response' then exists (
      select 1 from public.mine_responses r
      where r.id = p_entity_id and app.has_project_access(r.project_id)
    )
    when 'mre_session' then exists (
      select 1 from public.mre_sessions m
      where m.id = p_entity_id and app.has_project_access(m.project_id)
    )
    when 'victim_assistance' then exists (
      select 1 from public.victim_assistance v
      where v.id = p_entity_id and app.has_project_access(v.project_id)
    )
    else false
  end;
$function$;

alter table documents drop constraint documents_entity_type_check;
alter table documents add constraint documents_entity_type_check
  check (entity_type = any (array[
    'project', 'programme', 'activity', 'task', 'risk', 'indicator', 'indicator_measurement',
    'needs_assessment', 'distribution',
    'mine_hazard', 'mine_survey', 'mine_daily_update', 'mine_response', 'mre_session', 'victim_assistance'
  ]));
