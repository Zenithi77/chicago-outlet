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

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcements = await getAnnouncements();
  return (
    <>
      <Header announcements={announcements} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}

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

async function getSubcategoryData(): Promise<{
  byCategory: Record<string, string[]>;
  byCategoryGender: Record<string, Record<string, string[]>>;
}> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("category, subcategory, gender")
      .eq("is_active", true)
      .not("subcategory", "is", null)
      .neq("subcategory", "");

    const byCat: Record<string, Set<string>> = {};
    const byCatGender: Record<string, Record<string, Set<string>>> = {};
    for (const row of (data ?? []) as {
      category: string;
      subcategory: string;
      gender: string | null;
    }[]) {
      if (!row.category || !row.subcategory) continue;
      (byCat[row.category] ??= new Set()).add(row.subcategory);
      const g = (row.gender ?? "unisex").toLowerCase();
      ((byCatGender[row.category] ??= {})[g] ??= new Set()).add(row.subcategory);
    }
    const byCategory: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(byCat)) byCategory[k] = Array.from(v).sort();
    const byCategoryGender: Record<string, Record<string, string[]>> = {};
    for (const [cat, gMap] of Object.entries(byCatGender)) {
      byCategoryGender[cat] = {};
      for (const [g, set] of Object.entries(gMap)) {
        byCategoryGender[cat][g] = Array.from(set).sort();
      }
    }
    return { byCategory, byCategoryGender };
  } catch {
    return { byCategory: {}, byCategoryGender: {} };
  }
}

async function getBrands(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("brand")
      .eq("is_active", true)
      .not("brand", "is", null)
      .neq("brand", "");
    const brands = Array.from(new Set((data ?? []).map((r: { brand: string }) => r.brand)))
      .filter(Boolean)
      .sort() as string[];
    return brands;
  } catch {
    return [];
  }
}

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [announcements, subData, brands] = await Promise.all([
    getAnnouncements(),
    getSubcategoryData(),
    getBrands(),
  ]);
  return (
    <>
      <Header
        announcements={announcements}
        subcategoriesByCategory={subData.byCategory}
        subcategoriesByCategoryGender={subData.byCategoryGender}
        brands={brands}
      />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
