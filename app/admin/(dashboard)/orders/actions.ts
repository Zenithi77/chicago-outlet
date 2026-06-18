"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";

type Branch = "park_od" | "riveria";

const FOOD_CATEGORY = "Хүнс & Витамин";

export async function updateOrderStatus(
  orderId: string,
  status: string,
  branchByItem?: Record<string, Branch>
) {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) return { error: "Эрх хүрэхгүй" };

  const admin = createAdminClient();

  if (status === "shipped") {
    const { data: order, error: oerr } = await admin
      .from("orders")
      .select(
        `id, status,
         order_items(id, product_id, product_name, sku, size, qty)`
      )
      .eq("id", orderId)
      .single();
    if (oerr || !order) return { error: oerr?.message ?? "Захиалга олдсонгүй." };
    if (order.status === "shipped" || order.status === "delivered") {
      return { error: "Энэ захиалгын нөөц аль хэдийн хасагдсан байна." };
    }

    const items = (order.order_items ?? []) as Array<{
      id: string;
      product_id: string | null;
      product_name: string;
      sku: string;
      size: string;
      qty: number;
    }>;

    if (!branchByItem) return { error: "Бараа бүрд салбараа сонгоно уу." };
    for (const it of items) {
      if (!branchByItem[it.id]) {
        return { error: `"${it.product_name}" — салбар сонгоогүй байна.` };
      }
    }

    const productIds = Array.from(
      new Set(items.map((i) => i.product_id).filter(Boolean) as string[])
    );

    const productsById = new Map<string, any>();
    if (productIds.length > 0) {
      const { data: products, error: perr } = await admin
        .from("products")
        .select(
          "id, sku, name, category, branch_size_stocks, branch_stock, size_stocks, total_stock"
        )
        .in("id", productIds);
      if (perr) return { error: perr.message };
      (products ?? []).forEach((p) => productsById.set(p.id as string, p));
    }

    const planned = new Map<string, any>();

    for (const it of items) {
      if (!it.product_id) continue;
      const branch = branchByItem[it.id];
      const cur = planned.get(it.product_id) ?? productsById.get(it.product_id);
      if (!cur) continue;

      const isFood = (cur.category ?? "") === FOOD_CATEGORY;
      const branchLabel = branch === "park_od" ? "Park-Od" : "Riveria";

      if (isFood) {
        const branch_stock: Record<string, number> = { ...((cur.branch_stock as any) ?? {}) };
        const available = Number(branch_stock[branch] ?? 0);
        if (available < it.qty) {
          return {
            error: `${cur.name}: ${branchLabel} салбарт ${available}ш үлдсэн, ${it.qty}ш хэрэгтэй.`,
          };
        }
        branch_stock[branch] = available - it.qty;
        const total_stock = Object.values(branch_stock).reduce((a, n) => a + Number(n), 0);
        planned.set(it.product_id, { ...cur, branch_stock, total_stock });
      } else {
        const bss: Record<string, Record<string, number>> = JSON.parse(
          JSON.stringify((cur.branch_size_stocks as any) ?? {})
        );
        const branchMap = { ...(bss[branch] ?? {}) };
        const sizeKey = it.size || "";
        const available = Number(branchMap[sizeKey] ?? 0);
        if (available < it.qty) {
          return {
            error: `${cur.name} (${it.size || "—"}): ${branchLabel} салбарт ${available}ш үлдсэн, ${it.qty}ш хэрэгтэй.`,
          };
        }
        branchMap[sizeKey] = available - it.qty;
        bss[branch] = branchMap;

        const branch_stock: Record<string, number> = {};
        const sizeTotals: Record<string, number> = {};
        for (const [b, m] of Object.entries(bss)) {
          branch_stock[b] = Object.values(m).reduce((a, n) => a + Number(n), 0);
          for (const [s, n] of Object.entries(m)) {
            sizeTotals[s] = (sizeTotals[s] ?? 0) + Number(n);
          }
        }
        const size_stocks = Object.entries(sizeTotals).map(([size, stock]) => ({ size, stock }));
        const total_stock = Object.values(branch_stock).reduce((a, n) => a + n, 0);
        planned.set(it.product_id, {
          ...cur,
          branch_size_stocks: bss,
          branch_stock,
          size_stocks,
          total_stock,
        });
      }
    }

    for (const [pid, p] of planned) {
      const isFood = (p.category ?? "") === FOOD_CATEGORY;
      const update: Record<string, any> = {
        branch_stock: p.branch_stock,
        total_stock: p.total_stock,
      };
      if (!isFood) {
        update.branch_size_stocks = p.branch_size_stocks;
        update.size_stocks = p.size_stocks;
      }
      const { error: uerr } = await admin.from("products").update(update).eq("id", pid);
      if (uerr) return { error: uerr.message };
    }

    const { error } = await admin
      .from("orders")
      .update({ status })
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
