import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

// GET /api/import/template — returns a ready-to-fill .xlsx template file.
export async function GET() {
  // Header row — Mongolian labels with English machine names as sub-header.
  const headers = [
    "Нэр",
    "SKU",
    "Брэнд",
    "Ангилал",
    "Дэд ангилал",
    "Хүйс",
    "Загвар",
    "Үнэ",
    "Хямдрал %",
    "Нийт нөөц",
    "Хэмжээ",
    "Зураг",
    "Өнгө",
    "Богино тайлбар",
    "Тайлбар",
    "Материал",
    "Цуглуулга",
    "Улирал",
    "Таг",
    "Арчилгаа",
    "Идэвхтэй",
    "Онцлох",
    "Шинэ бараа",
  ];

  // Machine-readable sub-header so our parser can also accept English columns.
  const subHeaders = [
    "name",
    "sku",
    "brand",
    "category",
    "subcategory",
    "gender",
    "fit",
    "price",
    "discount_percent",
    "total_stock",
    "sizes",
    "images",
    "colors",
    "short_description",
    "description",
    "material",
    "collection",
    "season",
    "tags",
    "care_instructions",
    "is_active",
    "is_featured",
    "is_new_arrival",
  ];

  // Example rows to show the expected format.
  const examples = [
    [
      "Oxford Shirt",           // name
      "",                       // sku — auto-generated if empty
      "Chicago Outlet",         // brand
      "shirts",                 // category
      "Formal Shirts",          // subcategory
      "men",                    // gender: men / women / unisex / kids
      "regular",                // fit: slim / regular / relaxed / oversized
      49900,                    // price (MNT)
      10,                       // discount_percent (%)
      50,                       // total_stock
      "S, M, L, XL",            // sizes — comma separated
      "",                       // images — comma separated URLs or seeds
      "White|#F7F7F4|20\nNavy|#1F2A44|15\nBlack|#1A1A1A|15",  // colors — Name|#hex|stock per line
      "Premium cotton Oxford shirt",            // short_description
      "A classic Oxford shirt made from 100% premium cotton.", // description
      "100% Cotton",            // material
      "Summer 2026",            // collection
      "all-season",             // season
      "classic, formal, office",// tags
      "Machine wash cold",      // care_instructions
      "TRUE",                   // is_active
      "FALSE",                  // is_featured
      "TRUE",                   // is_new_arrival
    ],
    [
      "Slim Chino",
      "",
      "Chicago Outlet",
      "pants",
      "Chinos",
      "men",
      "slim",
      59900,
      0,
      30,
      "28, 30, 32, 34",
      "",
      "Khaki|#B6A271|15\nNavy|#1F2A44|15",
      "Slim fit chino pants",
      "Versatile slim fit chino pants for every occasion.",
      "98% Cotton, 2% Elastane",
      "",
      "all-season",
      "slim, chino",
      "Wash at 30°C",
      "TRUE",
      "FALSE",
      "FALSE",
    ],
  ];

  const wsData = [headers, subHeaders, ...examples];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths.
  const colWidths = [20, 14, 16, 14, 16, 10, 10, 10, 12, 12, 18, 30, 28, 30, 40, 16, 16, 12, 20, 20, 10, 10, 12];
  ws["!cols"] = colWidths.map((w) => ({ wch: w }));

  // Freeze top 2 rows (headers + sub-header).
  ws["!freeze"] = { xSplit: 0, ySplit: 2 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Бараа");

  // Info sheet.
  const info = [
    ["Талбар", "Тайлбар", "Заавал?"],
    ["Нэр", "Барааны нэр", "Тийм"],
    ["SKU", "Хоосон бол автоматаар үүснэ (CO-2026-0001)", "Үгүй"],
    ["Брэнд", "Компани/брэндийн нэр", "Үгүй"],
    ["Ангилал", "Supabase дахь category.name (жишээ: shirts)", "Үгүй"],
    ["Дэд ангилал", "Илүү нарийн ангилал (жишээ: Formal Shirts)", "Үгүй"],
    ["Хүйс", "men / women / unisex / kids", "Үгүй"],
    ["Загвар", "slim / regular / relaxed / oversized", "Үгүй"],
    ["Үнэ", "MNT дахь үнэ (тоо)", "Тийм"],
    ["Хямдрал %", "0-100 хооронд тоо, жишээ: 10", "Үгүй"],
    ["Нийт нөөц", "Нийт ширхэг (хоосон бол өнгөнүүдийн нийлбэр)", "Үгүй"],
    ["Хэмжээ", "Таслалаар: S, M, L, XL  эсвэл  28, 30, 32", "Үгүй"],
    ["Зураг", "Cloudinary URL эсвэл seed нэр, таслалаар", "Үгүй"],
    ["Өнгө", "Мөр бүрт: Нэр|#hex|нөөц\nЖишээ: White|#F7F7F4|20", "Үгүй"],
    ["Богино тайлбар", "Хамгийн ихдээ 140 тэмдэгт", "Үгүй"],
    ["Тайлбар", "Дэлгэрэнгүй тайлбар", "Үгүй"],
    ["Материал", "Жишээ: 100% Cotton", "Үгүй"],
    ["Цуглуулга", "Жишээ: Summer 2026", "Үгүй"],
    ["Улирал", "all-season / summer / winter / spring / fall", "Үгүй"],
    ["Таг", "Таслалаар: classic, office, casual", "Үгүй"],
    ["Арчилгаа", "Жишээ: Machine wash cold", "Үгүй"],
    ["Идэвхтэй", "TRUE эсвэл FALSE", "Үгүй"],
    ["Онцлох", "TRUE эсвэл FALSE", "Үгүй"],
    ["Шинэ бараа", "TRUE эсвэл FALSE", "Үгүй"],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(info);
  wsInfo["!cols"] = [{ wch: 16 }, { wch: 44 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Заавар");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="chicago-outlet-products-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
