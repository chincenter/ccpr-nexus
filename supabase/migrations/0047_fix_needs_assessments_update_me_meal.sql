-- Bug fix: needs_assessments_update (added in 0044) required is_operational_role()
-- only, but the UI's "Check" action is offered to me_meal too (matching the
-- indicators_update precedent, which already ORs in current_role()='me_meal').
-- Without this, a me_meal Check click silently no-ops (RLS matches zero rows,
-- no error) instead of updating verification_status. Caught via TEST 9.
drop policy needs_assessments_update on needs_assessments;
create policy needs_assessments_update on needs_assessments for update
  using (app.has_project_access(project_id) and (app.is_operational_role() or app.current_role() = 'me_meal'))
  with check (
    app.has_project_access(project_id) and (app.is_operational_role() or app.current_role() = 'me_meal')
    and (verification_status is distinct from 'approved' or app.is_management())
  );
