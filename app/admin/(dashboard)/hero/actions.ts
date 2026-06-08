"use server";

import { revalidatePath } from "next/cache";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";

export type HeroKey = "hero_park_od" | "hero_riveria" | "hero_online";

/** Upload an image file and save its URL to site_settings. */
export async function uploadHeroImage(
  key: HeroKey,
  formData: FormData
): Promise<{ error?: string; url?: string }> {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) return { error: "Зөвшөөрөлгүй." };

  if (!isCloudinaryConfigured())
    return { error: "Cloudinary тохиргоо дутуу байна (.env.local шалгана уу)." };

  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Файл олдсонгүй." };
  if (!file.type.startsWith("image/")) return { error: "Зөвхөн зураг файл оруулна уу." };
  if (file.size > 10 * 1024 * 1024) return { error: "Зураг 10MB-ээс хэтэрсэн." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  let url: string;
  try {
    url = await uploadToCloudinary(dataUri);
  } catch (e) {
    return { error: "Cloudinary upload амжилтгүй болсон: " + (e instanceof Error ? e.message : String(e)) };
  }

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
  return { url };
}

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
