-- Pre-existing bug found while verifying the M&E verification audit trail
-- (Phase 2 Part 2): app.audit_row_change() compared tg_op against lowercase
-- literals ('update', 'delete'), but the plpgsql TG_OP variable is always
-- uppercase ('INSERT'/'UPDATE'/'DELETE'). The case branches therefore never
-- matched, so audit_log.before/after have been null for every insert,
-- update, and delete on every audited table since the trigger was first
-- introduced — only action/entity/actor/timestamp were ever real. This
-- fixes the comparison so the snapshots are actually captured, which the
-- verification workflow's audit trail (and every other feature that reuses
-- this same trigger) depends on. No table, RLS, or trigger wiring changes.

create or replace function app.audit_row_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
begin
  insert into public.audit_log (staff_id, action, entity_type, entity_id, before, after)
  values (
    app.current_staff_id(),
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$function$;
