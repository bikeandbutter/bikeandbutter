-- Fix: "Save failed: Could not find the 'postal_code' column of 'quotations' in the schema cache"
-- Already applied to project bnbhq (migration: quotations_add_postal_code). Safe to re-run.
alter table public.quotations add column if not exists postal_code text;
notify pgrst, 'reload schema';
