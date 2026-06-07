import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { getProfile, isStaff } from "@/lib/supabase/auth";

// Expected column headers (case-insensitive, trimmed).
// Maps Excel column name → internal field name.
const COLUMN_MAP: Record<string, string> = {
  нэр: "name",
  name: "name",
  sku: "sku",
  брэнд: "brand",
  brand: "brand",
  ангилал: "category",
  category: "category",
  "дэд ангилал": "subcategory",
  subcategory: "subcategory",
  хүйс: "gender",
  gender: "gender",
  загвар: "fit",
  fit: "fit",
  "үнэ": "price",
  price: "price",
  "хямдрал %": "discount_percent",
  "discount_percent": "discount_percent",
  "нийт нөөц": "total_stock",
  "total_stock": "total_stock",
  хэмжээ: "sizes",
  sizes: "sizes",
  зураг: "images",
  images: "images",
  өнгө: "colors",
  colors: "colors",
  "богино тайлбар": "short_description",
  "short_description": "short_description",
  тайлбар: "description",
  description: "description",
  материал: "material",
  material: "material",
  цуглуулга: "collection",
  collection: "collection",
  улирал: "season",
  season: "season",
  таг: "tags",
  tags: "tags",
  арчилгаа: "care_instructions",
  "care_instructions": "care_instructions",
  идэвхтэй: "is_active",
  "is_active": "is_active",
  онцлох: "is_featured",
  "is_featured": "is_featured",
  "шинэ бараа": "is_new_arrival",
  "is_new_arrival": "is_new_arrival",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csv(v: unknown): string[] {
  return String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseColors(v: unknown): { name: string; hex: string; stock: number }[] {
  return String(v ?? "")
    .split(/[\n;]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, hex, stock] = line.split("|").map((s) => s.trim());
      return { name: name || "Default", hex: hex || "#000000", stock: Number(stock) || 0 };
    });
}

function bool(v: unknown, defaultVal = true): boolean {
  if (v === undefined || v === null || v === "") return defaultVal;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "тийм" || s === "1" || s === "yes";
}

// POST /api/import — accepts multipart "file" (xlsx/csv).
export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || !isStaff(profile.role)) {
    return NextResponse.json({ error: "Эрх хүрэлцэхгүй." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Файл хүлээн авсангүй." }, { status: 400 });
  }

  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "file талбар хоосон байна." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
    return NextResponse.json({ error: "Зөвхөн .xlsx, .xls, .csv файл хүлээн авна." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buf, { type: "buffer", cellDates: true });
  } catch {
    return NextResponse.json({ error: "Файл уншиж чадсангүй. Загвар файлыг ашиглана уу." }, { status: 400 });
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  if (rawRows.length === 0) {
    return NextResponse.json({ error: "Хүснэгт хоосон байна." }, { status: 400 });
  }

  // Normalise column names using COLUMN_MAP.
  const rows = rawRows.map((raw) => {
    const norm: Record<string, unknown> = {};
    for (const [col, val] of Object.entries(raw)) {
      const key = COLUMN_MAP[col.toLowerCase().trim()];
      if (key) norm[key] = val;
    }
    return norm;
  });

  const supabase = await createClient();

  // Get current product count for SKU generation.
  const { count: existingCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });
  let seq = (existingCount ?? 0) + 1;

  const inserted: string[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // 1-indexed + header row

    const name = String(r.name ?? "").trim();
    const price = Number(r.price);
    if (!name) {
      errors.push({ row: rowNum, error: "Нэр хоосон байна." });
      continue;
    }
    if (!Number.isFinite(price) || price <= 0) {
      errors.push({ row: rowNum, error: `"${name}" барааны үнэ буруу байна.` });
      continue;
    }

    let sku = String(r.sku ?? "").trim();
    if (!sku) {
      sku = `CO-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
      seq++;
    }

    let slug = slugify(name);
    const { data: existingSlug } = await supabase
      .from("products")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (existingSlug) slug = `${slug}-${Date.now().toString().slice(-4)}`;

    const colors = parseColors(r.colors);
    const colorStock = colors.reduce((sum, c) => sum + c.stock, 0);
    const totalStockInput = Number(r.total_stock);
    const totalStock =
      Number.isFinite(totalStockInput) && totalStockInput > 0
        ? totalStockInput
        : colorStock;

    const discountPercent = Number(r.discount_percent) || 0;

    const row = {
      sku,
      name,
      slug,
      brand: String(r.brand ?? "Chicago Outlet").trim() || "Chicago Outlet",
      category: String(r.category ?? "").trim(),
      subcategory: String(r.subcategory ?? "").trim(),
      gender: String(r.gender ?? "unisex").trim() || "unisex",
      fit: String(r.fit ?? "regular").trim() || "regular",
      price,
      currency: "MNT",
      discount_percent: discountPercent,
      is_on_sale: discountPercent > 0,
      images: csv(r.images),
      sizes: csv(r.sizes),
      colors,
      tags: csv(r.tags),
      short_description: String(r.short_description ?? "").trim(),
      description: String(r.description ?? "").trim(),
      material: String(r.material ?? "").trim(),
      collection: String(r.collection ?? "").trim(),
      season: String(r.season ?? "all-season").trim() || "all-season",
      care_instructions: String(r.care_instructions ?? "").trim(),
      is_active: bool(r.is_active, true),
      is_featured: bool(r.is_featured, false),
      is_new_arrival: bool(r.is_new_arrival, false),
      total_stock: totalStock,
    };

    const { error } = await supabase.from("products").insert(row);
    if (error) {
      errors.push({ row: rowNum, error: `"${name}": ${error.message}` });
    } else {
      inserted.push(sku);
    }
  }

  return NextResponse.json({
    ok: inserted.length > 0,
    inserted: inserted.length,
    errors,
    message:
      inserted.length > 0
        ? `${inserted.length} бараа нэмэгдлээ.${errors.length ? ` ${errors.length} мөр алдаатай.` : ""}`
        : "Жодоо бараа нэмэгдсэнгүй.",
  });
}
