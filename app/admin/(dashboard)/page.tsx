import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardClient, type DashboardData } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const [productsRes, ordersRes] = await Promise.all([
    admin.from("products").select("id, name, category, price, total_stock"),
    admin
      .from("orders")
      .select(
        `id, created_at, status, payment_status, total, customer_name,
         order_items(product_id, product_name, qty, subtotal)`
      )
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const products = productsRes.data ?? [];
  const orders = ordersRes.data ?? [];

  const paidOrders = orders.filter((o: any) => o.payment_status === "paid");
  const revenue = paidOrders.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
  const paidCount = paidOrders.length;
  const orderCount = orders.length;
  const aov = paidCount ? Math.round(revenue / paidCount) : 0;
  const pending = orders.filter((o: any) => (o.status ?? "pending") === "pending").length;

  const skuCount = products.length;
  const stockValue = products.reduce(
    (s: number, p: any) => s + Number(p.total_stock ?? 0) * Number(p.price ?? 0),
    0
  );

  const productMap = new Map<string, { name: string; category: string }>();
  products.forEach((p: any) =>
    productMap.set(p.id, { name: p.name ?? "", category: p.category ?? "Бусад" })
  );

  const byCat: Record<string, number> = {};
  const sold: Record<string, { name: string; qty: number; rev: number }> = {};
  paidOrders.forEach((o: any) =>
    (o.order_items ?? []).forEach((i: any) => {
      const meta = i.product_id ? productMap.get(i.product_id) : undefined;
      const cat = meta?.category || "Бусад";
      const sub = Number(i.subtotal ?? 0);
      byCat[cat] = (byCat[cat] ?? 0) + sub;

      const key = i.product_id || i.product_name || "—";
      if (!sold[key]) sold[key] = { name: i.product_name ?? meta?.name ?? "—", qty: 0, rev: 0 };
      sold[key].qty += Number(i.qty ?? 0);
      sold[key].rev += sub;
    })
  );
  const topSellers = Object.values(sold).sort((a, b) => b.rev - a.rev).slice(0, 5);

  const lowStock = products
    .filter((p: any) => Number(p.total_stock ?? 0) > 0 && Number(p.total_stock ?? 0) <= 5)
    .map((p: any) => ({ id: p.id, name: p.name, totalStock: Number(p.total_stock) }));
  const outStock = products
    .filter((p: any) => Number(p.total_stock ?? 0) <= 0)
    .map((p: any) => ({ id: p.id, name: p.name, totalStock: 0 }));

  const recentOrders = orders.slice(0, 5).map((o: any) => ({
    id: o.id,
    customer: o.customer_name ?? "—",
    createdAt: o.created_at,
    total: Number(o.total ?? 0),
  }));

  const data: DashboardData = {
    revenue, orderCount, paidCount, aov, pending, skuCount, stockValue,
    byCat, topSellers, lowStock, outStock, recentOrders,
  };

  return <DashboardClient data={data} />;
}
