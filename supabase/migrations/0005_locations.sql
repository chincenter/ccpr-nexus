create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location_type location_type not null,
  parent_id uuid references public.locations(id),
  state_region text,
  district text,
  township text,
  village text,
  coordinates geography(Point, 4326),
  is_sensitive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create index locations_parent_idx on public.locations(parent_id);
create index locations_type_idx on public.locations(location_type);
create index locations_coordinates_idx on public.locations using gist (coordinates);

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function app.set_updated_at();

alter table public.locations enable row level security;

create table public.project_locations (
  project_id uuid not null references public.projects(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, location_id)
);

alter table public.project_locations enable row level security;
