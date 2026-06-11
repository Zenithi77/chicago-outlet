-- Orders table for persisted checkout flow (qPay-driven payments).
-- Run in Supabase SQL editor.

create table if not exists public.orders (
  id text primary key,                  -- ORD-YYYYMMDD-NNNN
  user_id uuid references auth.users(id) on delete set null,
  customer jsonb not null,              -- { name, email, phone, address }
  items jsonb not null,                 -- OrderItem[]
  subtotal integer not null,
  shipping_fee integer not null default 0,
  discount_amount integer not null default 0,
  coupon_code text,
  total integer not null,
  currency text not null default 'MNT',
  status text not null default 'pending',           -- pending|processing|shipped|delivered|cancelled|refunded
  payment_status text not null default 'unpaid',    -- unpaid|awaiting_confirmation|paid|refunded
  payment_method text not null,                     -- qpay|cash_on_delivery|bank_transfer
  shipping_method text not null default 'standard',
  qpay_invoice_id text,
  qpay_paid_amount integer,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_qpay_invoice_id on public.orders (qpay_invoice_id);
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- RLS: user sees own orders, staff sees all. Inserts/updates only via service role.
alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "orders_select_staff" on public.orders;
create policy "orders_select_staff" on public.orders
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','staff')
    )
  );

drop policy if exists "orders_update_staff" on public.orders;
create policy "orders_update_staff" on public.orders
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','staff')
    )
  );
