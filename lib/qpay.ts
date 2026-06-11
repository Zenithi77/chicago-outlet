// Lightweight qPay v2 client. Auth uses Basic to get a bearer token, then we
// reuse it across requests until expiry. Tokens live in module scope (per
// serverless instance) — fine for our low-volume checkout flow.

const BASE_URL = (process.env.QPAY_BASE_URL ?? "https://merchant.qpay.mn/v2").replace(/\/+$/, "");
const USERNAME = process.env.QPAY_USERNAME ?? "";
const PASSWORD = process.env.QPAY_PASSWORD ?? "";
const INVOICE_CODE = process.env.QPAY_INVOICE_CODE ?? "";

export function isQpayConfigured(): boolean {
  return Boolean(USERNAME && PASSWORD && INVOICE_CODE);
}

type TokenCache = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
};

let cached: TokenCache | null = null;

async function fetchToken(): Promise<TokenCache> {
  const basic = Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");
  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`qPay auth failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
  };
  // qPay tokens are long-lived (years) but we still apply a safety window.
  const ttlMs = (data.expires_in ?? 3600) * 1000;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + ttlMs - 60_000,
  };
}

async function getAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expires_at) return cached.access_token;
  cached = await fetchToken();
  return cached.access_token;
}

async function authedFetch(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.json !== undefined) headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    cache: "no-store",
  });

  // If token rejected, refresh once and retry.
  if (res.status === 401) {
    cached = null;
    const newToken = await getAccessToken();
    headers.set("Authorization", `Bearer ${newToken}`);
    return fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      cache: "no-store",
    });
  }
  return res;
}

export type QpayInvoiceResponse = {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // base64 PNG (no data: prefix in some versions)
  qPay_shortUrl?: string;
  urls?: { name: string; description?: string; link: string; logo?: string }[];
};

/**
 * Create a simple invoice. `senderInvoiceNo` should be the merchant-side
 * order id so you can correlate callbacks.
 */
export async function createInvoice(args: {
  senderInvoiceNo: string;
  invoiceReceiverCode: string; // e.g. "terminal" or customer code
  description: string;
  amount: number;
  callbackUrl: string;
}): Promise<QpayInvoiceResponse> {
  const body = {
    invoice_code: INVOICE_CODE,
    sender_invoice_no: args.senderInvoiceNo,
    invoice_receiver_code: args.invoiceReceiverCode || "terminal",
    invoice_description: args.description,
    amount: args.amount,
    callback_url: args.callbackUrl,
  };
  const res = await authedFetch("/invoice", { method: "POST", json: body });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`qPay invoice create failed (${res.status}): ${text}`);
  }
  return (await res.json()) as QpayInvoiceResponse;
}

export type QpayPaymentCheck = {
  count: number;
  paid_amount: number;
  rows: Array<{
    payment_id: string;
    payment_status: "NEW" | "FAILED" | "PAID" | "REFUNDED";
    payment_amount: number;
    payment_date: string;
  }>;
};

/** Check whether the invoice has been paid. */
export async function checkPayment(invoiceId: string): Promise<QpayPaymentCheck> {
  const res = await authedFetch("/payment/check", {
    method: "POST",
    json: {
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`qPay payment check failed (${res.status}): ${text}`);
  }
  return (await res.json()) as QpayPaymentCheck;
}

/** Cancel an unpaid invoice. */
export async function cancelInvoice(invoiceId: string): Promise<void> {
  const res = await authedFetch(`/invoice/${invoiceId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`qPay invoice cancel failed (${res.status}): ${text}`);
  }
}
