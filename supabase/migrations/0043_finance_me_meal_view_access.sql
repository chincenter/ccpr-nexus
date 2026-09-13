-- Phase 3 (Finance) inspection found the same pattern as the earlier
-- me_meal/indicators fix: app.has_finance_access() gates SELECT on
-- budgets/budget_lines/expenditures/commitments to
-- has_project_access() AND (is_operational_role() OR current_role()='finance').
-- M&E/MEAL is explicitly required to see relevant financial information
-- for programme monitoring (never to edit it), but has zero visibility
-- today. This widens read-only access by adding 'me_meal' to the same
-- function every finance SELECT policy already calls — no policy text
-- changes needed, no write access granted, no other role affected.

create or replace function app.has_finance_access(p_project_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select app.has_project_access(p_project_id)
    and (app.is_operational_role() or app.current_role() in ('finance', 'me_meal'));
$function$;
