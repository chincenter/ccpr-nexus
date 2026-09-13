-- Phase 2 Part 1 (Project Team / Locations): small additive changes only —
-- no new tables. project_team and project_locations already exist with
-- correct FKs, composite primary keys (which already prevent duplicate
-- membership at the database level), and full RLS; they were just never
-- given a create/remove UI. This migration only:
--   1. adds the two location types the spec calls for that the enum
--      didn't have yet (health_facility, other)
--   2. adds a notes field to locations, which the spec asks for and the
--      table didn't have
--   3. gives project_team and project_locations a plain (non-PK)
--      surrogate id column, because app.audit_row_change() assumes
--      every audited table has one (coalesce(new.id, old.id)) — the same
--      fix already applied to mine_hazard_coordinates in Phase 4
--   4. wires all three tables into the existing audit_row_change()
--      trigger (locations had updated_at tracking but, like project_team
--      and project_locations, was never actually audited)

alter type location_type add value if not exists 'health_facility';
alter type location_type add value if not exists 'other';

alter table public.locations add column notes text;

alter table public.project_team add column id uuid not null default gen_random_uuid();
alter table public.project_team add constraint project_team_id_uq unique (id);

alter table public.project_locations add column id uuid not null default gen_random_uuid();
alter table public.project_locations add constraint project_locations_id_uq unique (id);

create trigger audit_locations after insert or update or delete on public.locations for each row execute function app.audit_row_change();
create trigger audit_project_team after insert or update or delete on public.project_team for each row execute function app.audit_row_change();
create trigger audit_project_locations after insert or update or delete on public.project_locations for each row execute function app.audit_row_change();
