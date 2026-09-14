-- Performance Optimization Phase 1: two additive, non-destructive indexes for
-- query shapes confirmed in application code. No RLS, constraint, or data change.

-- Matches src/app/(app)/mine-action/[hazardId]/page.tsx: every hazard detail
-- view fetches the hazard's full daily-update history with
-- .eq("hazard_id", ...).order("update_date", desc).order("created_at", desc).
-- Only single-column indexes existed on mine_daily_updates(hazard_id) and
-- mine_daily_updates(update_date) separately, so the equality + two-column
-- sort could not be satisfied by one index.
create index if not exists mine_daily_updates_hazard_date_idx
  on public.mine_daily_updates (hazard_id, update_date desc, created_at desc);

-- Matches the repeated pattern across Project Workspace, task detail, and
-- indicator evidence queries: .eq("entity_type", ...).eq/in("entity_id", ...)
-- .is("archived_at", null). documents already had (entity_type, entity_id)
-- but every one of these lookups also filters to non-archived rows, so a
-- partial index on that common case avoids scanning archived documents.
create index if not exists documents_entity_active_idx
  on public.documents (entity_type, entity_id)
  where archived_at is null;
