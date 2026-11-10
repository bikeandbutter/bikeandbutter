-- Run once in the bnbhq Supabase project (SQL editor). Safe to re-run.
-- 1) Detailed bike specification (groupset, wheels, tyres, cockpit ...) stored as one JSON column on bikes.
alter table public.bikes add column if not exists specs jsonb;

-- 2) Bike fitting records per customer (entered from a professional fitting report done elsewhere).
create table if not exists public.bike_fittings (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  fit_date     date,
  fitter       text,            -- who did the fit / which studio
  fitted_bike  text,            -- the bike the fit was done on
  report_url   text,            -- link or uploaded copy of the customer's report
  data         jsonb,           -- measurements (see FIT_GROUPS in bnbhq/index.html)
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists bike_fittings_customer_idx on public.bike_fittings (customer_id, fit_date desc);

-- Staff only (logged-in bnbhq users). Not readable from the public website.
alter table public.bike_fittings enable row level security;
drop policy if exists "staff all bike_fittings" on public.bike_fittings;
create policy "staff all bike_fittings" on public.bike_fittings for all to authenticated using (true) with check (true);
revoke all on public.bike_fittings from anon;

-- 3) PRIVATE storage bucket for the customer's fitting report (PDF or photo, max 15 MB). Staff only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fitting-reports', 'fitting-reports', false, 15728640,
        array['application/pdf','image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set public = false, file_size_limit = 15728640,
  allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp','image/heic'];

drop policy if exists "staff fitting reports" on storage.objects;
create policy "staff fitting reports" on storage.objects for all to authenticated
  using (bucket_id = 'fitting-reports') with check (bucket_id = 'fitting-reports');

notify pgrst, 'reload schema';
