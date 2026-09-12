-- Locations was missing archived_at, unlike every other core entity —
-- needed so it supports the same archive/restore lifecycle as the rest.
alter table public.locations add column archived_at timestamptz;
