"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { validateCoupon } from "@/lib/data/orders";
import { formatMNT, classNames } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { ProductImage } from "@/components/ProductImage";
import { BagIcon, ArrowLeftIcon } from "@/components/Icons";

export default function CartPage() {
  const { items, updateQty, removeItem, coupon, discount, applyCoupon, removeCoupon, shippingMethod, setShipping } = useCart();
  const subtotal = useCart((s) => s.subtotal());
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const shippingFee = BRAND.deliveryFee;

  const total = Math.max(0, subtotal - discount) + shippingFee;

  const apply = () => {
    const res = validateCoupon(code, subtotal);
    setMsg({ ok: res.ok, text: res.message });
    if (res.ok) applyCoupon(res.coupon!.code, res.discount);
  };

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-28 text-center">
        <BagIcon className="h-12 w-12 text-muted" />
        <h1 className="font-serif text-2xl font-bold">Таны сагс хоосон байна</h1>
        <p className="text-muted">Цуглуулгаас сонголтоо хийгээрэй.</p>
        <Link href="/shop" className="rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-white">
          Дэлгүүр үзэх
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 font-serif text-3xl font-bold">Сагс</h1>
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y border-y">
            {items.map((item) => (
              <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 py-5">
                <Link href={`/product/${item.slug}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-md">
                  <ProductImage seed={item.image} label={item.name} className="h-full w-full" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between">
                    <Link href={`/product/${item.slug}`} className="font-medium hover:text-accent-dark">
                      {item.name}
                    </Link>
                    <span className="font-semibold">{formatMNT(item.unitPrice * item.qty)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {item.color} · Хэмжээ {item.size}
                  </p>
                  <p className="text-sm text-muted">{formatMNT(item.unitPrice)} / ширхэг</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-md border">
                      <button onClick={() => updateQty(item.productId, item.size, item.color, item.qty - 1)} className="px-3 py-1.5">−</button>
                      <span className="w-8 text-center text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.productId, item.size, item.color, item.qty + 1)} className="px-3 py-1.5">+</button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.size, item.color)}
                      className="text-sm text-muted hover:text-danger"
                    >
                      Устгах
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/shop" className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent-dark underline">
            <ArrowLeftIcon className="h-4 w-4" /> Дэлгүүр үргэлжлүүлэх
          </Link>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-xl border bg-surface p-6">
          <h2 className="font-serif text-lg font-semibold">Захиалгын дүн</h2>

          {/* Coupon */}
          <div className="mt-4">
            <label className="text-sm font-medium">Купон код</label>
            {coupon ? (
              <div className="mt-1 flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm">
                <span className="font-semibold text-success">{coupon}</span>
                <button onClick={() => { removeCoupon(); setMsg(null); setCode(""); }} className="text-muted hover:text-danger">
                  Устгах
                </button>
              </div>
            ) : (
              <div className="mt-1 flex">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="w-full rounded-l-md border border-r-0 bg-background px-3 py-2 text-sm uppercase outline-none"
                />
                <button onClick={apply} className="rounded-r-md bg-foreground px-4 text-sm font-semibold text-white">
                  Хэрэглэх
                </button>
              </div>
            )}
            {msg && (
              <p className={classNames("mt-1 text-xs", msg.ok ? "text-success" : "text-danger")}>
                {msg.text}
              </p>
            )}
          </div>

          {/* Shipping */}
          <div className="mt-5 rounded-lg border bg-background px-3 py-2 text-sm text-muted">
            Хүргэлтийн төлбөр: <span className="font-semibold text-foreground">{formatMNT(BRAND.deliveryFee)}</span> (Улаанбаатар хот дотор)
          </div>

          <div className="mt-5 space-y-2 border-t pt-4 text-sm">
            <Row label="Дэд дүн" value={formatMNT(subtotal)} />
            {discount > 0 && <Row label="Хямдрал" value={`-${formatMNT(discount)}`} accent />}
            <Row label="Хүргэлт" value={shippingFee === 0 ? "Үнэгүй" : formatMNT(shippingFee)} />
            <div className="flex justify-between border-t pt-3 text-base font-bold">
              <span>Нийт</span>
              <span>{formatMNT(total)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-5 block rounded-md bg-foreground py-3 text-center text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
          >
            Захиалга хийх
          </Link>
          <p className="mt-3 text-center text-xs text-muted">Аюулгүй төлбөр · Үнэгүй буцаалт</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={accent ? "font-semibold text-success" : ""}>{value}</span>
    </div>
  );
}
