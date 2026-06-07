-- Migration: replace single `branch` column with per-branch stock map
-- Run in Supabase SQL Editor → New query → paste → Run
-- (Run add_branch.sql first if you haven't already)

-- 1. Add new columns
alter table products
  add column if not exists branch_stock jsonb not null default '{}',
  add column if not exists is_online    boolean not null default false;

-- 2. Migrate existing data: move old branch value to new columns
update products set
  branch_stock = case
    when branch = 'park_od'  then jsonb_build_object('park_od',  total_stock)
    when branch = 'riveria'  then jsonb_build_object('riveria',  total_stock)
    else '{}'::jsonb
  end,
  is_online = (branch = 'online')
where branch_stock = '{}';

-- 5. Drop branch-dependent policies first, then drop column
drop policy if exists "staff read all products" on products;
drop policy if exists "staff manage products" on products;

-- 3. Drop old single branch column
alter table products drop column if exists branch cascade;

-- 4. GIN index for branch_stock queries
create index if not exists products_branch_stock_idx on products using gin (branch_stock);

-- 6. Recreate policies (no longer reference branch column)
create policy "staff read all products" on products for select
  using (public.is_staff());

create policy "staff manage products" on products for all
  using (public.is_staff()) with check (public.is_staff());
