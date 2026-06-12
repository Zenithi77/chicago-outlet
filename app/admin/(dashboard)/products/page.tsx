import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/data/categories";
import { ProductsClient, type ProductRow } from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, sku, name, slug, brand, category, subcategory, gender, price, discount_percent, total_stock, is_active, is_featured, is_new_arrival, images, collection, branch_stock, is_online, material, fit, season, tags, sizes, size_prices, colors, short_description, description, care_instructions"
    )
    .order("created_at", { ascending: false });

  const rows: ProductRow[] = (data ?? []).map((p) => ({
    id: p.id as string,
    sku: p.sku as string,
    name: p.name as string,
    slug: (p.slug as string) ?? "",
    brand: (p.brand as string) ?? "Chicago Outlet",
    category: (p.category as string) ?? "",
    subcategory: (p.subcategory as string) ?? "",
    gender: (p.gender as string) ?? "unisex",
    branchStock: (p.branch_stock as Record<string, number>) ?? {},
    isOnline: Boolean(p.is_online),
    price: Number(p.price ?? 0),
    discountPercent: Number(p.discount_percent ?? 0),
    totalStock: Number(p.total_stock ?? 0),
    isActive: Boolean(p.is_active),
    isFeatured: Boolean(p.is_featured),
    isNewArrival: Boolean(p.is_new_arrival),
    images: (p.images as string[]) ?? [],
    collection: (p.collection as string) ?? "",
    material: (p.material as string) ?? "",
    fit: (p.fit as string) ?? "regular",
    season: (p.season as string) ?? "",
    tags: (p.tags as string[]) ?? [],
    sizes: (p.sizes as string[]) ?? [],
    sizePrices: (p.size_prices as Array<{size: string; price: number}>) ?? [],
    colors: (p.colors as Array<{name: string; hex: string; stock: number}>) ?? [],
    shortDescription: (p.short_description as string) ?? "",
    description: (p.description as string) ?? "",
    careInstructions: (p.care_instructions as string) ?? "",
  }));

  const categories = CATEGORIES.map((c) => ({ name: c.name, nameMn: c.nameMn }));

  return (
    <ProductsClient
      initial={rows}
      categories={categories}
      loadError={error?.message ?? null}
    />
  );
}
