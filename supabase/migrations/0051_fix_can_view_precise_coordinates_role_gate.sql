-- Security fix found while inspecting the existing coordinate-protection
-- design (spec explicitly requires live verification, not just trusting a
-- promising function name): can_view_precise_coordinates() granted access to
-- ANY project_team member regardless of role. Since project_team membership
-- is the *only* mechanism this app has for scoping an M&E or Finance user's
-- monitoring access to a specific project (see how me_meal/finance demo
-- accounts are granted project access throughout this app), an M&E officer
-- added to a mine-action project's team to monitor it would have also
-- silently gained exact hazard coordinates — directly contradicting spec:
-- "M&E: should normally receive monitoring information without unnecessary
-- exact coordinates" and "Finance: should not receive exact hazard
-- coordinates unless explicitly required."
--
-- Fix: require the operational/field-staff role gate in addition to team
-- membership. super_admin is unaffected (already a separate unconditional
-- branch); a project_officer or project_assistant on the team still passes;
-- an executive/programme_manager still needs to actually be the officer,
-- team member, or programme lead (unchanged); me_meal/finance/viewer are now
-- excluded even when added to project_team for monitoring purposes.
create or replace function app.can_view_precise_coordinates(p_project_id uuid, p_programme_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select
    app.current_role() = 'super_admin'
    or (
      app.is_mine_action_field_role()
      and (
        (p_project_id is not null and exists (
          select 1 from public.projects pr
          where pr.id = p_project_id and pr.project_officer_id = app.current_staff_id()
        ))
        or (p_project_id is not null and exists (
          select 1 from public.project_team pt
          where pt.project_id = p_project_id and pt.staff_id = app.current_staff_id()
        ))
        or (p_programme_id is not null and exists (
          select 1 from public.programmes p
          where p.id = p_programme_id and p.lead_staff_id = app.current_staff_id()
        ))
      )
    );
$function$;
