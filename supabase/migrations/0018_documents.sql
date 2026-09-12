create type document_access_level as enum ('standard', 'restricted');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('project', 'programme', 'activity', 'task', 'risk')),
  entity_id uuid not null,
  name text not null,
  category text,
  description text,
  storage_path text not null unique,
  access_level document_access_level not null default 'standard',
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.staff(id),
  updated_by uuid references public.staff(id)
);

create index documents_entity_idx on public.documents(entity_type, entity_id);
create index documents_created_by_idx on public.documents(created_by);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function app.set_updated_at();

create trigger audit_documents
  after insert or update or delete on public.documents
  for each row execute function app.audit_row_change();

alter table public.documents enable row level security;

-- Dispatches to the right scope-check depending on which entity a
-- document (or a Storage object, via the path convention below) is
-- attached to. Kept in one place so both the table policies and the
-- Storage policies use identical logic.
create or replace function app.has_document_access(p_entity_type text, p_entity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case p_entity_type
    when 'project' then app.has_project_access(p_entity_id)
    when 'programme' then app.has_programme_access(p_entity_id)
    when 'activity' then app.has_project_access(app.project_id_for_activity(p_entity_id))
    when 'task' then app.has_project_access(app.project_id_for_task(p_entity_id))
    when 'risk' then exists (
      select 1 from public.risks r
      where r.id = p_entity_id and app.has_risk_access(r.project_id, r.programme_id)
    )
    else false
  end;
$$;

create policy documents_select on public.documents
  for select using (
    app.has_document_access(entity_type, entity_id)
    and (access_level = 'standard' or app.is_operational_role() or app.current_role() = 'me_meal')
  );

create policy documents_insert on public.documents
  for insert with check (app.has_document_access(entity_type, entity_id) and app.current_role() <> 'viewer');

create policy documents_update on public.documents
  for update
  using (app.has_document_access(entity_type, entity_id) and app.current_role() <> 'viewer')
  with check (app.has_document_access(entity_type, entity_id) and app.current_role() <> 'viewer');

-- Storage --------------------------------------------------------------
-- Files are stored at "<entity_type>/<entity_id>/<filename>" so the same
-- app.has_document_access() check works on the object path directly,
-- without needing a lookup into public.documents first.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy documents_storage_select on storage.objects
  for select using (
    bucket_id = 'documents'
    and app.has_document_access((storage.foldername(name))[1], ((storage.foldername(name))[2])::uuid)
  );

create policy documents_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and app.current_role() <> 'viewer'
    and app.has_document_access((storage.foldername(name))[1], ((storage.foldername(name))[2])::uuid)
  );

create policy documents_storage_delete on storage.objects
  for delete using (
    bucket_id = 'documents'
    and app.current_role() <> 'viewer'
    and app.has_document_access((storage.foldername(name))[1], ((storage.foldername(name))[2])::uuid)
  );
