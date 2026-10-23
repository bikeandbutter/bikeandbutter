-- Run once in the bnbhq Supabase project (SQL editor). Safe to re-run.
-- Lets a service report remember what the customer asked for, and which booking it came from.
alter table public.service_records add column if not exists customer_request text;
alter table public.service_records add column if not exists booking_id uuid references public.bookings(id) on delete set null;
create index if not exists service_records_booking_id_idx on public.service_records (booking_id);
notify pgrst, 'reload schema';
