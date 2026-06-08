-- Migration: site_settings key-value store
-- Used for admin-controlled content such as hero banner image URLs.
create table if not exists site_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- Seed default keys so the admin page always has rows to update.
insert into site_settings (key, value) values
  ('hero_park_od', ''),
  ('hero_riveria', ''),
  ('hero_online',  '')
on conflict (key) do nothing;

-- Only admins / managers may write; anyone may read.
alter table site_settings enable row level security;

drop policy if exists "public read site_settings" on site_settings;
create policy "public read site_settings"
  on site_settings for select using (true);

drop policy if exists "staff write site_settings" on site_settings;
create policy "staff write site_settings"
  on site_settings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role::text in ('admin', 'manager', 'staff')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role::text in ('admin', 'manager', 'staff')
    )
  );
