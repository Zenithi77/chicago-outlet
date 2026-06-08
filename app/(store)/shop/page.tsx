import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { ShopClient } from "./ShopClient";
import { PRODUCTS } from "@/lib/data/products";

export const dynamic = "force-dynamic";

async function fetchProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return PRODUCTS;
    }

    return data.map((row) => ({
      id: row.sku ?? row.id,
      name: row.name,
      slug: row.slug,
      brand: row.brand ?? "Chicago Outlet",
      category: row.category,
      subcategory: row.subcategory ?? "",
      gender: row.gender,
      description: row.description ?? "",
      shortDescription: row.short_description ?? "",
      price: row.price,
      currency: row.currency ?? "MNT",
      discountPercent: row.discount_percent ?? 0,
      images: row.images ?? [],
      sizes: row.sizes ?? [],
      colors: row.colors ?? [],
      tags: row.tags ?? [],
      isFeatured: row.is_featured ?? false,
      isNewArrival: row.is_new_arrival ?? false,
      isOnSale: row.is_on_sale ?? false,
      isActive: row.is_active ?? true,
      careInstructions: row.care_instructions ?? "",
      material: row.material ?? "",
      fit: row.fit ?? "regular",
      season: row.season ?? "all-season",
      collection: row.collection ?? "",
      rating: Number(row.rating ?? 0),
      reviewCount: row.review_count ?? 0,
      totalStock: row.total_stock ?? 0,
      branch: row.branch ?? undefined,
      branchStock: row.branch_stock ?? {},
      isOnline: row.is_online ?? false,
      createdAt: row.created_at,
    }));
  } catch {
    return PRODUCTS;
  }
}

export default async function ShopPage() {
  const products = await fetchProducts();
  return <ShopClient products={products} />;
}
