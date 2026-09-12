create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.staff(id),
  action text not null check (action in ('insert', 'update', 'delete')),
  entity_type text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log(entity_type, entity_id);
create index audit_log_staff_idx on public.audit_log(staff_id);
create index audit_log_created_at_idx on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

-- SECURITY DEFINER so it can always write regardless of the caller's own
-- RLS grants on audit_log (there are none — see policies below, nobody
-- gets direct INSERT/UPDATE/DELETE on this table, ever).
create or replace function app.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_log (staff_id, action, entity_type, entity_id, before, after)
  values (
    app.current_staff_id(),
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('update', 'delete') then to_jsonb(old) else null end,
    case when tg_op in ('update', 'insert') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_staff
  after insert or update or delete on public.staff
  for each row execute function app.audit_row_change();

create trigger audit_programmes
  after insert or update or delete on public.programmes
  for each row execute function app.audit_row_change();

create trigger audit_projects
  after insert or update or delete on public.projects
  for each row execute function app.audit_row_change();

create trigger audit_objectives
  after insert or update or delete on public.objectives
  for each row execute function app.audit_row_change();

create trigger audit_outcomes
  after insert or update or delete on public.outcomes
  for each row execute function app.audit_row_change();

create trigger audit_outputs
  after insert or update or delete on public.outputs
  for each row execute function app.audit_row_change();

create trigger audit_activities
  after insert or update or delete on public.activities
  for each row execute function app.audit_row_change();

create trigger audit_tasks
  after insert or update or delete on public.tasks
  for each row execute function app.audit_row_change();
