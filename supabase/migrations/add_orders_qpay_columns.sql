-- Add missing QPay columns to existing orders table
alter table public.orders
  add column if not exists qpay_invoice_id   text,
  add column if not exists qpay_paid_amount  integer,
  add column if not exists paid_at           timestamptz,
  add column if not exists shipping_fee      integer not null default 0,
  add column if not exists discount_amount   integer not null default 0,
  add column if not exists coupon_code       text,
  add column if not exists shipping_method   text not null default 'standard',
  add column if not exists payment_status    text not null default 'unpaid',
  add column if not exists notes             text,
  add column if not exists updated_at        timestamptz not null default now();

create index if not exists idx_orders_qpay_invoice_id on public.orders (qpay_invoice_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
