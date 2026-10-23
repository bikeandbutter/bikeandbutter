-- Run once in the bnbhq Supabase project. Makes saved servicing reports show up in the booking portal's
-- "Service History" (customer-safe fields only: date, report no., work done, watch items, next due).
create or replace view public.public_bike_service_history as
  select bk.id as booking_id, bk.bike_id, bk.start_time, s.name as service_name, sr.notes as report_notes,
         null::text as report_no, null::text as watch_items, null::date as next_service_due
    from bookings bk
    join services s on s.id = bk.service_id
    left join service_reports sr on sr.booking_id = bk.id
   where bk.status = 'completed'
  union all
  select r.id, r.bike_id, r.service_date::timestamptz, 'Servicing report', r.work_done,
         r.report_no, r.watch_items, r.next_service_due
    from service_records r
   where r.bike_id is not null;
grant select on public.public_bike_service_history to anon, authenticated;
