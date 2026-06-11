import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAnnouncements(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["announcement_1", "announcement_2", "announcement_3"]);
    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return ["announcement_1", "announcement_2", "announcement_3"]
      .map((k) => (map[k] ?? "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function getSubcategoriesByCategory(): Promise<Record<string, string[]>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("category, subcategory")
      .eq("is_active", true)
      .not("subcategory", "is", null);

    const map: Record<string, Set<string>> = {};
    for (const row of (data ?? []) as { category: string; subcategory: string }[]) {
      if (!row.category || !row.subcategory) continue;
      (map[row.category] ??= new Set()).add(row.subcategory);
    }
    const out: Record<string, string[]> = {};
    for (const [cat, set] of Object.entries(map)) {
      out[cat] = Array.from(set).sort();
    }
    return out;
  } catch {
    return {};
  }
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [announcements, subcategoriesByCategory] = await Promise.all([
    getAnnouncements(),
    getSubcategoriesByCategory(),
  ]);
  return (
    <>
      <Header
        announcements={announcements}
        subcategoriesByCategory={subcategoriesByCategory}
      />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
