-- Self-approval guard for hazard verification, matching the pattern already
-- applied to needs_assessments/mine_surveys/mine_responses: only management
-- can move a hazard to 'verified' or 'cleared' (the terminal, trusted
-- states of this table's own verification_status enum).
drop policy mine_hazards_update on mine_hazards;
create policy mine_hazards_update on mine_hazards for update
  using (app.has_risk_access(project_id, programme_id) and app.is_mine_action_field_role())
  with check (
    app.has_risk_access(project_id, programme_id) and app.is_mine_action_field_role()
    and (verification_status not in ('verified', 'cleared') or app.is_management())
  );
