"use server";

import { revalidatePath } from "next/cache";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type HeroKey = "hero_park_od" | "hero_riveria" | "hero_online";

/** Save a remote URL directly to site_settings (no upload). */
export async function saveHeroUrl(
  key: HeroKey,
  url: string
): Promise<{ error?: string }> {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) return { error: "Зөвшөөрөлгүй." };

  if (url !== "" && !/^https?:\/\//i.test(url)) return { error: "Зөв URL оруулна уу." };

  try {
    const db = createAdminClient();
    await db
      .from("site_settings")
      .upsert({ key, value: url, updated_at: new Date().toISOString() });
  } catch {
    return { error: "Мэдээлэл хадгалахад алдаа гарлаа. site_settings хүснэгт үүссэн эсэхийг шалгана уу." };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  return {};
}

/**
 * Generic setter for any site_settings key (text values: announcement
 * lines, promo banner copy, image URLs, CTA links, etc.).
 */
export async function saveSetting(
  key: string,
  value: string
): Promise<{ error?: string }> {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) return { error: "Зөвшөөрөлгүй." };

  try {
    const db = createAdminClient();
    await db
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
  } catch {
    return { error: "Хадгалахад алдаа гарлаа." };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  return {};
}

/** Save many settings at once (used by the promo banner form). */
export async function saveSettings(
  entries: Record<string, string>
): Promise<{ error?: string }> {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) return { error: "Зөвшөөрөлгүй." };

  try {
    const db = createAdminClient();
    const now = new Date().toISOString();
    const rows = Object.entries(entries).map(([key, value]) => ({
      key,
      value,
      updated_at: now,
    }));
    await db.from("site_settings").upsert(rows);
  } catch {
    return { error: "Хадгалахад алдаа гарлаа." };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  return {};
}
