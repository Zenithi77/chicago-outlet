"use server";

import { revalidatePath } from "next/cache";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type DiscountResult = { ok: true } | { ok: false; error: string };

/**
 * Set or clear a per-product discount. `percent` is clamped to 0..95.
 * `expiresAt` is an ISO timestamp (or null = no expiry).
 * When the discount expires the storefront will display the product at full
 * price (handled in the shop fetcher).
 */
export async function setDiscount(
  productId: string,
  percent: number,
  expiresAt: string | null
): Promise<DiscountResult> {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) return { ok: false, error: "Зөвшөөрөлгүй." };

  const pct = Math.min(95, Math.max(0, Math.round(percent)));
  const expiresIso = expiresAt && expiresAt.trim() ? new Date(expiresAt).toISOString() : null;

  try {
    const db = createAdminClient();
    const { error } = await db
      .from("products")
      .update({
        discount_percent: pct,
        is_on_sale: pct > 0,
        discount_expires_at: pct > 0 ? expiresIso : null,
      })
      .eq("id", productId);
    if (error) return { ok: false, error: error.message };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Тодорхойгүй алдаа.";
    return { ok: false, error: message };
  }

  revalidatePath("/admin/discounts");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true };
}

/** Convenience: remove discount entirely. */
export async function clearDiscount(productId: string): Promise<DiscountResult> {
  return setDiscount(productId, 0, null);
}
