import { NextResponse } from "next/server";
import { checkPayment, isQpayConfigured } from "@/lib/qpay";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// qPay callback. Never trust the caller — re-verify via /payment/check
// using the order's stored qpay_invoice_id before marking as paid.
async function handle(orderId: string | null) {
  if (!orderId) return { ok: false, error: "order_id required" };
  if (!isQpayConfigured()) return { ok: false, error: "qpay not configured" };

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, qpay_invoice_id, payment_status")
    .eq("id", orderId)
    .single();

  if (error || !order) return { ok: false, error: "order not found" };
  if (order.payment_status === "paid") return { ok: true, alreadyPaid: true };
  if (!order.qpay_invoice_id) return { ok: false, error: "no invoice id" };

  const check = await checkPayment(order.qpay_invoice_id);
  const paid = (check.rows ?? []).some((r) => r.payment_status === "PAID");
  if (!paid) return { ok: true, paid: false };

  const { error: updateErr } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      status: "processing",
      qpay_paid_amount: check.paid_amount ?? 0,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("payment_status", "paid");

  if (!updateErr) {
    // Decrement stock for each order item
    const { data: orderItems } = await admin
      .from("order_items")
      .select("product_id, size, qty")
      .eq("order_id", orderId);

    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        if (!item.product_id) continue;

        // Fetch current product stock
        const { data: product } = await admin
          .from("products")
          .select("total_stock, size_stocks")
          .eq("id", item.product_id)
          .single();

        if (!product) continue;

        const sizeStocks: { size: string; stock: number }[] = (product.size_stocks as { size: string; stock: number }[]) ?? [];

        let newSizeStocks = sizeStocks;
        if (item.size && sizeStocks.length > 0) {
          // Decrement the specific size's stock
          newSizeStocks = sizeStocks.map((ss) =>
            ss.size === item.size
              ? { ...ss, stock: Math.max(0, ss.stock - item.qty) }
              : ss
          );
        }

        const newTotalStock = newSizeStocks.length > 0
          ? newSizeStocks.reduce((sum, ss) => sum + ss.stock, 0)
          : Math.max(0, (product.total_stock ?? 0) - item.qty);

        await admin
          .from("products")
          .update({
            size_stocks: newSizeStocks,
            total_stock: newTotalStock,
          })
          .eq("id", item.product_id);
      }
    }
  }

  return { ok: true, paid: true };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");
  const result = await handle(orderId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let orderId = url.searchParams.get("order_id");
  if (!orderId) {
    try {
      const body = (await request.json()) as { order_id?: string; sender_invoice_no?: string };
      orderId = body.order_id ?? body.sender_invoice_no ?? null;
    } catch {
      // ignore
    }
  }
  const result = await handle(orderId);
  return NextResponse.json(result);
}
