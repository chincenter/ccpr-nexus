-- Phase 5 (GIS Map): generated columns so the map can read a location's
-- point as plain numbers, same pattern as mine_hazards' generalized_lat/lng
-- (0035). Existing RLS on locations (hides is_sensitive rows from anyone
-- without project access) already governs who can read these.
alter table public.locations
  add column lat double precision generated always as (st_y(coordinates::geometry)) stored,
  add column lng double precision generated always as (st_x(coordinates::geometry)) stored;
