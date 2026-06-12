-- Add top-level categories: Гутал (shoes) and Цүнх (bags)
-- Run in Supabase SQL Editor

-- Top-level: Гутал
insert into categories (name, name_mn, slug, parent_slug, sort_order)
values ('Гутал', 'Гутал', 'gotal', null, 20)
on conflict (slug) do nothing;

-- Subcategories of Гутал
insert into categories (name, name_mn, slug, parent_slug, sort_order)
values
  ('Эрэгтэй гутал',  'Эрэгтэй гутал',  'men-shoes',   'gotal', 1),
  ('Эмэгтэй гутал',  'Эмэгтэй гутал',  'women-shoes',  'gotal', 2),
  ('Хүүхдийн гутал', 'Хүүхдийн гутал', 'kids-shoes',   'gotal', 3),
  ('Спорт гутал',    'Спорт гутал',    'sport-shoes',  'gotal', 4)
on conflict (slug) do nothing;

-- Top-level: Цүнх
insert into categories (name, name_mn, slug, parent_slug, sort_order)
values ('Цүнх', 'Цүнх', 'tsunkh', null, 21)
on conflict (slug) do nothing;

-- Subcategories of Цүнх
insert into categories (name, name_mn, slug, parent_slug, sort_order)
values
  ('Гар цүнх',    'Гар цүнх',    'handbags',      'tsunkh', 1),
  ('Нуруун цүнх', 'Нуруун цүнх', 'backpacks',     'tsunkh', 2),
  ('Биелгэ цүнх', 'Биелгэ цүнх', 'shoulder-bags', 'tsunkh', 3),
  ('Жижиг цүнх',  'Жижиг цүнх',  'clutches',      'tsunkh', 4)
on conflict (slug) do nothing;
