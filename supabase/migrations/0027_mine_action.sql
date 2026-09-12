-- Landmine / Mine Action module (Phase 4, spec section 24) — the one
-- module the spec flags explicitly as sensitive:
--
--   "Exact coordinates are sensitive. Coordinate visibility must depend
--    on role. Authorized field staff may access precise coordinates
--    when necessary. Senior management may see generalized locations.
--    Unauthorized users must not see exact coordinates."
--
-- Postgres RLS is row-level, not column-level, so the precise point is
-- split into its own table (mine_hazard_coordinates) with its own,
-- stricter policy. Everyone with project/programme access can see a
-- hazard record and a generalized point (snapped to a ~1km grid via a
-- trigger); only the project's own field staff or a super_admin can
-- read the precise table. Executives and programme managers (senior
-- management, per has_project_access -> is_management()) get the
-- hazard record and the generalized point only.

create type hazard_type as enum ('landmine', 'uxo', 'other_explosive', 'unknown');

create type mine_action_status as enum ('open', 'in_progress', 'cleared', 'monitoring', 'closed');

create type verification_status as enum ('reported', 'under_verification', 'verified', 'false_alarm', 'cleared');

create type case_status as enum ('open', 'in_progress', 'resolved', 'closed');

create type referral_status as enum ('not_referred', 'referred', 'in_progress', 'completed');

create table public.mine_hazards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete cascade,
  location_id uuid references public.locations(id),
  hazard_code text not null,
  hazard_type hazard_type not null default 'unknown',
  status mine_action_status not null default 'open',
  risk_level risk_level not null default 'medium',
  verification_status verification_status not null default 'reported',
  date_identified date not null default current_date,
  source text,
  description text,
  coordinates_generalized geography(Point, 4326),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false,
  constraint mine_hazards_scope_chk check (project_id is not null or programme_id is not null),
  constraint mine_hazards_code_uq unique (hazard_code)
);

-- Precise coordinates live in their own table so a stricter RLS policy
-- can guard just this column's worth of data (see file header).
create table public.mine_hazard_coordinates (
  hazard_id uuid primary key references public.mine_hazards(id) on delete cascade,
  coordinates geography(Point, 4326) not null,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references public.staff(id)
);

create table public.mre_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  location_id uuid references public.locations(id),
  session_date date not null default current_date,
  session_type text not null default 'mre',
  audience_description text,
  participants_male integer,
  participants_female integer,
  participants_total integer,
  facilitator_staff_id uuid references public.staff(id),
  topics text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create table public.mine_surveys (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  location_id uuid references public.locations(id),
  survey_date date not null default current_date,
  survey_type text,
  area_covered text,
  findings text,
  status mine_action_status not null default 'open',
  conducted_by uuid references public.staff(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create table public.victim_assistance (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  location_id uuid references public.locations(id),
  incident_date date,
  age_group age_group,
  gender text,
  injury_type text,
  assistance_provided text,
  referral_organization text,
  referral_status referral_status not null default 'not_referred',
  status case_status not null default 'open',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create index mine_hazards_project_idx on public.mine_hazards(project_id);
create index mine_hazards_programme_idx on public.mine_hazards(programme_id);
create index mine_hazards_status_idx on public.mine_hazards(status);
create index mre_sessions_project_idx on public.mre_sessions(project_id);
create index mine_surveys_project_idx on public.mine_surveys(project_id);
create index victim_assistance_project_idx on public.victim_assistance(project_id);

create trigger mine_hazards_set_updated_at before update on public.mine_hazards for each row execute function app.set_updated_at();
create trigger mre_sessions_set_updated_at before update on public.mre_sessions for each row execute function app.set_updated_at();
create trigger mine_surveys_set_updated_at before update on public.mine_surveys for each row execute function app.set_updated_at();
create trigger victim_assistance_set_updated_at before update on public.victim_assistance for each row execute function app.set_updated_at();

create trigger audit_mine_hazards after insert or update or delete on public.mine_hazards for each row execute function app.audit_row_change();
create trigger audit_mine_hazard_coordinates after insert or update or delete on public.mine_hazard_coordinates for each row execute function app.audit_row_change();
create trigger audit_mre_sessions after insert or update or delete on public.mre_sessions for each row execute function app.audit_row_change();
create trigger audit_mine_surveys after insert or update or delete on public.mine_surveys for each row execute function app.audit_row_change();
create trigger audit_victim_assistance after insert or update or delete on public.victim_assistance for each row execute function app.audit_row_change();

-- Snaps the precise point to a ~0.01deg (roughly 1km) grid so the
-- generalized point on the hazard record can never be reverse-derived
-- into the exact location, while staying useful for area-level mapping.
create function app.generalize_hazard_coordinates()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_geom extensions.geometry;
begin
  v_geom := new.coordinates::geometry;
  update public.mine_hazards
  set coordinates_generalized = st_setsrid(
    st_makepoint(round(st_x(v_geom)::numeric, 2)::float8, round(st_y(v_geom)::numeric, 2)::float8),
    4326
  )::geography
  where id = new.hazard_id;
  return new;
end;
$$;

create trigger mine_hazard_coordinates_generalize
  after insert or update on public.mine_hazard_coordinates
  for each row execute function app.generalize_hazard_coordinates();

alter table public.mine_hazards enable row level security;
alter table public.mine_hazard_coordinates enable row level security;
alter table public.mre_sessions enable row level security;
alter table public.mine_surveys enable row level security;
alter table public.victim_assistance enable row level security;

create function app.project_id_for_hazard(p_hazard_id uuid)
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select project_id from public.mine_hazards where id = p_hazard_id;
$$;

create function app.programme_id_for_hazard(p_hazard_id uuid)
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select programme_id from public.mine_hazards where id = p_hazard_id;
$$;

-- Precise-coordinate access: super_admin, the project's named project
-- officer, anyone on that project's team, or the programme's lead
-- staff (the people actually operating on the ground). Executives and
-- programme managers who only have access via is_management() /
-- has_programme_access() are deliberately excluded here even though
-- they can see the hazard record itself and its generalized point.
create function app.can_view_precise_coordinates(p_project_id uuid, p_programme_id uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select
    app.current_role() = 'super_admin'
    or (p_project_id is not null and exists (
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
    ));
$$;

create policy mine_hazards_select on public.mine_hazards for select using (app.has_risk_access(project_id, programme_id));
create policy mine_hazards_insert on public.mine_hazards for insert with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy mine_hazards_update on public.mine_hazards for update using (app.has_risk_access(project_id, programme_id) and app.is_operational_role()) with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy mine_hazards_delete on public.mine_hazards for delete using (app.has_risk_access(project_id, programme_id) and app.is_operational_role());

create policy mine_hazard_coordinates_select on public.mine_hazard_coordinates
  for select using (app.can_view_precise_coordinates(app.project_id_for_hazard(hazard_id), app.programme_id_for_hazard(hazard_id)));
create policy mine_hazard_coordinates_insert on public.mine_hazard_coordinates
  for insert with check (app.can_view_precise_coordinates(app.project_id_for_hazard(hazard_id), app.programme_id_for_hazard(hazard_id)) and app.is_operational_role());
create policy mine_hazard_coordinates_update on public.mine_hazard_coordinates
  for update using (app.can_view_precise_coordinates(app.project_id_for_hazard(hazard_id), app.programme_id_for_hazard(hazard_id)) and app.is_operational_role())
  with check (app.can_view_precise_coordinates(app.project_id_for_hazard(hazard_id), app.programme_id_for_hazard(hazard_id)) and app.is_operational_role());
create policy mine_hazard_coordinates_delete on public.mine_hazard_coordinates
  for delete using (app.can_view_precise_coordinates(app.project_id_for_hazard(hazard_id), app.programme_id_for_hazard(hazard_id)) and app.is_operational_role());

create policy mre_sessions_select on public.mre_sessions for select using (app.has_project_access(project_id));
create policy mre_sessions_insert on public.mre_sessions for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy mre_sessions_update on public.mre_sessions for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy mre_sessions_delete on public.mre_sessions for delete using (app.has_project_access(project_id) and app.is_operational_role());

create policy mine_surveys_select on public.mine_surveys for select using (app.has_project_access(project_id));
create policy mine_surveys_insert on public.mine_surveys for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy mine_surveys_update on public.mine_surveys for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy mine_surveys_delete on public.mine_surveys for delete using (app.has_project_access(project_id) and app.is_operational_role());

create policy victim_assistance_select on public.victim_assistance for select using (app.has_project_access(project_id));
create policy victim_assistance_insert on public.victim_assistance for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy victim_assistance_update on public.victim_assistance for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy victim_assistance_delete on public.victim_assistance for delete using (app.has_project_access(project_id) and app.is_operational_role());
