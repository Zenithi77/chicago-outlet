import { createClient } from "@/lib/supabase/server";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { HeroSettingsClient } from "./HeroSettingsClient";

export const dynamic = "force-dynamic";

const KEYS = [
  // Branch hero images (existing)
  "hero_park_od",
  "hero_riveria",
  "hero_online",
  // Top announcement bar
  "announcement_1",
  "announcement_2",
  "announcement_3",
  // Promo banner 1
  "promo1_image",
  "promo1_eyebrow",
  "promo1_eyebrow_color",
  "promo1_title",
  "promo1_subtitle",
  "promo1_cta_label",
  "promo1_cta_href",
  // Promo banner 2
  "promo2_image",
  "promo2_eyebrow",
  "promo2_eyebrow_color",
  "promo2_title",
  "promo2_subtitle",
  "promo2_cta_label",
  "promo2_cta_href",
];

export default async function HeroSettingsPage() {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) redirect("/account");

  const supabase = await createClient();
  const settings: Record<string, string> = {};
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", KEYS);
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }
  } catch {
    // site_settings table may not exist yet — show empty state
  }

  return <HeroSettingsClient settings={settings} />;
}
