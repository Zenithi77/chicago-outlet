import { createClient } from "@/lib/supabase/server";
import CustomersClient, { type Customer } from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      created_at,
      status,
      payment_status,
      total,
      shipping_fee,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      order_items(product_name, sku, size, color, qty, unit_price, subtotal, image)
    `)
    .order("created_at", { ascending: false });

  const map = new Map<string, Customer>();

  for (const o of orders ?? []) {
    const key = o.customer_email;
    const existing = map.get(key);

    const orderEntry = {
      id: o.id,
      createdAt: o.created_at,
      status: o.status ?? "pending",
      paymentStatus: o.payment_status ?? "unpaid",
      total: Number(o.total),
      shippingFee: Number(o.shipping_fee),
      address: o.customer_address ?? "",
      items: ((o.order_items as any[]) ?? []).map((i) => ({
        productName: i.product_name,
        sku: i.sku ?? null,
        size: i.size ?? null,
        color: i.color ?? null,
        qty: i.qty,
        unitPrice: Number(i.unit_price),
        subtotal: Number(i.subtotal),
        image: i.image ?? null,
      })),
    };

    if (existing) {
      existing.orders.push(orderEntry);
      if (o.payment_status === "paid") existing.totalSpent += Number(o.total);
      existing.orderCount += 1;
    } else {
      map.set(key, {
        email: o.customer_email,
        name: o.customer_name,
        phone: o.customer_phone ?? "",
        orders: [orderEntry],
        totalSpent: o.payment_status === "paid" ? Number(o.total) : 0,
        orderCount: 1,
      });
    }
  }

  const customers = [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent);

  return <CustomersClient customers={customers} />;
}
