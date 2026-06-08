import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

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

    return {
      id: data.sku ?? data.id,
      name: data.name,
      slug: data.slug,
      brand: data.brand ?? "Chicago Outlet",
      category: data.category,
      subcategory: data.subcategory ?? "",
      gender: data.gender,
      description: data.description ?? "",
      shortDescription: data.short_description ?? "",
      price: data.price,
      currency: data.currency ?? "MNT",
      discountPercent: data.discount_percent ?? 0,
      images: data.images ?? [],
      sizes: data.sizes ?? [],
      colors: data.colors ?? [],
      tags: data.tags ?? [],
      isFeatured: data.is_featured ?? false,
      isNewArrival: data.is_new_arrival ?? false,
      isOnSale: data.is_on_sale ?? false,
      isActive: data.is_active ?? true,
      careInstructions: data.care_instructions ?? "",
      material: data.material ?? "",
      fit: data.fit ?? "regular",
      season: data.season ?? "all-season",
      collection: data.collection ?? "",
      rating: Number(data.rating ?? 0),
      reviewCount: data.review_count ?? 0,
      totalStock: data.total_stock ?? 0,
      branch: data.branch ?? undefined,
      createdAt: data.created_at,
    };
  } catch {
    return null;
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

  const related = getRelatedProducts(product, 4);

  return (
    <div className="animate-fade-up">
      <ProductDetail product={product} />

      <section className="container-page py-12">
        <h2 className="mb-6 font-serif text-2xl font-bold">Танд таалагдаж магадгүй</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
