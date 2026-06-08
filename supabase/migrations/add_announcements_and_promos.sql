-- Migration: announcement bar texts + two home promo banners.
-- Stored as additional rows in the existing site_settings key-value table.

insert into site_settings (key, value) values
  -- Top announcement bar (rotates through up to 3 lines)
  ('announcement_1', ''),
  ('announcement_2', ''),
  ('announcement_3', ''),

  -- Home promo banner #1 (was "Urban Essentials")
  ('promo1_image',    ''),
  ('promo1_eyebrow',  'Цуглуулга'),
  ('promo1_title',    'Urban Essentials'),
  ('promo1_subtitle', 'Өдөр тутмын төгс суурь — өмссөн бүрдээ илүү сайхан.'),
  ('promo1_cta_label','Худалдан авах'),
  ('promo1_cta_href', '/shop?collection=Urban%20Essentials'),

  -- Home promo banner #2 (was "Sale & Outlet")
  ('promo2_image',    ''),
  ('promo2_eyebrow',  'Хязгаарлагдмал хугацаа'),
  ('promo2_title',    'Sale & Outlet — 30% хүртэл'),
  ('promo2_subtitle', 'CHICAGO20 кодоор ₮200,000+ захиалгад 20% хямдрал.'),
  ('promo2_cta_label','Хямдрал үзэх'),
  ('promo2_cta_href', '/shop?gender=sale')
on conflict (key) do nothing;
