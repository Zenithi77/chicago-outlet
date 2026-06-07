import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/data/categories";
import { ProductsClient, type ProductRow } from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, sku, name, category, gender, branch, price, discount_percent, total_stock, is_active, images, collection"
    )
    .order("created_at", { ascending: false });

  const rows: ProductRow[] = (data ?? []).map((p) => ({
    id: p.id as string,
    sku: p.sku as string,
    name: p.name as string,
    category: (p.category as string) ?? "",
    gender: (p.gender as string) ?? "unisex",
    branch: ((p.branch as string) ?? "online") as "park_od" | "riveria" | "online",
    price: Number(p.price ?? 0),
    discountPercent: Number(p.discount_percent ?? 0),
    totalStock: Number(p.total_stock ?? 0),
    isActive: Boolean(p.is_active),
    images: (p.images as string[]) ?? [],
    collection: (p.collection as string) ?? "",
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
