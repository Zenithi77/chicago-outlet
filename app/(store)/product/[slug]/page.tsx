import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/data/products";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

function mapRow(data: Record<string, unknown>): Product {
  return {
    id: (data.sku ?? data.id) as string,
    name: data.name as string,
    slug: data.slug as string,
    brand: (data.brand as string) ?? "Chicago Outlet",
    category: data.category as string,
    subcategory: (data.subcategory as string) ?? "",
    gender: data.gender as Product["gender"],
    description: (data.description as string) ?? "",
    shortDescription: (data.short_description as string) ?? "",
    price: data.price as number,
    currency: ((data.currency as string) ?? "MNT") as import("@/lib/types").Currency,
    discountPercent: Number(data.discount_percent ?? 0),
    images: (data.images as string[]) ?? [],
    sizes: (data.sizes as string[]) ?? [],
    sizePrices: (data.size_prices as Product["sizePrices"]) ?? [],
    colors: (data.colors as Product["colors"]) ?? [],
    tags: (data.tags as string[]) ?? [],
    isFeatured: Boolean(data.is_featured),
    isNewArrival: Boolean(data.is_new_arrival),
    isOnSale: Boolean(data.is_on_sale),
    isActive: Boolean(data.is_active ?? true),
    careInstructions: (data.care_instructions as string) ?? "",
    material: (data.material as string) ?? "",
    fit: (data.fit as Product["fit"]) ?? "regular",
    season: (data.season as string) ?? "all-season",
    collection: (data.collection as string) ?? "",
    rating: Number(data.rating ?? 0),
    reviewCount: Number(data.review_count ?? 0),
    totalStock: Number(data.total_stock ?? 0),
    branchStock: (data.branch_stock as Record<string, number>) ?? {},
    isOnline: Boolean(data.is_online),
    createdAt: data.created_at as string,
  };
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    if (error || !data) return null;
    return mapRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function fetchRelated(product: Product): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .neq("slug", product.slug)
      .or(
        `category.eq.${product.category},subcategory.eq.${product.subcategory},brand.eq.${product.brand}`
      )
      .limit(8);

    if (!data?.length) return [];

    // Prefer same category+subcategory, then same category, then same brand
    const rows = (data as Record<string, unknown>[]).map(mapRow);
    rows.sort((a, b) => {
      const score = (p: Product) =>
        (p.category === product.category && p.subcategory === product.subcategory ? 2 : 0) +
        (p.category === product.category ? 1 : 0) +
        (p.brand === product.brand ? 1 : 0);
      return score(b) - score(a);
    });
    return rows.slice(0, 4);
  } catch {
    return [];
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try Supabase first, fall back to static demo data
  let product: Product | null = await fetchProductBySlug(slug);
  if (!product) {
    product = getProductBySlug(slug) ?? null;
  }
  if (!product) notFound();

  const [related, profile] = await Promise.all([fetchRelated(product), getProfile()]);
  const isLoggedIn = !!profile;

  return (
    <div className="animate-fade-up">
      <ProductDetail product={product} isLoggedIn={isLoggedIn} />

      {related.length > 0 && (
      <section className="container-page py-12">
        <h2 className="mb-6 font-serif text-2xl font-bold">Танд таалагдаж магадгүй</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
