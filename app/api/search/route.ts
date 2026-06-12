import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 1) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, brand, category, subcategory, price, discount_percent, images, total_stock")
    .eq("is_active", true)
    .or(`name.ilike.${pattern},brand.ilike.${pattern},category.ilike.${pattern},subcategory.ilike.${pattern}`)
    .limit(8);

  if (error) return NextResponse.json({ results: [], error: error.message });

  const results = (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    price: Number(p.price),
    discountPercent: p.discount_percent ?? 0,
    finalPrice: p.discount_percent > 0
      ? Math.round(Number(p.price) * (1 - p.discount_percent / 100))
      : Number(p.price),
    image: (p.images as string[])?.[0] ?? p.slug,
    soldOut: (p.total_stock ?? 0) <= 0,
  }));

  return NextResponse.json({ results });
}
