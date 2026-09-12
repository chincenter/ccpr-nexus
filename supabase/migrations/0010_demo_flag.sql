-- A structural flag (not a naming convention) so the UI can reliably badge
-- "DEMO DATA — NOT REAL CCPR DATA" and so demo rows can be bulk-identified
-- or cleared later without guessing from names. Only set on the two
-- objects demo data actually seeds at the top of the hierarchy (staff,
-- programmes, projects) — every child record (objectives, activities,
-- tasks, locations, ...) is shown in the context of its parent project,
-- so it doesn't need its own copy of the flag.
alter table public.staff add column is_demo boolean not null default false;
alter table public.programmes add column is_demo boolean not null default false;
alter table public.projects add column is_demo boolean not null default false;
alter table public.locations add column is_demo boolean not null default false;
