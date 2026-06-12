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
