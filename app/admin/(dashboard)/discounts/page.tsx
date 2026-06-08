import { createClient } from "@/lib/supabase/server";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { DiscountsClient, type DiscountProduct } from "./DiscountsClient";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) redirect("/account");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, sku, name, slug, category, subcategory, price, discount_percent, discount_expires_at, images, is_active"
    )
    .order("name", { ascending: true });

  const rows: DiscountProduct[] = (data ?? []).map((p) => ({
    id: p.id as string,
    sku: (p.sku as string) ?? "",
    name: (p.name as string) ?? "",
    slug: (p.slug as string) ?? "",
    category: (p.category as string) ?? "",
    subcategory: (p.subcategory as string) ?? "",
    price: Number(p.price ?? 0),
    discountPercent: Number(p.discount_percent ?? 0),
    discountExpiresAt: (p.discount_expires_at as string | null) ?? null,
    image: ((p.images as string[]) ?? [])[0] ?? "",
    isActive: Boolean(p.is_active),
  }));

  return <DiscountsClient products={rows} loadError={error?.message ?? null} />;
}
