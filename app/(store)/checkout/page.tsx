"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { formatMNT, classNames, isValidMnPhone, isValidEmail, generateOrderId } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import type { PaymentMethod } from "@/lib/types";

const STEPS = ["Хүргэлт", "Шалгах", "Төлбөр", "Баталгаажуулалт"];

export default function CheckoutPage() {
  const { items, discount, shippingMethod, clear } = useCart();
  const subtotal = useCart((s) => s.subtotal());
  const [step, setStep] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash_on_delivery");

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

  const codFee = payment === "cash_on_delivery" ? BRAND.codFee : 0;
  const shippingFee = shippingMethod === "express" ? BRAND.expressFee : 0;
  const total = Math.max(0, subtotal - discount) + shippingFee + codFee;

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

  const next = () => {
    if (step === 0 && !validateDelivery()) return;
    if (step === 2) {
      setOrderId(generateOrderId(Math.floor(1000 + Math.random() * 9000)));
      clear();
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0 });
  };

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
                {i < step ? "✓" : i + 1}
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
              <h2 className="mb-4 font-serif text-xl font-bold">Төлбөрийн хэлбэр</h2>
              <div className="space-y-3">
                <PaymentOption
                  active={payment === "cash_on_delivery"}
                  onClick={() => setPayment("cash_on_delivery")}
                  title="Бэлэн мөнгө (хүргэлтээр)"
                  desc={`УБ хотод боломжтой · +${formatMNT(BRAND.codFee)} шимтгэл`}
                />
                <PaymentOption
                  active={payment === "bank_transfer"}
                  onClick={() => setPayment("bank_transfer")}
                  title="Дансаар шилжүүлэх"
                  desc={`${BRAND.bank.name} · ${BRAND.bank.account} · ${BRAND.bank.holder}`}
                />
                <div className="rounded-lg border border-dashed bg-background p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">QPay 🔜 Удахгүй</span>
                    <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-semibold uppercase">Coming Soon</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">QPay дагуу төлбөр удахгүй нэмэгдэх болно.</p>
                  <button disabled className="mt-2 cursor-not-allowed rounded-md border px-3 py-1.5 text-xs text-muted">
                    Бэлэн болоход мэдэгдэх
                  </button>
                </div>
              </div>
              {payment === "bank_transfer" && (
                <div className="mt-4 rounded-lg bg-background p-4 text-sm">
                  <p className="font-semibold">Шилжүүлгийн заавар:</p>
                  <p className="mt-1 text-muted">Банк: {BRAND.bank.name}</p>
                  <p className="text-muted">Данс: {BRAND.bank.account}</p>
                  <p className="text-muted">Хүлээн авагч: {BRAND.bank.holder}</p>
                  <p className="mt-1 text-muted">Гүйлгээний утга дээр захиалгын дугаараа бичнэ үү.</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-3xl text-white">✓</span>
              <h2 className="font-serif text-2xl font-bold">Захиалга баталгаажлаа!</h2>
              <p className="text-muted">Захиалгын дугаар:</p>
              <p className="rounded-md bg-foreground px-4 py-2 font-mono text-lg text-white">{orderId}</p>
              <p className="max-w-md text-sm text-muted">
                Баталгаажуулах и-мэйл таны {form.email || "хаягт"} хаягт илгээгдлээ (симуляц).
                Бид удахгүй тантай холбогдоно.
              </p>
              <div className="mt-2 flex gap-3">
                <Link href="/account" className="rounded-md border border-foreground px-5 py-2.5 text-sm font-semibold">
                  Захиалга хянах
                </Link>
                <Link href="/shop" className="rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-white">
                  Үргэлжлүүлэн дэлгүүр хийх
                </Link>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="mt-8 flex justify-between">
              {step > 0 ? (
                <button onClick={() => setStep((s) => s - 1)} className="rounded-md border px-6 py-3 text-sm font-semibold">
                  ← Буцах
                </button>
              ) : (
                <Link href="/cart" className="rounded-md border px-6 py-3 text-sm font-semibold">
                  ← Сагс
                </Link>
              )}
              <button onClick={next} className="rounded-md bg-foreground px-8 py-3 text-sm font-semibold text-white hover:bg-accent hover:text-foreground">
                {step === 2 ? "Захиалга баталгаажуулах" : "Үргэлжлүүлэх"}
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
              <Row label="Хүргэлт" value={shippingFee === 0 ? "Үнэгүй" : formatMNT(shippingFee)} />
              {codFee > 0 && <Row label="COD шимтгэл" value={formatMNT(codFee)} />}
              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <span>Нийт</span>
                <span>{formatMNT(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
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

function PaymentOption({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "flex w-full items-start gap-3 rounded-lg border p-4 text-left",
        active ? "border-foreground ring-1 ring-foreground" : "hover:border-foreground"
      )}
    >
      <span className={classNames("mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border", active && "border-foreground")}>
        {active && <span className="h-2 w-2 rounded-full bg-foreground" />}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{desc}</span>
      </span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
