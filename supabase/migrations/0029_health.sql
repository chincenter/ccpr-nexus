-- Health module (Phase 4, spec section 25): programme/service management,
-- explicitly NOT a medical-record system. Health Projects and Health
-- Activities/Indicators reuse the existing projects/activities/indicators
-- tables (tagged via programmes.category = 'health') — only facilities,
-- services, outreach and referrals are new here.

create type facility_type as enum ('clinic', 'hospital', 'mobile_clinic', 'health_post', 'other');

create table public.health_facilities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  location_id uuid references public.locations(id),
  name text not null,
  facility_type facility_type not null default 'clinic',
  status lifecycle_status not null default 'active',
  contact_person text,
  contact_phone text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create table public.health_services (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.health_facilities(id) on delete cascade,
  service_type text not null,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create table public.health_outreach (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  facility_id uuid references public.health_facilities(id) on delete set null,
  location_id uuid references public.locations(id),
  outreach_date date not null default current_date,
  activity_description text,
  people_served integer,
  male_served integer,
  female_served integer,
  responsible_staff_id uuid references public.staff(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create table public.health_referrals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  facility_id uuid references public.health_facilities(id) on delete set null,
  referral_date date not null default current_date,
  reason text,
  referred_to text,
  age_group age_group,
  gender text,
  status case_status not null default 'open',
  responsible_staff_id uuid references public.staff(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  is_demo boolean not null default false
);

create index health_facilities_project_idx on public.health_facilities(project_id);
create index health_services_facility_idx on public.health_services(facility_id);
create index health_outreach_project_idx on public.health_outreach(project_id);
create index health_referrals_project_idx on public.health_referrals(project_id);

create trigger health_facilities_set_updated_at before update on public.health_facilities for each row execute function app.set_updated_at();
create trigger health_services_set_updated_at before update on public.health_services for each row execute function app.set_updated_at();
create trigger health_outreach_set_updated_at before update on public.health_outreach for each row execute function app.set_updated_at();
create trigger health_referrals_set_updated_at before update on public.health_referrals for each row execute function app.set_updated_at();

create trigger audit_health_facilities after insert or update or delete on public.health_facilities for each row execute function app.audit_row_change();
create trigger audit_health_services after insert or update or delete on public.health_services for each row execute function app.audit_row_change();
create trigger audit_health_outreach after insert or update or delete on public.health_outreach for each row execute function app.audit_row_change();
create trigger audit_health_referrals after insert or update or delete on public.health_referrals for each row execute function app.audit_row_change();

alter table public.health_facilities enable row level security;
alter table public.health_services enable row level security;
alter table public.health_outreach enable row level security;
alter table public.health_referrals enable row level security;

create function app.project_id_for_facility(p_facility_id uuid)
returns uuid
language sql stable security definer set search_path = public, pg_temp
as $$
  select project_id from public.health_facilities where id = p_facility_id;
$$;

create policy health_facilities_select on public.health_facilities for select using (app.has_project_access(project_id));
create policy health_facilities_insert on public.health_facilities for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy health_facilities_update on public.health_facilities for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy health_facilities_delete on public.health_facilities for delete using (app.has_project_access(project_id) and app.is_operational_role());

create policy health_services_select on public.health_services for select using (app.has_project_access(app.project_id_for_facility(facility_id)));
create policy health_services_insert on public.health_services for insert with check (app.has_project_access(app.project_id_for_facility(facility_id)) and app.is_operational_role());
create policy health_services_update on public.health_services for update using (app.has_project_access(app.project_id_for_facility(facility_id)) and app.is_operational_role()) with check (app.has_project_access(app.project_id_for_facility(facility_id)) and app.is_operational_role());
create policy health_services_delete on public.health_services for delete using (app.has_project_access(app.project_id_for_facility(facility_id)) and app.is_operational_role());

create policy health_outreach_select on public.health_outreach for select using (app.has_project_access(project_id));
create policy health_outreach_insert on public.health_outreach for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy health_outreach_update on public.health_outreach for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy health_outreach_delete on public.health_outreach for delete using (app.has_project_access(project_id) and app.is_operational_role());

create policy health_referrals_select on public.health_referrals for select using (app.has_project_access(project_id));
create policy health_referrals_insert on public.health_referrals for insert with check (app.has_project_access(project_id) and app.is_operational_role());
create policy health_referrals_update on public.health_referrals for update using (app.has_project_access(project_id) and app.is_operational_role()) with check (app.has_project_access(project_id) and app.is_operational_role());
create policy health_referrals_delete on public.health_referrals for delete using (app.has_project_access(project_id) and app.is_operational_role());
