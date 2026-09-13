-- Root cause #2 of the "me_meal access gap": indicators_update already
-- allows (is_operational_role() OR current_role() = 'me_meal'), and the
-- indicator_measurements policies I added for M&E Phase 2 Part 2 already
-- match that same pattern — but indicators_insert (a pre-existing Phase 3
-- policy, never touched by that M&E work) only checks is_operational_role(),
-- so a real M&E/MEAL user can edit an indicator, record an actual, and
-- check/verify one, but cannot create a new indicator at all. The task
-- spec explicitly lists "create indicators where authorized" as an M&E
-- responsibility. This brings indicators_insert in line with the sibling
-- policies — same has_risk_access project/programme scoping, no widening
-- beyond that.

drop policy indicators_insert on public.indicators;

create policy indicators_insert on public.indicators
  for insert with check (
    app.has_risk_access(project_id, programme_id)
    and (app.is_operational_role() or app.current_role() = 'me_meal')
  );
