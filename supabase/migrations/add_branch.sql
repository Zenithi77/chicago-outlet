-- Migration: add branch support
-- Run in Supabase SQL Editor → New query → paste → Run

-- 1. Create enum
do $$ begin
  create type branch as enum ('park_od', 'riveria', 'online');
exception when duplicate_object then null; end $$;

-- 2. Add branch column to products (default 'online' for existing rows)
alter table products
  add column if not exists branch branch not null default 'online';

create index if not exists products_branch_idx on products (branch);

-- 3. Add branch column to profiles (null = admin sees all)
alter table profiles
  add column if not exists branch branch;

-- 4. Helper function: can this user manage a product in that branch?
create or replace function public.can_manage_product(product_branch branch)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'manager', 'staff')
      and (branch is null or branch = product_branch or product_branch = 'online')
  )
$$;

-- 5. Drop old product policies and replace with branch-aware ones
drop policy if exists "staff read all products" on products;
create policy "staff read all products" on products for select
  using (public.can_manage_product(branch));

drop policy if exists "staff manage products" on products;
create policy "staff manage products" on products for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager', 'staff')
        and (p.branch is null or p.branch = products.branch)
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'manager', 'staff')
        and (p.branch is null or p.branch = branch)
    )
  );
