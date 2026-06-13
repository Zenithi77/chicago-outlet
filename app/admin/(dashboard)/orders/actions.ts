"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";

type Branch = "park_od" | "riveria";

export async function updateOrderStatus(
  orderId: string,
  status: string,
  shipBranch?: Branch
) {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) return { error: "Эрх хүрэхгүй" };

  const admin = createAdminClient();

  // When moving to "shipped" we deduct stock from the chosen branch.
  if (status === "shipped") {
    if (!shipBranch) return { error: "Хүргэлтийн салбараа сонгоно уу." };

    const { data: order, error: oerr } = await admin
      .from("orders")
      .select("id, status, ship_branch, order_items(product_name, sku, size, qty)")
      .eq("id", orderId)
      .single();
    if (oerr || !order) return { error: oerr?.message ?? "Захиалга олдсонгүй." };
    if (order.status === "shipped" || order.status === "delivered") {
      return { error: "Энэ захиалгын нөөц аль хэдийн хасагдсан байна." };
    }

    const items = (order.order_items ?? []) as Array<{
      sku: string;
      size: string;
      qty: number;
      product_name: string;
    }>;

    const skus = Array.from(new Set(items.map((i) => i.sku).filter(Boolean)));
    if (skus.length > 0) {
      const { data: products, error: perr } = await admin
        .from("products")
        .select("id, sku, name, branch_size_stocks, branch_stock, size_stocks, total_stock")
        .in("sku", skus);
      if (perr) return { error: perr.message };

      const bySku = new Map(
        (products ?? []).map((p) => [p.sku as string, p] as const)
      );

      for (const item of items) {
        const p = bySku.get(item.sku);
        if (!p) continue;

        const bss = (p.branch_size_stocks as Record<string, Record<string, number>>) ?? {};
        const branchMap = { ...(bss[shipBranch] ?? {}) };
        const sizeKey = item.size || "";
        const available = branchMap[sizeKey] ?? 0;
        if (available < item.qty) {
          const branchLabel = shipBranch === "park_od" ? "Park-Od" : "Riveria";
          return {
            error: `${p.name} (${item.size || "—"}): ${branchLabel} салбарт ${available}ш үлдсэн, ${item.qty}ш хэрэгтэй.`,
          };
        }
        branchMap[sizeKey] = available - item.qty;
        const nextBss = { ...bss, [shipBranch]: branchMap };

        const branch_stock: Record<string, number> = {};
        const sizeTotals: Record<string, number> = {};
        for (const [b, m] of Object.entries(nextBss)) {
          branch_stock[b] = Object.values(m).reduce((a, n) => a + n, 0);
          for (const [s, n] of Object.entries(m)) {
            sizeTotals[s] = (sizeTotals[s] ?? 0) + n;
          }
        }
        const size_stocks = Object.entries(sizeTotals).map(([size, stock]) => ({ size, stock }));
        const total_stock = Object.values(branch_stock).reduce((a, n) => a + n, 0);

        const { error: uerr } = await admin
          .from("products")
          .update({
            branch_size_stocks: nextBss,
            branch_stock,
            size_stocks,
            total_stock,
          })
          .eq("id", p.id);
        if (uerr) return { error: uerr.message };
      }
    }

    const { error } = await admin
      .from("orders")
      .update({ status, ship_branch: shipBranch })
      .eq("id", orderId);
    if (error) return { error: error.message };
    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");
    return { ok: true };
  }

  const { error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  return { ok: true };
}
