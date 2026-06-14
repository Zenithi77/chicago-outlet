-- Backfill branch_size_stocks from existing size_stocks + branch_stock
-- Run in Supabase SQL Editor AFTER add_branch_size_stocks.sql

-- Logic:
--   For each product with empty branch_size_stocks but non-empty size_stocks:
--     - If branch_stock has BOTH branches with totals, split each size proportionally.
--     - If only one branch is present, assign all sizes to that branch.
--     - If neither branch_stock entry exists, default to park_od.

update products p
set branch_size_stocks = sub.bss
from (
  select
    id,
    case
      -- both branches present
      when (branch_stock ? 'park_od') and (branch_stock ? 'riveria') then
        jsonb_build_object(
          'park_od', coalesce((
            select jsonb_object_agg(
              (s->>'size'),
              greatest(
                round(
                  ((s->>'stock')::numeric)
                  * ((branch_stock->>'park_od')::numeric)
                  / nullif(((branch_stock->>'park_od')::numeric) + ((branch_stock->>'riveria')::numeric), 0)
                )::int,
                0
              )
            )
            from jsonb_array_elements(size_stocks) s
          ), '{}'::jsonb),
          'riveria', coalesce((
            select jsonb_object_agg(
              (s->>'size'),
              greatest(
                ((s->>'stock')::int)
                - round(
                    ((s->>'stock')::numeric)
                    * ((branch_stock->>'park_od')::numeric)
                    / nullif(((branch_stock->>'park_od')::numeric) + ((branch_stock->>'riveria')::numeric), 0)
                  )::int,
                0
              )
            )
            from jsonb_array_elements(size_stocks) s
          ), '{}'::jsonb)
        )
      -- only riveria
      when (branch_stock ? 'riveria') and not (branch_stock ? 'park_od') then
        jsonb_build_object(
          'riveria', coalesce((
            select jsonb_object_agg((s->>'size'), (s->>'stock')::int)
            from jsonb_array_elements(size_stocks) s
          ), '{}'::jsonb)
        )
      -- default: park_od (covers park_od-only and no branch_stock cases)
      else
        jsonb_build_object(
          'park_od', coalesce((
            select jsonb_object_agg((s->>'size'), (s->>'stock')::int)
            from jsonb_array_elements(size_stocks) s
          ), '{}'::jsonb)
        )
    end as bss
  from products
  where (branch_size_stocks = '{}'::jsonb or branch_size_stocks is null)
    and size_stocks is not null
    and jsonb_array_length(size_stocks) > 0
) sub
where p.id = sub.id;
