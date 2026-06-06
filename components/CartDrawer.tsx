"use client";

import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { formatMNT, classNames } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { ProductImage } from "./ProductImage";

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQty, removeItem } = useCart();
  const subtotal = useCart((s) => s.subtotal());
  const remaining = BRAND.freeShippingThreshold - subtotal;

  return (
    <>
      <div
        className={classNames(
          "fixed inset-0 z-50 bg-black/40 transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />
      <aside
        className={classNames(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-xl transition-transform",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-serif text-lg font-semibold">
            Сагс ({items.reduce((n, i) => n + i.qty, 0)})
          </h2>
          <button onClick={() => setOpen(false)} aria-label="Хаах" className="text-xl">
            ✕
          </button>
        </div>

        {subtotal > 0 && remaining > 0 && (
          <div className="border-b bg-background px-5 py-2 text-xs">
            Үнэгүй хүргэлт хүртэл{" "}
            <span className="font-semibold text-accent-dark">
              {formatMNT(remaining)}
            </span>{" "}
            үлдлээ.
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted">
              <span className="text-4xl">⛣</span>
              <p>Таны сагс хоосон байна.</p>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="rounded-md bg-foreground px-5 py-2 text-sm font-semibold text-white"
              >
                Дэлгүүр үзэх
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 py-4">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="h-20 w-16 shrink-0 overflow-hidden rounded-md"
                  >
                    <ProductImage seed={item.image} label={item.name} className="h-full w-full" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.productId, item.size, item.color)}
                        className="text-xs text-muted hover:text-danger"
                        aria-label="Устгах"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.color} · Хэмжээ {item.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-md border">
                        <button
                          onClick={() => updateQty(item.productId, item.size, item.color, item.qty - 1)}
                          className="px-2 py-1 text-sm"
                          aria-label="Хасах"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.productId, item.size, item.color, item.qty + 1)}
                          className="px-2 py-1 text-sm"
                          aria-label="Нэмэх"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatMNT(item.unitPrice * item.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t px-5 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Дэд дүн</span>
              <span className="font-semibold">{formatMNT(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">Хүргэлт, татвар тооцоонд тооцогдоно.</p>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="mt-3 block rounded-md border border-foreground py-2.5 text-center text-sm font-semibold"
            >
              Сагс харах
            </Link>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-md bg-foreground py-2.5 text-center text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
            >
              Захиалга хийх
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
