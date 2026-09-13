-- app.has_document_access() already gained 'indicator' and
-- 'indicator_measurement' cases in 0038, but documents itself has a CHECK
-- constraint enumerating allowed entity_type values that predates this
-- migration and still only lists project/programme/activity/task/risk —
-- discovered when a live insert against 'indicator' failed with 23514.
-- Widening it is the last piece needed for M&E evidence uploads to work.

alter table public.documents drop constraint documents_entity_type_check;

alter table public.documents add constraint documents_entity_type_check
  check (entity_type = any (array['project', 'programme', 'activity', 'task', 'risk', 'indicator', 'indicator_measurement']));
