"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile, isStaff } from "@/lib/supabase/auth";

export type ProductActionState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | undefined;

async function requireStaff() {
  const profile = await getProfile();
  if (!profile || !isStaff(profile.role)) {
    throw new Error("Эрх хүрэлцэхгүй байна.");
  }
  return profile;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csv(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Parse "Size|Stock" lines into size_stocks jsonb and sizes text[] array.
// total_stock for online products is derived from the sum of size stocks.
function parseSizeStocks(value: FormDataEntryValue | null): {
  size_stocks: { size: string; stock: number }[];
  sizes: string[];
  size_total_stock: number;
} {
  const size_stocks = String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [size, stockStr] = line.split("|").map((s) => s.trim());
      return { size: size || "", stock: Math.max(0, Number(stockStr) || 0) };
    })
    .filter((ss) => ss.size);
  const sizes = size_stocks.map((ss) => ss.size);
  const size_total_stock = size_stocks.reduce((acc, ss) => acc + ss.stock, 0);
  return { size_stocks, sizes, size_total_stock };
}

// Parse "Name|#hex|stock" lines into the colors jsonb shape.
function parseColors(value: FormDataEntryValue | null): {
  name: string;
  hex: string;
  stock: number;
}[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, hex, stock] = line.split("|").map((s) => s.trim());
      return {
        name: name || "Default",
        hex: hex || "#000000",
        stock: Number(stock) || 0,
      };
    });
}

// Build branch_stock jsonb from form data.
// Checkboxes: has_park_od, has_riveria, is_online
// Stock inputs: stock_park_od, stock_riveria
function parseBranchStock(formData: FormData): {
  branch_stock: Record<string, number>;
  is_online: boolean;
  total_stock: number;
} {
  const branch_stock: Record<string, number> = {};
  if (formData.get("has_park_od") === "on") {
    branch_stock.park_od = Math.max(0, Number(formData.get("stock_park_od")) || 0);
  }
  if (formData.get("has_riveria") === "on") {
    branch_stock.riveria = Math.max(0, Number(formData.get("stock_riveria")) || 0);
  }
  const is_online = formData.get("is_online") === "on";
  const total_stock = Object.values(branch_stock).reduce((s, n) => s + n, 0);
  return { branch_stock, is_online, total_stock };
}

// Parse per-branch "Size|Stock" textareas into branch_size_stocks jsonb shape:
//   { park_od: { M: 2, L: 2 }, riveria: { M: 1, L: 3 } }
// Returns derived size_stocks (summed across branches), sizes list, and total.
function parseBranchSizeStocks(formData: FormData): {
  branch_size_stocks: Record<string, Record<string, number>>;
  size_stocks: { size: string; stock: number }[];
  sizes: string[];
  total: number;
} {
  const branches: Array<"park_od" | "riveria"> = [];
  if (formData.get("has_park_od") === "on") branches.push("park_od");
  if (formData.get("has_riveria") === "on") branches.push("riveria");

  const bss: Record<string, Record<string, number>> = {};
  const sizeTotals: Record<string, number> = {};

  for (const branch of branches) {
    const raw = String(formData.get(`sizes_${branch}`) ?? "");
    if (!raw.trim()) continue;
    const map: Record<string, number> = {};
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [size, stockStr] = line.split("|").map((s) => s.trim());
        if (!size) return;
        const stock = Math.max(0, Number(stockStr) || 0);
        map[size] = stock;
        sizeTotals[size] = (sizeTotals[size] ?? 0) + stock;
      });
    if (Object.keys(map).length > 0) bss[branch] = map;
  }

  const size_stocks = Object.entries(sizeTotals).map(([size, stock]) => ({ size, stock }));
  const sizes = size_stocks.map((s) => s.size);
  const total = size_stocks.reduce((acc, s) => acc + s.stock, 0);
  return { branch_size_stocks: bss, size_stocks, sizes, total };
}


export async function createProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, error: "Эрх хүрэлцэхгүй байна." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!name || !Number.isFinite(price) || price <= 0) {
    return { ok: false, error: "Нэр болон зөв үнэ оруулна уу." };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return { ok: false, error: "Өгөгдлийн сантай холбогдож чадсангүй." };
  }

  const colors = parseColors(formData.get("colors"));
  const { branch_stock, is_online, total_stock: branchTotal } = parseBranchStock(formData);
  const bss = parseBranchSizeStocks(formData);
  const legacy = parseSizeStocks(formData.get("sizes"));

  // BSS (per-branch+per-size) is the source of truth when provided.
  const hasBss = Object.keys(bss.branch_size_stocks).length > 0;
  const branch_size_stocks = bss.branch_size_stocks;
  const size_stocks = hasBss ? bss.size_stocks : legacy.size_stocks;
  const sizes = hasBss ? bss.sizes : legacy.sizes;

  // Recompute branch_stock totals from BSS when present (overrides stock_* inputs).
  if (hasBss) {
    for (const [b, sizesMap] of Object.entries(bss.branch_size_stocks)) {
      branch_stock[b] = Object.values(sizesMap).reduce((a, n) => a + n, 0);
    }
  }

  const total_stock = hasBss
    ? Object.values(branch_stock).reduce((a, n) => a + n, 0)
    : size_stocks.length > 0
    ? legacy.size_total_stock
    : branchTotal;

  let slug = String(formData.get("slug") ?? "").trim() || slugify(name);

  // Generate a unique SKU if none provided.
  let sku = String(formData.get("sku") ?? "").trim();
  if (!sku) {
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    sku = `CO-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${rand}`;
  } else {
    // Check if provided SKU already exists
    const { data: existingSku } = await supabase
      .from("products")
      .select("sku")
      .eq("sku", sku)
      .maybeSingle();
    if (existingSku) {
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      sku = `${sku}-${rand}`;
    }
  }
  // Avoid slug collisions.
  const { data: existingSlug } = await supabase
    .from("products")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (existingSlug) slug = `${slug}-${Date.now().toString().slice(-4)}`;

  const row = {
    sku,
    name,
    slug,
    brand: String(formData.get("brand") ?? "Chicago Outlet").trim() || "Chicago Outlet",
    category: String(formData.get("category") ?? "").trim(),
    subcategory: String(formData.get("subcategory") ?? "").trim(),
    gender: String(formData.get("gender") ?? "unisex"),
    description: String(formData.get("description") ?? "").trim(),
    short_description: String(formData.get("short_description") ?? "").trim(),
    price,
    currency: "MNT",
    discount_percent: Number(formData.get("discount_percent")) || 0,
    images: csv(formData.get("images")),
    sizes,
    size_stocks,
    colors,
    tags: csv(formData.get("tags")),
    is_featured: formData.get("is_featured") === "on",
    is_new_arrival: formData.get("is_new_arrival") === "on",
    is_on_sale: (Number(formData.get("discount_percent")) || 0) > 0,
    is_active: formData.get("is_active") !== "off",
    care_instructions: String(formData.get("care_instructions") ?? "").trim(),
    material: String(formData.get("material") ?? "").trim(),
    fit: String(formData.get("fit") ?? "regular"),
    season: String(formData.get("season") ?? "all-season").trim() || "all-season",
    collection: String(formData.get("collection") ?? "").trim(),
    branch_stock,
    branch_size_stocks,
    is_online,
    total_stock,
  };

  const { error } = await supabase.from("products").insert(row);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/products");
  return { ok: true, message: `${sku} нэмэгдлээ` };
}

export async function updateProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, error: "Эрх хүрэлцэхгүй байна." };
  }

  const id = String(formData.get("_product_id") ?? "").trim();
  if (!id) return { ok: false, error: "Бараа ID олдсонгүй." };

  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!name || !Number.isFinite(price) || price <= 0) {
    return { ok: false, error: "Нэр болон зөв үнэ оруулна уу." };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return { ok: false, error: "Өгөгдлийн сантай холбогдож чадсангүй." };
  }

  const colors = parseColors(formData.get("colors"));
  const { branch_stock, is_online, total_stock: branchTotal } = parseBranchStock(formData);
  const bss = parseBranchSizeStocks(formData);
  const legacy = parseSizeStocks(formData.get("sizes"));

  const hasBss = Object.keys(bss.branch_size_stocks).length > 0;
  const branch_size_stocks = bss.branch_size_stocks;
  const patchSizeStocks = hasBss ? bss.size_stocks : legacy.size_stocks;
  const patchSizes = hasBss ? bss.sizes : legacy.sizes;

  if (hasBss) {
    for (const [b, sizesMap] of Object.entries(bss.branch_size_stocks)) {
      branch_stock[b] = Object.values(sizesMap).reduce((a, n) => a + n, 0);
    }
  }

  const total_stock = hasBss
    ? Object.values(branch_stock).reduce((a, n) => a + n, 0)
    : patchSizeStocks.length > 0
    ? legacy.size_total_stock
    : branchTotal;

  const patch = {
    name,
    brand: String(formData.get("brand") ?? "Chicago Outlet").trim() || "Chicago Outlet",
    category: String(formData.get("category") ?? "").trim(),
    subcategory: String(formData.get("subcategory") ?? "").trim(),
    gender: String(formData.get("gender") ?? "unisex"),
    description: String(formData.get("description") ?? "").trim(),
    short_description: String(formData.get("short_description") ?? "").trim(),
    price,
    discount_percent: Number(formData.get("discount_percent")) || 0,
    images: csv(formData.get("images")),
    sizes: patchSizes,
    size_stocks: patchSizeStocks,
    colors,
    tags: csv(formData.get("tags")),
    is_featured: formData.get("is_featured") === "on",
    is_new_arrival: formData.get("is_new_arrival") === "on",
    is_on_sale: (Number(formData.get("discount_percent")) || 0) > 0,
    is_active: formData.get("is_active") !== "off",
    care_instructions: String(formData.get("care_instructions") ?? "").trim(),
    material: String(formData.get("material") ?? "").trim(),
    fit: String(formData.get("fit") ?? "regular"),
    season: String(formData.get("season") ?? "all-season").trim() || "all-season",
    collection: String(formData.get("collection") ?? "").trim(),
    branch_stock,
    branch_size_stocks,
    is_online,
    total_stock,
  };

  const { error } = await supabase.from("products").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  return { ok: true, message: `${name} шинэчлэгдлээ` };
}

export async function updateProductFields(
  id: string,
  patch: { price?: number; total_stock?: number; discount_percent?: number }
): Promise<ProductActionState> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, error: "Эрх хүрэлцэхгүй байна." };
  }

  const supabase = await createClient();
  const clean: Record<string, number | boolean> = {};
  if (patch.price !== undefined) clean.price = Math.max(0, patch.price);
  if (patch.total_stock !== undefined)
    clean.total_stock = Math.max(0, patch.total_stock);
  if (patch.discount_percent !== undefined) {
    const d = Math.min(100, Math.max(0, patch.discount_percent));
    clean.discount_percent = d;
    clean.is_on_sale = d > 0;
  }

  const { error } = await supabase.from("products").update(clean).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  return { ok: true, message: "Хадгалагдлаа" };
}

export async function toggleProductActive(
  id: string,
  isActive: boolean
): Promise<ProductActionState> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, error: "Эрх хүрэлцэхгүй байна." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  return { ok: true, message: isActive ? "Идэвхжүүллээ" : "Идэвхгүй болголоо" };
}
