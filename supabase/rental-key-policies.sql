-- Lets logged-in bnbhq staff read/save ONLY the bike-box rental admin key, so it is shared across devices.
-- (Already applied to the bnbhq project.)
create policy "staff read rental key" on public.app_settings for select to authenticated using (key = 'rental_key');
create policy "staff insert rental key" on public.app_settings for insert to authenticated with check (key = 'rental_key');
create policy "staff update rental key" on public.app_settings for update to authenticated using (key = 'rental_key') with check (key = 'rental_key');
