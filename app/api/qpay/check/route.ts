import { NextResponse } from "next/server";
import { checkPayment, isQpayConfigured } from "@/lib/qpay";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isQpayConfigured()) {
    return NextResponse.json({ error: "QPay тохиргоо дутуу." }, { status: 500 });
  }

  const url = new URL(request.url);
  const invoiceId = url.searchParams.get("invoice_id");
  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id шаардлагатай." }, { status: 400 });
  }

  try {
    const data = await checkPayment(invoiceId);
    const paid = (data.rows ?? []).some((r) => r.payment_status === "PAID");

    if (paid) {
      const admin = createAdminClient();
      await admin
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing",
          qpay_paid_amount: data.paid_amount ?? 0,
          paid_at: new Date().toISOString(),
        })
        .eq("qpay_invoice_id", invoiceId)
        .neq("payment_status", "paid");
    }

    return NextResponse.json({ paid, paidAmount: data.paid_amount ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "QPay шалгах үед алдаа.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
