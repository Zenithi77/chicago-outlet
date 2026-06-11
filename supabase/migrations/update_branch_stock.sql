-- Migration: replace single `branch` column with per-branch stock map
-- Run in Supabase SQL Editor → New query → paste → Run
-- (Run add_branch.sql first if you haven't already)

-- 1. Add new columns
alter table products
  add column if not exists branch_stock jsonb not null default '{}',
  add column if not exists is_online    boolean not null default false;

-- 2. (skipped — branch column does not exist, nothing to migrate)

-- 5. Drop branch-dependent policies first
drop policy if exists "staff read all products" on products;
drop policy if exists "staff manage products" on products;

-- 4. GIN index for branch_stock queries
create index if not exists products_branch_stock_idx on products using gin (branch_stock);

-- 6. Recreate policies (no longer reference branch column)
create policy "staff read all products" on products for select
  using (public.is_staff());

create policy "staff manage products" on products for all
  using (public.is_staff()) with check (public.is_staff());
