export interface CategoryNode {
  name: string;        // canonical key stored in products.category
  nameMn: string;      // display label
  slug: string;
  children?: { name: string; nameMn: string; slug: string }[];
}

// Top-level categories. `name` is what gets stored in products.category and
// what the shop filter / admin select use. Subcategory on the product is free
// text — new values automatically appear under the relevant parent.
export const CATEGORIES: CategoryNode[] = [
  {
    name: "Хувцас",
    nameMn: "Хувцас",
    slug: "huvtsas",
    children: [
      { name: "Дээд хувцас",   nameMn: "Дээд хувцас",   slug: "tops" },
      { name: "Доод хувцас",   nameMn: "Доод хувцас",   slug: "bottoms" },
      { name: "Гадуур хувцас", nameMn: "Гадуур хувцас", slug: "outerwear" },
      { name: "Даашинз",       nameMn: "Даашинз",       slug: "dresses" },
      { name: "Гоёл чимэглэл", nameMn: "Гоёл чимэглэл", slug: "accessories" },
    ],
  },
  {
    name: "Гутал",
    nameMn: "Гутал",
    slug: "gotal",
    children: [
      { name: "Эрэгтэй гутал",  nameMn: "Эрэгтэй гутал",  slug: "men-shoes" },
      { name: "Эмэгтэй гутал",  nameMn: "Эмэгтэй гутал",  slug: "women-shoes" },
      { name: "Хүүхдийн гутал", nameMn: "Хүүхдийн гутал", slug: "kids-shoes" },
      { name: "Спорт гутал",    nameMn: "Спорт гутал",    slug: "sport-shoes" },
    ],
  },
  {
    name: "Цүнх",
    nameMn: "Цүнх",
    slug: "tsunkh",
    children: [
      { name: "Гар цүнх",    nameMn: "Гар цүнх",    slug: "handbags" },
      { name: "Нуруун цүнх", nameMn: "Нуруун цүнх", slug: "backpacks" },
      { name: "Биелгэ цүнх", nameMn: "Биелгэ цүнх", slug: "shoulder-bags" },
      { name: "Жижиг цүнх",  nameMn: "Жижиг цүнх",  slug: "clutches" },
    ],
  },
  {
    name: "Гоо сайхан",
    nameMn: "Гоо сайхан",
    slug: "goo-saihan",
    children: [
      { name: "Арьс арчилгаа", nameMn: "Арьс арчилгаа", slug: "skincare" },
      { name: "Үс арчилгаа",   nameMn: "Үс арчилгаа",   slug: "haircare" },
      { name: "Гоо засал",     nameMn: "Гоо засал",     slug: "makeup" },
      { name: "Парфюм",        nameMn: "Парфюм",        slug: "fragrance" },
    ],
  },
  {
    name: "Гэр ахуй",
    nameMn: "Гэр ахуй",
    slug: "ger-ahui",
    children: [
      { name: "Ор дэрний",       nameMn: "Ор дэрний",       slug: "bedding" },
      { name: "Гал тогоо",       nameMn: "Гал тогоо",       slug: "kitchen" },
      { name: "Цэвэрлэгээ",      nameMn: "Цэвэрлэгээ",      slug: "cleaning" },
      { name: "Хувийн арчилгаа", nameMn: "Хувийн арчилгаа", slug: "personal-care" },
    ],
  },
  {
    name: "Хүнс & Витамин",
    nameMn: "Хүнс & Витамин",
    slug: "huns-vitamin",
    children: [
      { name: "Витамин",     nameMn: "Витамин",     slug: "vitamins" },
      { name: "Спорт хүнс",  nameMn: "Спорт хүнс",  slug: "sports-nutrition" },
      { name: "Хүнс",        nameMn: "Хүнс",        slug: "food" },
      { name: "Ундаа",       nameMn: "Ундаа",       slug: "beverages" },
    ],
  },
];

// Genders used as a secondary breakdown under "Хувцас".
export const GENDERS: { value: "men" | "women" | "kids"; nameMn: string }[] = [
  { value: "men",   nameMn: "Эрэгтэй" },
  { value: "women", nameMn: "Эмэгтэй" },
  { value: "kids",  nameMn: "Хүүхэд" },
];

export const COLLECTIONS = [
  "New Arrivals",
  "Best Sellers",
  "Sale & Outlet",
  "Urban Essentials",
  "Heritage Series",
];
