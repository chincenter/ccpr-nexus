create type attendance_status as enum ('present', 'leave', 'absent', 'field_duty', 'remote');

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  date date not null,
  status attendance_status not null default 'present',
  check_in timestamptz,
  check_out timestamptz,
  work_location text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id),
  unique (staff_id, date)
);

create index attendance_staff_idx on public.attendance(staff_id);
create index attendance_date_idx on public.attendance(date);

create trigger attendance_set_updated_at
  before update on public.attendance
  for each row execute function app.set_updated_at();

create trigger audit_attendance
  after insert or update or delete on public.attendance
  for each row execute function app.audit_row_change();

alter table public.attendance enable row level security;

-- Everyone can see attendance broadly (a small trusted org, and this
-- mirrors the staff directory being similarly visible) but can only
-- write their own record; management can correct anyone's.
create policy attendance_select on public.attendance
  for select using (app.current_staff_id() is not null);

create policy attendance_insert on public.attendance
  for insert with check (staff_id = app.current_staff_id() or app.is_management());

create policy attendance_update on public.attendance
  for update
  using (staff_id = app.current_staff_id() or app.is_management())
  with check (staff_id = app.current_staff_id() or app.is_management());

create policy attendance_delete on public.attendance
  for delete using (app.is_management());
