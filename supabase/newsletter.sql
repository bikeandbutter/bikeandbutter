-- Newsletter signups for bikeandbutter.com
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Visitors can only INSERT. Nobody can read, change or delete rows from the website;
-- you view the list in Dashboard -> Table Editor -> newsletter_subscribers.

create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' and length(email) <= 254),
  source      text check (length(source) <= 200),
  created_at  timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);

revoke all on public.newsletter_subscribers from anon, authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
