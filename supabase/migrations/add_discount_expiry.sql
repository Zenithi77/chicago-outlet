-- Migration: per-product discount expiry.
-- When discount_expires_at is in the past, the storefront treats the product
-- as no longer on sale (discount_percent is ignored, is_on_sale = false).
alter table products
  add column if not exists discount_expires_at timestamptz;

create index if not exists products_discount_expiry_idx
  on products (discount_expires_at);
