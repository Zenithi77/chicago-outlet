-- Migration: per-branch + per-size stock map
-- Run in Supabase SQL Editor → New query → paste → Run

alter table products
  add column if not exists branch_size_stocks jsonb not null default '{}';

-- shape: { "park_od": {"M": 2, "L": 2}, "riveria": {"M": 1, "L": 3} }
create index if not exists products_branch_size_stocks_idx
  on products using gin (branch_size_stocks);

-- Orders: remember which physical branch fulfilled the order.
alter table orders
  add column if not exists ship_branch text;
