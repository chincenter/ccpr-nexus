-- Bug fix: has_document_access() is an exhaustive CASE with an `else false`
-- fallback that did not know about the two new humanitarian evidence-bearing
-- entity types ('needs_assessment', 'distribution'), so DocumentUploader/List
-- wired to them in this phase would have silently failed every insert/select.
-- Caught via TEST 13. Both entities carry project_id directly, so no extra
-- project_id_for_X() helper is needed (unlike risk/indicator/task above).
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
    else false
  end;
$function$;
