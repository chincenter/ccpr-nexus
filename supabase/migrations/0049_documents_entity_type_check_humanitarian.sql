-- documents.entity_type also has a CHECK constraint (separate from
-- has_document_access()'s CASE, fixed in 0048) enumerating allowed values.
-- Widen it for the same two new humanitarian evidence entities.
alter table documents drop constraint documents_entity_type_check;
alter table documents add constraint documents_entity_type_check
  check (entity_type = any (array['project', 'programme', 'activity', 'task', 'risk', 'indicator', 'indicator_measurement', 'needs_assessment', 'distribution']));
