-- Phase 2 Part 2 (M&E / MEAL + Evidence): small additive changes only.
--
-- indicators already had project_id/programme_id, result_type/result_id
-- (a ready-made polymorphic link to objectives/outcomes/outputs that the
-- UI never populated), baseline/target/actual, verification_status (the
-- existing approval_status enum: draft/submitted/under_review/approved/
-- published — already a workable Submit->Check->Verify->Approve ladder),
-- and an audit trigger. No new Indicator/Evidence/verification table
-- family was created; this migration only:
--
--   1. adds indicators.code + per-scope uniqueness, since "prevent
--      duplicate indicator codes" needs a code column to exist
--   2. adds indicator_measurements: the schema had only a single mutable
--      indicators.actual/reporting_period pair, which cannot hold a
--      history of reporting periods (Q1, Q2, ...) without overwriting
--      prior values. This table is the smallest structure that lets a
--      new period's actual be recorded without erasing the last one.
--      indicators.actual/reporting_period remain the "current snapshot"
--      every existing dashboard/report/alert query already reads.
--   3. extends app.has_document_access() with 'indicator' and
--      'indicator_measurement' cases so the existing Documents/Storage
--      system (used everywhere else) can also hold M&E evidence — it
--      previously fell through to `else false`, i.e. denied.
--   4. adds a BEFORE UPDATE trigger enforcing who may move
--      verification_status forward: submitting is open to whoever can
--      already update the indicator, but "under_review" requires M&E/MEAL
--      (or management), and "approved"/"published" require management —
--      closing the gap where any operational role could self-approve.

alter table public.indicators add column code text;

create unique index indicators_code_project_uq
  on public.indicators (project_id, code)
  where code is not null and project_id is not null;

create unique index indicators_code_programme_uq
  on public.indicators (programme_id, code)
  where code is not null and programme_id is not null and project_id is null;

create index indicators_result_idx on public.indicators (result_type, result_id);

create table public.indicator_measurements (
  id uuid primary key default gen_random_uuid(),
  indicator_id uuid not null references public.indicators(id) on delete cascade,
  reporting_period text not null,
  actual numeric not null check (actual >= 0),
  source text,
  notes text,
  entered_by uuid references public.staff(id),
  created_at timestamptz not null default now()
);

create index indicator_measurements_indicator_idx on public.indicator_measurements (indicator_id, created_at desc);

alter table public.indicator_measurements enable row level security;

create policy indicator_measurements_select on public.indicator_measurements
  for select using (
    exists (
      select 1 from public.indicators i
      where i.id = indicator_measurements.indicator_id
        and app.has_risk_access(i.project_id, i.programme_id)
    )
  );

create policy indicator_measurements_insert on public.indicator_measurements
  for insert with check (
    (app.is_operational_role() or app.current_role() = 'me_meal')
    and exists (
      select 1 from public.indicators i
      where i.id = indicator_measurements.indicator_id
        and app.has_risk_access(i.project_id, i.programme_id)
    )
  );

create policy indicator_measurements_delete on public.indicator_measurements
  for delete using (
    (app.is_operational_role() or app.current_role() = 'me_meal')
    and exists (
      select 1 from public.indicators i
      where i.id = indicator_measurements.indicator_id
        and app.has_risk_access(i.project_id, i.programme_id)
    )
  );

create trigger audit_indicator_measurements after insert or update or delete on public.indicator_measurements
  for each row execute function app.audit_row_change();

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
    else false
  end;
$function$;

create or replace function app.enforce_indicator_verification_transition()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
begin
  if tg_op = 'INSERT' or new.verification_status is distinct from old.verification_status then
    if new.verification_status in ('under_review') and not (app.current_role() = 'me_meal' or app.is_management()) then
      raise exception 'Only M&E/MEAL or management can move an indicator to under review.' using errcode = '42501';
    elsif new.verification_status in ('approved', 'published') and not app.is_management() then
      raise exception 'Only management can approve or publish an indicator.' using errcode = '42501';
    elsif tg_op = 'UPDATE' and new.verification_status = 'draft' and not (app.current_role() = 'me_meal' or app.is_management()) then
      raise exception 'Only M&E/MEAL or management can revert an indicator to draft.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

create trigger indicators_verification_transition before insert or update on public.indicators
  for each row execute function app.enforce_indicator_verification_transition();
