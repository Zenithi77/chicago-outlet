"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/store/cart";
import { formatMNT, classNames, isValidMnPhone, isValidEmail, generateOrderId } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { CheckIcon, ArrowLeftIcon, CloseIcon } from "@/components/Icons";
import type { PaymentMethod } from "@/lib/types";

type QpayInvoice = {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  qPay_shortUrl?: string;
  urls?: { name: string; description?: string; link: string; logo?: string }[];
};

const STEPS = ["Хүргэлт", "Шалгах", "Төлбөр", "Баталгаажуулалт"];

const TERMS = [
  {
    title: "Төлбөрийн нөхцөл",
    body: "Төлбөрөө 100% шилжүүлснээр таны захиалга баталгаажих болно. Хямдралтай бүтээгдэхүүнийг буцаах болон солих боломжгүйг анхаарна уу. Размер, өнгө, загвар солиулах бол нийтлэг асуулт цэснээс бүтээгдэхүүн солих журамтай танилцана уу.",
  },
  {
    title: "Хүргэлтийн нөхцөл",
    body: `Улаанбаатар хот дотор хүргэлт ${(BRAND.deliveryFee as number).toLocaleString()}₮ үнэтэй ба таны захиалсан бүтээгдэхүүн захиалга баталгаажсан өдрөөс хойш 48–72 цагийн дотор хүргэгдэх болно. Хүргэлтээр очсон барааг буцаах, өөр төрлийн бараагаар солих боломжгүйг анхаарна уу.`,
  },
  {
    title: "Үйлчилгээний нөхцөл",
    body: "Та худалдан авсан барааны размер солиулах боломжтой ба барааны буцаалт хийх боломжгүй тул сонголтоо зөв хийнэ үү. 7 хоногийн дотор худалдан авалт хийсэн салбартаа ирж солиулах ба шошго, сав баглаа боодол нь бүрэн бүтэн байхыг анхаарна уу. Хямдралын аяны үеэр болон хямдарсан барааг ямар ч тохиолдолд буцаах болон солих боломжгүй.",
  },
];

export default function CheckoutPage() {
  const { items, discount, shippingMethod, clear } = useCart();
  const subtotal = useCart((s) => s.subtotal());
  const [step, setStep] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [payment] = useState<PaymentMethod>("qpay");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    khoroo: "",
    district: "",
    city: "Улаанбаатар",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qpayInvoice, setQpayInvoice] = useState<QpayInvoice | null>(null);
  const [qpayLoading, setQpayLoading] = useState(false);
  const [qpayError, setQpayError] = useState<string | null>(null);
  const [qpayChecking, setQpayChecking] = useState(false);

  // Terms modal state
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const shippingFee = BRAND.deliveryFee;
  const total = Math.max(0, subtotal - discount) + shippingFee;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validateDelivery = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Нэрээ оруулна уу.";
    if (!isValidEmail(form.email)) e.email = "И-мэйл буруу байна.";
    if (!isValidMnPhone(form.phone)) e.phone = "8 оронтой утасны дугаар (жишээ: 8812XXXX).";
    if (!form.street.trim()) e.street = "Гудамж/байр оруулна уу.";
    if (!form.district.trim()) e.district = "Дүүрэг оруулна уу.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const initiateQpay = async () => {
    const newOrderId = generateOrderId(Math.floor(1000 + Math.random() * 9000));
    setOrderId(newOrderId);
    setQpayLoading(true);
    setQpayError(null);
    try {
      const address = `${form.street}, ${form.khoroo ? form.khoroo + ", " : ""}${form.district}, ${form.city}`;
      const res = await fetch("/api/qpay/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: newOrderId,
          amount: total,
          description: `Chicago Outlet захиалга ${newOrderId}`,
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            address,
          },
          items: items.map((i) => ({
            productId: i.productId,
            productName: i.name,
            sku: i.sku,
            size: i.size,
            color: i.color,
            qty: i.qty,
            unitPrice: i.unitPrice,
            image: i.image,
          })),
          subtotal,
          shippingFee,
          discountAmount: discount,
          couponCode: null,
          shippingMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQpayError(data.error ?? "QPay invoice үүсэх үед алдаа гарлаа.");
        setQpayLoading(false);
        return;
      }
      setQpayInvoice(data as QpayInvoice);
    } catch {
      setQpayError("Сүлжээний алдаа.");
    }
    setQpayLoading(false);
  };

  const next = async () => {
    if (step === 0 && !validateDelivery()) return;
    if (step === 2) {
      if (payment === "qpay") {
        if (!termsAgreed) {
          setTermsOpen(true);
          return;
        }
        await initiateQpay();
        return;
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0 });
  };

  // Poll qPay every 3s while waiting for payment.
  useEffect(() => {
    if (!qpayInvoice) return;
    let cancelled = false;
    const id = setInterval(async () => {
      if (cancelled) return;
      setQpayChecking(true);
      try {
        const res = await fetch(`/api/qpay/check?invoice_id=${encodeURIComponent(qpayInvoice.invoice_id)}`);
        const data = await res.json();
        if (data.paid) {
          clearInterval(id);
          clear();
          setStep(3);
          setQpayInvoice(null);
          window.scrollTo({ top: 0 });
        }
      } catch {
        // swallow; will retry
      } finally {
        if (!cancelled) setQpayChecking(false);
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [qpayInvoice, clear]);

  if (items.length === 0 && step < 3) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-28 text-center">
        <h1 className="font-serif text-2xl font-bold">Сагс хоосон байна</h1>
        <Link href="/shop" className="rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-white">
          Дэлгүүр үзэх
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      {/* Terms modal */}
      {termsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setTermsOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-surface p-8 shadow-2xl">
            <button
              onClick={() => setTermsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted transition hover:bg-background"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
            <h2 className="font-serif text-xl font-bold">Үйлчилгээний нөхцөл</h2>
            <div className="mt-5 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {TERMS.map((t) => (
                <div key={t.title}>
                  <p className="text-sm font-semibold">{t.title}</p>
                  <p className="mt-1 text-sm text-muted leading-relaxed">{t.body}</p>
                </div>
              ))}
            </div>
            <label className="mt-6 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-foreground"
              />
              <span className="text-sm">Дээрх нөхцөлүүдтэй танилцаж, зөвшөөрч байна.</span>
            </label>
            <button
              disabled={!termsAgreed}
              onClick={async () => {
                setTermsOpen(false);
                await initiateQpay();
              }}
              className="mt-4 w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-40"
            >
              QPay-р төлөх
            </button>
          </div>
        </div>
      )}

      {/* Steps */}
      <ol className="mx-auto mb-10 flex max-w-2xl items-center justify-between">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <span
                className={classNames(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  i <= step ? "bg-foreground text-white" : "bg-border text-muted"
                )}
              >
                {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
              </span>
              <span className="mt-1 text-[11px]">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={classNames("mx-2 h-0.5 flex-1", i < step ? "bg-foreground" : "bg-border")} />
            )}
          </li>
        ))}
      </ol>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold">Холбоо барих & Хүргэлт</h2>
              <Field label="Бүтэн нэр" error={errors.name}>
                <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="И-мэйл" error={errors.email}>
                  <input className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field label="Утас (8 орон)" error={errors.phone}>
                  <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
              </div>
              <Field label="Гудамж / Байр / Тоот" error={errors.street}>
                <input className="input" value={form.street} onChange={(e) => set("street", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Хороо">
                  <input className="input" value={form.khoroo} onChange={(e) => set("khoroo", e.target.value)} />
                </Field>
                <Field label="Дүүрэг" error={errors.district}>
                  <input className="input" value={form.district} onChange={(e) => set("district", e.target.value)} />
                </Field>
                <Field label="Хот">
                  <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-4 font-serif text-xl font-bold">Захиалга шалгах</h2>
              <div className="rounded-lg border bg-surface p-4 text-sm">
                <p className="font-semibold">{form.name}</p>
                <p className="text-muted">{form.phone} · {form.email}</p>
                <p className="text-muted">
                  {form.city}, {form.district}, {form.khoroo && `${form.khoroo}, `}{form.street}
                </p>
              </div>
              <ul className="mt-4 divide-y border-y">
                {items.map((i) => (
                  <li key={`${i.productId}-${i.size}-${i.color}`} className="flex justify-between py-3 text-sm">
                    <span>{i.name} · {i.color}/{i.size} × {i.qty}</span>
                    <span className="font-medium">{formatMNT(i.unitPrice * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setStep(0)} className="mt-3 text-sm text-accent-dark underline">
                Засах
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-4 font-serif text-xl font-bold">Төлбөр — QPay</h2>
              <p className="mb-4 text-sm text-muted">Банкны аппликейшнээр QR уншуулж төлнө үү.</p>

              {qpayInvoice && (
                <div className="mt-4 rounded-xl border bg-background p-6 text-center">
                  <p className="text-sm font-semibold">QPay QR код</p>
                  <p className="mt-1 text-xs text-muted">Банкны аппликейшнээр уншуулж төлбөрөө төлнө үү.</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qpayInvoice.qr_image.startsWith("data:") ? qpayInvoice.qr_image : `data:image/png;base64,${qpayInvoice.qr_image}`}
                    alt="QPay QR"
                    className="mx-auto mt-3 h-56 w-56 rounded-md border bg-white p-2"
                  />
                  {qpayInvoice.qPay_shortUrl && (
                    <a
                      href={qpayInvoice.qPay_shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block rounded-md border px-4 py-2 text-xs font-semibold"
                    >
                      QPay хуудасанд нээх
                    </a>
                  )}
                  {qpayInvoice.urls && qpayInvoice.urls.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs text-muted">Банкны аппликейшнээр нэвтрэх</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {qpayInvoice.urls.map((u) => (
                          <a
                            key={u.link}
                            href={u.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-col items-center gap-1 rounded-xl border bg-white p-2 transition hover:shadow-md"
                            style={{ minWidth: 72 }}
                          >
                            {u.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.logo} alt={u.name} className="h-10 w-10 rounded-lg object-contain" />
                            ) : (
                              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500">{u.name.slice(0, 2)}</span>
                            )}
                            <span className="text-[10px] font-medium text-gray-700">{u.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-4 text-xs text-muted">
                    {qpayChecking ? "Төлбөр шалгаж байна…" : "Төлбөрийг хүлээж байна…"}
                  </p>
                </div>
              )}

              {qpayError && (
                <p className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{qpayError}</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-6 py-14 text-center">
              {/* Elegant animated checkmark ring */}
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="absolute inset-0" viewBox="0 0 96 96" fill="none">
                  <circle
                    cx="48" cy="48" r="44"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-border"
                  />
                  <circle
                    cx="48" cy="48" r="44"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="276"
                    strokeDashoffset="0"
                    className="animate-[spin_0s] text-foreground"
                    style={{
                      strokeDashoffset: 0,
                      animation: "drawCircle 0.8s ease-out forwards",
                    }}
                  />
                </svg>
                <CheckIcon className="h-10 w-10 text-foreground" />
              </div>
              <div style={{ animation: "fadeIn 0.5s 0.5s ease-out both", opacity: 0 }}>
                <h2 className="font-serif text-3xl font-bold tracking-tight">Захиалга баталгаажлаа</h2>
                <p className="mt-2 text-sm text-muted">Захиалгын дугаар</p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-widest">{orderId}</p>
                <p className="mt-4 max-w-sm text-sm text-muted leading-relaxed">
                  {form.email} хаягт баталгаажуулах мэдэгдэл илгээгдлээ. Бид удахгүй тантай холбогдоно.
                </p>
              </div>
              <div className="flex gap-3" style={{ animation: "fadeIn 0.5s 0.9s ease-out both", opacity: 0 }}>
                <Link href="/account" className="rounded-full border border-foreground px-6 py-2.5 text-sm font-semibold transition hover:bg-foreground hover:text-white">
                  Захиалга хянах
                </Link>
                <Link href="/shop" className="rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark">
                  Дэлгүүр үзэх
                </Link>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="mt-8 flex justify-between">
              {step > 0 ? (
                <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1.5 rounded-md border px-6 py-3 text-sm font-semibold">
                  <ArrowLeftIcon className="h-4 w-4" /> Буцах
                </button>
              ) : (
                <Link href="/cart" className="flex items-center gap-1.5 rounded-md border px-6 py-3 text-sm font-semibold">
                  <ArrowLeftIcon className="h-4 w-4" /> Сагс
                </Link>
              )}
              <button
                onClick={next}
                disabled={qpayLoading || (payment === "qpay" && qpayInvoice !== null)}
                className="rounded-md bg-foreground px-8 py-3 text-sm font-semibold text-white hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                {step === 2
                  ? qpayLoading
                    ? "QR бэлдэж байна…"
                    : qpayInvoice
                    ? "Төлбөр хүлээж байна…"
                    : "QPay-р төлөх"
                  : "Үргэлжлүүлэх"}
              </button>
            </div>
          )}
        </div>

        {/* Order summary */}
        {step < 3 && (
          <div className="h-fit rounded-xl border bg-surface p-6 text-sm">
            <h3 className="font-serif text-lg font-semibold">Захиалга</h3>
            <div className="mt-4 space-y-2">
              <Row label="Дэд дүн" value={formatMNT(subtotal)} />
              {discount > 0 && <Row label="Хямдрал" value={`-${formatMNT(discount)}`} />}
              <Row label="Хүргэлт" value={formatMNT(shippingFee)} />
              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <span>Нийт</span>
                <span>{formatMNT(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes drawCircle {
          from { stroke-dashoffset: 276; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        :global(.input) {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--border);
          background: var(--surface);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) {
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
