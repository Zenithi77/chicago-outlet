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

  const supabase = await createClient();

  const colors = parseColors(formData.get("colors"));
  const colorStock = colors.reduce((sum, c) => sum + c.stock, 0);
  const totalStockInput = Number(formData.get("total_stock"));
  const totalStock =
    Number.isFinite(totalStockInput) && totalStockInput > 0
      ? totalStockInput
      : colorStock;

  let slug = String(formData.get("slug") ?? "").trim() || slugify(name);

  // Generate a SKU if none provided: CO-<year>-<NNNN>.
  let sku = String(formData.get("sku") ?? "").trim();
  if (!sku) {
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    const seq = String((count ?? 0) + 1).padStart(4, "0");
    sku = `CO-${new Date().getFullYear()}-${seq}`;
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
    sizes: csv(formData.get("sizes")),
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
    total_stock: totalStock,
    branch: String(formData.get("branch") ?? "online") as "park_od" | "riveria" | "online",
  };

  const { error } = await supabase.from("products").insert(row);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/products");
  return { ok: true, message: `${sku} нэмэгдлээ` };
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
