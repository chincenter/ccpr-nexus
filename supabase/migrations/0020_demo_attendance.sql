-- DEMO DATA — NOT REAL CCPR DATA
-- Uses relative dates (last 7 days) so it seeds sensibly whenever this
-- migration is applied, rather than a fixed historical date.
insert into public.attendance (staff_id, date, status, check_in, check_out, work_location, created_by)
select s.id, d::date,
  (case when extract(dow from d) in (0, 6) then 'remote'
       when s.id = '11111111-1111-1111-1111-111111111115' and d::date = current_date - 2 then 'field_duty'
       else 'present' end)::attendance_status,
  (d::date + time '09:00')::timestamptz,
  (d::date + time '17:00')::timestamptz,
  case when s.id = '11111111-1111-1111-1111-111111111115' then 'Hakha field office' else 'CCPR Head Office' end,
  '11111111-1111-1111-1111-111111111101'
from public.staff s
cross join generate_series(current_date - 6, current_date, interval '1 day') as d
where s.id in ('11111111-1111-1111-1111-111111111107', '11111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111101')
on conflict (staff_id, date) do nothing;
