import { NextResponse } from "next/server";
import { createInvoice, isQpayConfigured } from "@/lib/qpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ItemPayload = {
  productId: string;
  productName: string;
  sku?: string;
  size?: string;
  color?: string;
  qty: number;
  unitPrice: number;
  image?: string;
};

type Payload = {
  orderId: string;
  amount: number;
  description?: string;
  customer: { name: string; email: string; phone: string; address: string };
  items: ItemPayload[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode?: string | null;
  shippingMethod?: "standard" | "express" | "pickup";
  notes?: string | null;
};

export async function POST(request: Request) {
  if (!isQpayConfigured()) {
    return NextResponse.json(
      { error: "QPay тохиргоо дутуу (env QPAY_USERNAME/QPAY_PASSWORD/QPAY_INVOICE_CODE)." },
      { status: 500 }
    );
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "JSON буруу." }, { status: 400 });
  }

  const orderId = (body.orderId ?? "").toString().trim();
  const amount = Number(body.amount);
  if (!orderId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "orderId болон amount шаардлагатай." }, { status: 400 });
  }
  if (!body.customer?.phone || !body.items?.length) {
    return NextResponse.json({ error: "Хэрэглэгчийн мэдээлэл болон бараа дутуу." }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const supa = await createSupabaseServerClient();
    const { data } = await supa.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  const admin = createAdminClient();

  const items = body.items.map((i) => ({ ...i, subtotal: i.unitPrice * i.qty }));

  const { error: insertErr } = await admin.from("orders").upsert(
    {
      id: orderId,
      customer_name: body.customer.name,
      customer_email: body.customer.email,
      customer_phone: body.customer.phone,
      customer_address: body.customer.address,
      subtotal: Math.round(body.subtotal),
      shipping_fee: Math.round(body.shippingFee),
      discount_amount: Math.round(body.discountAmount),
      coupon_code: body.couponCode ?? null,
      total: Math.round(amount),
      payment_status: "unpaid",
      payment_method: "qpay",
      shipping_method: body.shippingMethod ?? "standard",
      notes: body.notes ?? null,
    },
    { onConflict: "id" }
  );

  if (insertErr) {
    return NextResponse.json({ error: `Захиалга хадгалах алдаа: ${insertErr.message}` }, { status: 500 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? request.headers.get("origin") ?? "";
  const callbackUrl =
    process.env.QPAY_CALLBACK_URL ??
    (site ? `${site.replace(/\/+$/, "")}/api/qpay/callback?order_id=${encodeURIComponent(orderId)}` : "");

  if (!callbackUrl) {
    return NextResponse.json({ error: "Callback URL тохируулаагүй." }, { status: 500 });
  }

  try {
    const invoice = await createInvoice({
      senderInvoiceNo: orderId,
      invoiceReceiverCode: body.customer.phone || "terminal",
      description: body.description || `Захиалга ${orderId}`,
      amount: Math.round(amount),
      callbackUrl,
    });

    await admin.from("orders").update({ qpay_invoice_id: invoice.invoice_id }).eq("id", orderId);

    return NextResponse.json(invoice);
  } catch (err) {
    const message = err instanceof Error ? err.message : "QPay invoice үүсгэхэд алдаа.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
