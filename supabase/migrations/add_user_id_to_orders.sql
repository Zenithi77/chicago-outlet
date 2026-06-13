-- Run this in Supabase SQL Editor.
-- Adds user_id column to the existing orders table and related index/policy.

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_orders_user_id on public.orders (user_id);

-- RLS: users can see their own orders
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);
