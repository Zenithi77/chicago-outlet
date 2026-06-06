export interface CategoryNode {
  name: string;
  nameMn: string;
  slug: string;
  children?: { name: string; nameMn: string; slug: string }[];
}

export const CATEGORIES: CategoryNode[] = [
  {
    name: "Tops",
    nameMn: "Дээд хувцас",
    slug: "tops",
    children: [
      { name: "T-Shirts", nameMn: "Футболк", slug: "t-shirts" },
      { name: "Shirts", nameMn: "Цамц", slug: "shirts" },
      { name: "Sweaters & Hoodies", nameMn: "Цамц & Гадуур", slug: "sweaters" },
      { name: "Long Sleeves", nameMn: "Урт ханцуй", slug: "long-sleeves" },
    ],
  },
  {
    name: "Bottoms",
    nameMn: "Доод хувцас",
    slug: "bottoms",
    children: [
      { name: "Jeans", nameMn: "Жинс", slug: "jeans" },
      { name: "Trousers & Chinos", nameMn: "Өмд & Чино", slug: "trousers" },
      { name: "Shorts", nameMn: "Богино өмд", slug: "shorts" },
      { name: "Joggers", nameMn: "Жоггер", slug: "joggers" },
    ],
  },
  {
    name: "Outerwear",
    nameMn: "Гадуур хувцас",
    slug: "outerwear",
    children: [
      { name: "Jackets", nameMn: "Куртка", slug: "jackets" },
      { name: "Coats", nameMn: "Пальто", slug: "coats" },
      { name: "Vests", nameMn: "Хантааз", slug: "vests" },
    ],
  },
  {
    name: "Dresses",
    nameMn: "Даашинз",
    slug: "dresses",
    children: [
      { name: "Casual Dresses", nameMn: "Энгийн даашинз", slug: "casual-dresses" },
      { name: "Midi & Maxi", nameMn: "Миди & Макси", slug: "midi-maxi" },
    ],
  },
  {
    name: "Shoes",
    nameMn: "Гутал",
    slug: "shoes",
    children: [
      { name: "Sneakers", nameMn: "Пүүз", slug: "sneakers" },
      { name: "Boots", nameMn: "Гутал", slug: "boots" },
      { name: "Loafers", nameMn: "Лоафер", slug: "loafers" },
    ],
  },
  {
    name: "Accessories",
    nameMn: "Гоёл чимэглэл",
    slug: "accessories",
    children: [
      { name: "Bags", nameMn: "Цүнх", slug: "bags" },
      { name: "Hats & Caps", nameMn: "Малгай", slug: "hats" },
      { name: "Belts", nameMn: "Бүс", slug: "belts" },
      { name: "Sunglasses", nameMn: "Нүдний шил", slug: "sunglasses" },
    ],
  },
];

export const COLLECTIONS = [
  "New Arrivals",
  "Best Sellers",
  "Sale & Outlet",
  "Urban Essentials",
  "Heritage Series",
];
