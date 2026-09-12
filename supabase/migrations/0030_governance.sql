-- Governance / Peacebuilding / Policy module (Phase 4, spec section 26):
-- a real chain of foreign keys, not free text —
--   Stakeholder -> Consultation -> Recommendation -> Decision -> Action
-- consultation_stakeholders is the join table recording who actually
-- attended a consultation, so "Participants" is a real relationship
-- instead of a text list.

create type engagement_status as enum ('not_engaged', 'engaged', 'ongoing', 'inactive');

create table public.stakeholders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete cascade,
  name text not null,
  stakeholder_type text not null default 'organization',
  organization text,
  location_id uuid references public.locations(id),
  contact_info text,
  engagement_status engagement_status not null default 'not_engaged',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false,
  constraint stakeholders_scope_chk check (project_id is not null or programme_id is not null)
);

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete cascade,
  location_id uuid references public.locations(id),
  consultation_date date not null default current_date,
  topic text not null,
  summary text,
  facilitator_staff_id uuid references public.staff(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false,
  constraint consultations_scope_chk check (project_id is not null or programme_id is not null)
);

create table public.consultation_stakeholders (
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  stakeholder_id uuid not null references public.stakeholders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (consultation_id, stakeholder_id)
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  description text not null,
  responsible_staff_id uuid references public.staff(id),
  status case_status not null default 'open',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid references public.recommendations(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete cascade,
  decision_text text not null,
  decision_date date not null default current_date,
  responsible_body text,
  status case_status not null default 'open',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false,
  constraint decisions_scope_chk check (project_id is not null or programme_id is not null)
);

create table public.governance_actions (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references public.decisions(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  programme_id uuid references public.programmes(id) on delete cascade,
  action_description text not null,
  responsible_staff_id uuid references public.staff(id),
  due_date date,
  status task_status not null default 'not_started',
  follow_up_notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false,
  constraint governance_actions_scope_chk check (project_id is not null or programme_id is not null)
);

create index stakeholders_project_idx on public.stakeholders(project_id);
create index stakeholders_programme_idx on public.stakeholders(programme_id);
create index consultations_project_idx on public.consultations(project_id);
create index consultations_programme_idx on public.consultations(programme_id);
create index recommendations_consultation_idx on public.recommendations(consultation_id);
create index decisions_recommendation_idx on public.decisions(recommendation_id);
create index decisions_project_idx on public.decisions(project_id);
create index decisions_programme_idx on public.decisions(programme_id);
create index governance_actions_decision_idx on public.governance_actions(decision_id);
create index governance_actions_project_idx on public.governance_actions(project_id);
create index governance_actions_programme_idx on public.governance_actions(programme_id);
create index governance_actions_due_date_idx on public.governance_actions(due_date);

create trigger stakeholders_set_updated_at before update on public.stakeholders for each row execute function app.set_updated_at();
create trigger consultations_set_updated_at before update on public.consultations for each row execute function app.set_updated_at();
create trigger recommendations_set_updated_at before update on public.recommendations for each row execute function app.set_updated_at();
create trigger decisions_set_updated_at before update on public.decisions for each row execute function app.set_updated_at();
create trigger governance_actions_set_updated_at before update on public.governance_actions for each row execute function app.set_updated_at();

create trigger audit_stakeholders after insert or update or delete on public.stakeholders for each row execute function app.audit_row_change();
create trigger audit_consultations after insert or update or delete on public.consultations for each row execute function app.audit_row_change();
create trigger audit_recommendations after insert or update or delete on public.recommendations for each row execute function app.audit_row_change();
create trigger audit_decisions after insert or update or delete on public.decisions for each row execute function app.audit_row_change();
create trigger audit_governance_actions after insert or update or delete on public.governance_actions for each row execute function app.audit_row_change();

alter table public.stakeholders enable row level security;
alter table public.consultations enable row level security;
alter table public.consultation_stakeholders enable row level security;
alter table public.recommendations enable row level security;
alter table public.decisions enable row level security;
alter table public.governance_actions enable row level security;

create function app.scope_id_for_consultation(p_consultation_id uuid, out p_project_id uuid, out p_programme_id uuid)
language sql stable security definer set search_path = public, pg_temp
as $$
  select project_id, programme_id from public.consultations where id = p_consultation_id;
$$;

create function app.has_consultation_access(p_consultation_id uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select app.has_risk_access(s.p_project_id, s.p_programme_id)
  from app.scope_id_for_consultation(p_consultation_id) s;
$$;

create function app.has_recommendation_access(p_recommendation_id uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select app.has_consultation_access(r.consultation_id)
  from public.recommendations r where r.id = p_recommendation_id;
$$;

create policy stakeholders_select on public.stakeholders for select using (app.has_risk_access(project_id, programme_id));
create policy stakeholders_insert on public.stakeholders for insert with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy stakeholders_update on public.stakeholders for update using (app.has_risk_access(project_id, programme_id) and app.is_operational_role()) with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy stakeholders_delete on public.stakeholders for delete using (app.has_risk_access(project_id, programme_id) and app.is_operational_role());

create policy consultations_select on public.consultations for select using (app.has_risk_access(project_id, programme_id));
create policy consultations_insert on public.consultations for insert with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy consultations_update on public.consultations for update using (app.has_risk_access(project_id, programme_id) and app.is_operational_role()) with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy consultations_delete on public.consultations for delete using (app.has_risk_access(project_id, programme_id) and app.is_operational_role());

create policy consultation_stakeholders_select on public.consultation_stakeholders for select using (app.has_consultation_access(consultation_id));
create policy consultation_stakeholders_insert on public.consultation_stakeholders for insert with check (app.has_consultation_access(consultation_id) and app.is_operational_role());
create policy consultation_stakeholders_delete on public.consultation_stakeholders for delete using (app.has_consultation_access(consultation_id) and app.is_operational_role());

create policy recommendations_select on public.recommendations for select using (app.has_consultation_access(consultation_id));
create policy recommendations_insert on public.recommendations for insert with check (app.has_consultation_access(consultation_id) and app.is_operational_role());
create policy recommendations_update on public.recommendations for update using (app.has_consultation_access(consultation_id) and app.is_operational_role()) with check (app.has_consultation_access(consultation_id) and app.is_operational_role());
create policy recommendations_delete on public.recommendations for delete using (app.has_consultation_access(consultation_id) and app.is_operational_role());

create policy decisions_select on public.decisions for select using (app.has_risk_access(project_id, programme_id));
create policy decisions_insert on public.decisions for insert with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy decisions_update on public.decisions for update using (app.has_risk_access(project_id, programme_id) and app.is_operational_role()) with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy decisions_delete on public.decisions for delete using (app.has_risk_access(project_id, programme_id) and app.is_operational_role());

create policy governance_actions_select on public.governance_actions for select using (app.has_risk_access(project_id, programme_id));
create policy governance_actions_insert on public.governance_actions for insert with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy governance_actions_update on public.governance_actions for update using (app.has_risk_access(project_id, programme_id) and app.is_operational_role()) with check (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
create policy governance_actions_delete on public.governance_actions for delete using (app.has_risk_access(project_id, programme_id) and app.is_operational_role());
