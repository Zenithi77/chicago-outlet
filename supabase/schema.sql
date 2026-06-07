-- Chicago Outlet — Supabase schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
-- Idempotent: safe to re-run.

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type gender as enum ('men', 'women', 'unisex', 'kids');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fit as enum ('slim', 'regular', 'relaxed', 'oversized');
exception when duplicate_object then null; end $$;

do $$ begin
  create type currency as enum ('MNT', 'USD');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum
    ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum
    ('unpaid', 'awaiting_confirmation', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('qpay', 'cash_on_delivery', 'bank_transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type shipping_method as enum ('standard', 'express', 'pickup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type coupon_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type coupon_scope as enum ('all', 'category', 'product');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('admin', 'manager', 'staff', 'customer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type branch as enum ('park_od', 'riveria', 'online');
exception when duplicate_object then null; end $$;

-- ── Categories ──────────────────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_mn     text not null,
  slug        text not null unique,
  parent_slug text references categories (slug) on delete set null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Products ────────────────────────────────────────────────────────────────
create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  sku               text not null unique,           -- e.g. CO-2025-0001
  name              text not null,
  slug              text not null unique,
  brand             text not null default 'Chicago Outlet',
  category          text not null,
  subcategory       text not null,
  gender            gender not null,
  description       text not null default '',
  short_description text not null default '',
  price             numeric(12, 2) not null,
  currency          currency not null default 'MNT',
  discount_percent  int not null default 0,
  images            text[] not null default '{}',
  sizes             text[] not null default '{}',
  colors            jsonb  not null default '[]',    -- [{name, hex, stock}]
  tags              text[] not null default '{}',
  is_featured       boolean not null default false,
  is_new_arrival    boolean not null default false,
  is_on_sale        boolean not null default false,
  is_active         boolean not null default true,
  care_instructions text not null default '',
  material          text not null default '',
  fit               fit not null default 'regular',
  season            text not null default 'all-season',
  collection        text not null default '',
  rating            numeric(2, 1) not null default 0,
  review_count      int not null default 0,
  total_stock       int not null default 0,
  branch            branch not null default 'online',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_category_idx on products (category);
create index if not exists products_gender_idx   on products (gender);
create index if not exists products_branch_idx   on products (branch);
create index if not exists products_active_idx   on products (is_active);
create index if not exists products_tags_idx     on products using gin (tags);

-- ── Coupons ─────────────────────────────────────────────────────────────────
create table if not exists coupons (
  code        text primary key,
  type        coupon_type not null,
  value       numeric(12, 2) not null,
  min_order   numeric(12, 2) not null default 0,
  max_uses    int,
  used_count  int not null default 0,
  expires_at  timestamptz,
  is_active   boolean not null default true,
  applies_to  coupon_scope not null default 'all',
  created_at  timestamptz not null default now()
);

-- ── Customers ───────────────────────────────────────────────────────────────
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text unique,
  phone      text,
  address    text,
  created_at timestamptz not null default now()
);

-- ── Orders ──────────────────────────────────────────────────────────────────
create table if not exists orders (
  id              text primary key,                 -- ORD-YYYYMMDD-NNNN
  customer_id     uuid references customers (id) on delete set null,
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text not null,
  customer_address text not null,
  subtotal        numeric(12, 2) not null,
  shipping_fee    numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  coupon_code     text references coupons (code) on delete set null,
  total           numeric(12, 2) not null,
  currency        currency not null default 'MNT',
  status          order_status not null default 'pending',
  payment_status  payment_status not null default 'unpaid',
  payment_method  payment_method not null,
  shipping_method shipping_method not null default 'standard',
  tracking_number text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists orders_status_idx   on orders (status);
create index if not exists orders_customer_idx on orders (customer_id);
create index if not exists orders_created_idx  on orders (created_at desc);

-- ── Order items ─────────────────────────────────────────────────────────────
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     text not null references orders (id) on delete cascade,
  product_id   uuid references products (id) on delete set null,
  product_name text not null,
  sku          text not null,
  size         text not null,
  color        text not null,
  qty          int not null,
  unit_price   numeric(12, 2) not null,
  subtotal     numeric(12, 2) not null,
  image        text
);

create index if not exists order_items_order_idx on order_items (order_id);

-- ── Profiles (linked to Supabase Auth users) ────────────────────────────────
-- One row per auth user. `role` drives access control across the app.
create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text not null default '',
  phone      text,
  role       user_role not null default 'customer',
  branch     branch,          -- null = admin (sees all); set for branch staff
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on profiles (role);

-- Auto-create a profile (role=customer) whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER helper so RLS policies can check the caller's role without
-- recursive policy evaluation on `profiles`.
create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager', 'staff')
  )
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- Returns the branch the current staff user belongs to (null = admin/sees all).
create or replace function public.my_branch()
returns branch language sql security definer stable set search_path = public as $$
  select branch from public.profiles where id = auth.uid()
$$;

-- Staff can see/edit products in their own branch OR online products.
-- Admins (branch IS NULL) see everything.
create or replace function public.can_manage_product(product_branch branch)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'manager', 'staff')
      and (branch is null or branch = product_branch or product_branch = 'online')
  )
$$;

-- ── updated_at trigger for products ─────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Storefront reads are public; writes go through the service-role key (admin/server).
alter table categories  enable row level security;
alter table products    enable row level security;
alter table coupons     enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table customers   enable row level security;
alter table profiles    enable row level security;

-- Public (anon) read access to catalog data
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);

drop policy if exists "public read active products" on products;
create policy "public read active products" on products for select using (is_active = true);

drop policy if exists "public read active coupons" on coupons;
create policy "public read active coupons" on coupons for select using (is_active = true);

-- Orders / order_items / customers: no anon access.
-- The service-role key bypasses RLS, so server-side inserts still work.

-- ── Staff access (admin / manager / staff) ──────────────────────────────────
-- Staff can read products in their branch (+ online). Admins read all.
drop policy if exists "staff read all products" on products;
create policy "staff read all products" on products for select
  using (public.can_manage_product(branch));

-- Staff can only write to their own branch. Admins write everywhere.
-- 'online' products: any staff can read but only admin/manager can write.
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

drop policy if exists "staff manage categories" on categories;
create policy "staff manage categories" on categories for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff read all coupons" on coupons;
create policy "staff read all coupons" on coupons for select using (public.is_staff());

drop policy if exists "staff manage coupons" on coupons;
create policy "staff manage coupons" on coupons for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff manage orders" on orders;
create policy "staff manage orders" on orders for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff manage order_items" on order_items;
create policy "staff manage order_items" on order_items for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff manage customers" on customers;
create policy "staff manage customers" on customers for all
  using (public.is_staff()) with check (public.is_staff());

-- ── Profiles policies ───────────────────────────────────────────────────────
-- Users can read/update their own profile; staff can read all; admins manage all.
drop policy if exists "read own profile" on profiles;
create policy "read own profile" on profiles for select using (auth.uid() = id);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "staff read all profiles" on profiles;
create policy "staff read all profiles" on profiles for select using (public.is_staff());

drop policy if exists "admin manage profiles" on profiles;
create policy "admin manage profiles" on profiles for all
  using (public.is_admin()) with check (public.is_admin());
