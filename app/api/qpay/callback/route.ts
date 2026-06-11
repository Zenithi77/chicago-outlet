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

  await admin
    .from("orders")
    .update({
      payment_status: "paid",
      status: "processing",
      qpay_paid_amount: check.paid_amount ?? 0,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("payment_status", "paid");

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
