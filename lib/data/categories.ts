export interface CategoryNode {
  name: string;
  nameMn: string;
  slug: string;
  children?: { name: string; nameMn: string; slug: string }[];
  byGender?: { key: string; label: string; subs: string[] }[];
}

export const BRANDS: string[] = [
  "Coach", "Michael Kors", "Karl Lagerfeld", "DKNY", "Guess", "Tory Burch",
  "Victoria Secret", "Tommy Hilfiger", "Adidas", "Converse", "Kirkland",
  "Calvin Klein", "Polo Ralph Lauren", "Columbia", "Lacoste", "Burberry",
  "Lenox", "Ecco", "The North Face", "UGG", "Timberland", "Armani Exchange", "Kipling",
];

export const CATEGORIES: CategoryNode[] = [
  {
    name: "Хувцас",
    nameMn: "Хувцас",
    slug: "huvtsas",
    byGender: [
      {
        key: "women",
        label: "Эмэгтэй",
        subs: [
          "Гадуур хувцас", "Даашинз & юбка", "Цамц & футболк",
          "Өмд", "Гэрийн хослол", "Дотуур хувцас", "Тэлээ", "Малгай",
        ],
      },
      {
        key: "men",
        label: "Эрэгтэй",
        subs: [
          "Гадуур хувцас", "Футболка & Майк", "Цамц",
          "Өмд", "Хослол", "Дотуур хувцас", "Тэлээ", "Малгай",
        ],
      },
      {
        key: "kids",
        label: "Хүүхэд",
        subs: ["Хослол", "Даашинз", "Гутал", "Дотуур хувцас", "Гадуур хувцас"],
      },
    ],
  },
  {
    name: "Гутал",
    nameMn: "Гутал",
    slug: "gotal",
    children: [
      { name: "Өсгийтэй гутал",     nameMn: "Өсгийтэй гутал",     slug: "heels" },
      { name: "Кет/пүүз",           nameMn: "Кет/пүүз",           slug: "sneakers" },
      { name: "Лофер",              nameMn: "Лофер",              slug: "loafers" },
      { name: "Балерина",           nameMn: "Балерина",           slug: "ballerina" },
      { name: "Сандаал",            nameMn: "Сандаал",            slug: "sandals" },
      { name: "Усны гутал",         nameMn: "Усны гутал",         slug: "water-shoes" },
      { name: "Түрийтэй гутал",     nameMn: "Түрийтэй гутал",     slug: "boots" },
      { name: "Цасны гутал",        nameMn: "Цасны гутал",        slug: "snow-boots" },
    ],
  },
  {
    name: "Цүнх",
    nameMn: "Цүнх",
    slug: "tsunkh",
    children: [
      { name: "Гар цүнх",   nameMn: "Гар цүнх",   slug: "handbags" },
      { name: "Үүргэвч",    nameMn: "Үүргэвч",    slug: "backpacks" },
      { name: "Клатч",      nameMn: "Клатч",      slug: "clutches" },
      { name: "Түрийвч",    nameMn: "Түрийвч",    slug: "wallets" },
      { name: "Card Holder", nameMn: "Card Holder", slug: "card-holder" },
    ],
  },
  {
    name: "Гоо сайхан",
    nameMn: "Гоо сайхан",
    slug: "goo-saihan",
    children: [
      { name: "Үнэртэн",              nameMn: "Үнэртэн",              slug: "fragrance" },
      { name: "Make up",              nameMn: "Make up",              slug: "makeup" },
      { name: "Арьс ба үс арчилгаа", nameMn: "Арьс ба үс арчилгаа", slug: "skincare-haircare" },
    ],
  },
  {
    name: "Хүнс & Витамин",
    nameMn: "Хүнс & Витамин",
    slug: "huns-vitamin",
    children: [
      { name: "Хүүхдийн амин дэм", nameMn: "Хүүхдийн амин дэм", slug: "kids-vitamins" },
      { name: "Том хүний амин дэм", nameMn: "Том хүний амин дэм", slug: "adult-vitamins" },
      { name: "Д витамин",          nameMn: "Д витамин",          slug: "vitamin-d" },
      { name: "Кофе",               nameMn: "Кофе",               slug: "coffee" },
      { name: "Амттан",             nameMn: "Амттан",             slug: "sweets" },
      { name: "Аксессуар",          nameMn: "Аксессуар",          slug: "accessories-food" },
    ],
  },
  {
    name: "Гэр ахуй",
    nameMn: "Гэр ахуй",
    slug: "ger-ahui",
    children: [
      { name: "Гал тогоо",                nameMn: "Гал тогоо",                slug: "kitchen" },
      { name: "Цахилгаан бараа",          nameMn: "Цахилгаан бараа",          slug: "electronics" },
      { name: "Ариун цэврийн хэрэгсэл",  nameMn: "Ариун цэврийн хэрэгсэл",  slug: "hygiene" },
    ],
  },
];

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
