-- Rename size_prices → size_stocks.
-- The column now stores [{size, stock}] instead of [{size, price}].
-- Per-size pricing is dropped; all sizes share the product's base price.

ALTER TABLE products
  RENAME COLUMN size_prices TO size_stocks;

-- Update the default to reflect the new shape (no-op for existing rows, just for clarity).
ALTER TABLE products
  ALTER COLUMN size_stocks SET DEFAULT '[]';
