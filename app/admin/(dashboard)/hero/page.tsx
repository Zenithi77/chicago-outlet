import { createClient } from "@/lib/supabase/server";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { HeroSettingsClient } from "./HeroSettingsClient";

export const dynamic = "force-dynamic";

export default async function HeroSettingsPage() {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) redirect("/account");

  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["hero_park_od", "hero_riveria", "hero_online"]);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return <HeroSettingsClient settings={settings} />;
}
