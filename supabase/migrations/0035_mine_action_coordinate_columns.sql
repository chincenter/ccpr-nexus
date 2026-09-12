-- Generated columns so the app can read a hazard's generalized point
-- (and, where RLS allows, its precise point) as plain numbers instead
-- of parsing PostGIS geography/WKB on the client. Writing still goes
-- through the same "POINT(lng lat)" text convention used by
-- locations.coordinates (see locations/actions.ts) — Postgres casts it
-- to geography on insert.
alter table public.mine_hazards
  add column generalized_lat double precision generated always as (st_y(coordinates_generalized::geometry)) stored,
  add column generalized_lng double precision generated always as (st_x(coordinates_generalized::geometry)) stored;

alter table public.mine_hazard_coordinates
  add column precise_lat double precision generated always as (st_y(coordinates::geometry)) stored,
  add column precise_lng double precision generated always as (st_x(coordinates::geometry)) stored;
