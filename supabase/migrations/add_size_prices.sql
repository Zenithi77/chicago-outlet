-- Add size_prices jsonb column to products to support per-size pricing.
-- Format: [{"size": "XS", "price": 45000}, {"size": "M", "price": 50000}]
-- When empty array, product uses its base `price` for all sizes.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS size_prices jsonb NOT NULL DEFAULT '[]';
