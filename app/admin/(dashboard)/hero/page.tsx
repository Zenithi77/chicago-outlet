import { createClient } from "@/lib/supabase/server";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { HeroSettingsClient } from "./HeroSettingsClient";

export const dynamic = "force-dynamic";

export default async function HeroSettingsPage() {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) redirect("/account");

  const supabase = await createClient();
  let settings: Record<string, string> = {};
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["hero_park_od", "hero_riveria", "hero_online"]);
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }
  } catch {
    // site_settings table may not exist yet — show empty state
  }

  return <HeroSettingsClient settings={settings} />;
}
