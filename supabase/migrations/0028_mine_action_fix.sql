-- app.audit_row_change() (0007_audit_log.sql) assumes every audited
-- table has an `id` column (coalesce(new.id, old.id)). mine_hazard_coordinates
-- used hazard_id as its primary key, which broke the audit trigger on
-- first insert. Give it a normal surrogate id like every other table.
alter table public.mine_hazard_coordinates drop constraint mine_hazard_coordinates_pkey;
alter table public.mine_hazard_coordinates add column id uuid not null default gen_random_uuid();
alter table public.mine_hazard_coordinates add constraint mine_hazard_coordinates_pkey primary key (id);
alter table public.mine_hazard_coordinates add constraint mine_hazard_coordinates_hazard_uq unique (hazard_id);
