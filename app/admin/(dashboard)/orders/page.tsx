import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { AdminOrdersClient } from "./AdminOrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) redirect("/account");

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select(
      `id, created_at, status, payment_status, total, subtotal, shipping_fee, discount_amount, coupon_code,
       customer_name, customer_email, customer_phone, customer_address,
       payment_method, shipping_method, tracking_number, notes,
       order_items(id, product_id, product_name, sku, size, color, qty, unit_price, subtotal, image, products(category))`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const orders = (data ?? []).map((o: any) => ({
    id: o.id,
    createdAt: o.created_at,
    status: o.status ?? "pending",
    paymentStatus: o.payment_status ?? "pending",
    total: o.total ?? 0,
    subtotal: o.subtotal ?? 0,
    shippingFee: o.shipping_fee ?? 0,
    discountAmount: o.discount_amount ?? 0,
    couponCode: o.coupon_code ?? "",
    paymentMethod: o.payment_method ?? "qpay",
    shippingMethod: o.shipping_method ?? "standard",
    trackingNumber: o.tracking_number ?? "",
    notes: o.notes ?? "",
    customer: {
      name: o.customer_name ?? "",
      email: o.customer_email ?? "",
      phone: o.customer_phone ?? "",
      address: o.customer_address ?? "",
    },
    items: (o.order_items ?? []).map((i: any) => ({
      id: i.id ?? "",
      productId: i.product_id ?? "",
      category: i.products?.category ?? "",
      productName: i.product_name ?? "",
      sku: i.sku ?? "",
      size: i.size ?? "",
      color: i.color ?? "",
      qty: i.qty ?? 1,
      unitPrice: i.unit_price ?? 0,
      subtotal: i.subtotal ?? 0,
      image: i.image ?? "",
    })),
  }));

  return <AdminOrdersClient initialOrders={orders} />;
}
