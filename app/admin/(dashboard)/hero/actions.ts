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
