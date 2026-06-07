"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { finalPrice, savings, formatMNT, classNames } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { ProductImage } from "@/components/ProductImage";
import { Badge } from "@/components/Badge";
import { StarIcon, HeartIcon, RefreshIcon, TruckIcon } from "@/components/Icons";

const TABS = ["Тайлбар", "Хэмжээний заавар", "Материал & Арчилгаа", "Хүргэлт & Буцаалт"];

export function ProductDetail({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null
  );
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");

  const fp = finalPrice(product);
  const save = savings(product);
  const color = product.colors[colorIdx];
  const soldOut = product.totalStock <= 0;

  const add = (buyNow = false) => {
    if (!size) {
      setError("Хэмжээгээ сонгоно уу.");
      return;
    }
    setError("");
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.id,
      size,
      color: color.name,
      colorHex: color.hex,
      qty,
      unitPrice: fp,
      image: product.images[0] ?? product.slug,
      maxStock: product.totalStock,
    });
    if (buyNow) {
      window.location.href = "/checkout";
    }
  };

  return (
    <div className="container-page py-8">
      <nav className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">Нүүр</Link> /{" "}
        <Link href="/shop" className="hover:text-foreground">Дэлгүүр</Link> /{" "}
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-foreground">
          {product.category}
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-2">
            {product.images.map((img, i) => (
              <button
                key={img}
                onClick={() => setImgIdx(i)}
                className={classNames(
                  "h-16 w-14 overflow-hidden rounded-md border-2",
                  i === imgIdx ? "border-accent" : "border-transparent"
                )}
              >
                <ProductImage seed={img} label={product.name} className="h-full w-full" />
              </button>
            ))}
          </div>
          <div className="relative flex-1 overflow-hidden rounded-xl">
            <ProductImage
              seed={product.images[imgIdx] ?? product.slug}
              label={product.name}
              className="aspect-[4/5] w-full"
            />
            <div className="absolute left-3 top-3 flex gap-1">
              {product.isNewArrival && <Badge variant="new">New</Badge>}
              {product.isOnSale && <Badge variant="sale">-{product.discountPercent}%</Badge>}
            </div>
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent-dark">
            <span>{product.brand}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{product.collection}</span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-xs text-muted">SKU: {product.id}</p>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-accent-dark">
              <StarIcon className="h-4 w-4" /> {product.rating.toFixed(1)}
            </span>
            <span className="text-muted">({product.reviewCount} сэтгэгдэл)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold">{formatMNT(fp)}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-lg text-muted line-through">{formatMNT(product.price)}</span>
                <span className="text-sm font-semibold text-danger">
                  -{formatMNT(save)} хэмнэлт
                </span>
              </>
            )}
          </div>

          {/* Colors */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">
              Өнгө: <span className="text-muted">{color.name}</span>
            </p>
            <div className="flex gap-2">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setColorIdx(i)}
                  title={c.name}
                  className={classNames(
                    "h-9 w-9 rounded-full border ring-offset-2 transition",
                    i === colorIdx ? "ring-2 ring-accent" : ""
                  )}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Хэмжээ</p>
              <button onClick={() => setTab(1)} className="text-xs text-accent-dark underline">
                Хэмжээний заавар
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSize(s); setError(""); }}
                  className={classNames(
                    "min-w-11 rounded-md border px-3 py-2 text-sm font-medium transition",
                    size === s
                      ? "border-foreground bg-foreground text-white"
                      : "bg-surface hover:border-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          </div>

          {/* Stock */}
          <p className="mt-4 text-sm">
            {soldOut ? (
              <span className="font-semibold text-danger">Дууссан</span>
            ) : product.totalStock <= 5 ? (
              <span className="font-semibold text-danger">
                Зөвхөн {product.totalStock} ширхэг үлдсэн!
              </span>
            ) : (
              <span className="font-semibold text-success">Бэлэн байгаа</span>
            )}
          </p>

          {/* Qty + actions */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2.5">−</button>
              <span className="w-8 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(10, product.totalStock, q + 1))}
                className="px-3 py-2.5"
              >
                +
              </button>
            </div>
            <button
              onClick={() => add(false)}
              disabled={soldOut}
              className={classNames(
                "flex-1 rounded-md py-3 text-sm font-semibold uppercase tracking-wider transition",
                soldOut
                  ? "cursor-not-allowed bg-border text-muted"
                  : "bg-foreground text-white hover:bg-accent hover:text-foreground"
              )}
            >
              Сагсанд нэмэх
            </button>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => add(true)}
              disabled={soldOut}
              className="flex-1 rounded-md border border-accent bg-accent py-3 text-sm font-semibold text-foreground hover:bg-accent-dark hover:text-white disabled:opacity-50"
            >
              Шууд авах
            </button>
            <button className="flex items-center rounded-md border px-4 hover:border-foreground" aria-label="Хадгалах">
              <HeartIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 space-y-1.5 border-t pt-4 text-sm text-muted">
            <p className="flex items-center gap-2">
              <RefreshIcon className="h-4 w-4 shrink-0" /> 14 хоногийн үнэгүй буцаалт
            </p>
            <p className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4 shrink-0" /> ₮150,000+ захиалгад үнэгүй хүргэлт (1–3 хоног)
            </p>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <div className="flex gap-1 overflow-x-auto border-b text-sm no-scrollbar">
              {TABS.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setTab(i)}
                  className={classNames(
                    "whitespace-nowrap px-3 py-2 font-medium",
                    tab === i ? "border-b-2 border-foreground" : "text-muted"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="py-4 text-sm leading-relaxed text-foreground/80">
              {tab === 0 && <p>{product.description}</p>}
              {tab === 1 && (
                <div>
                  <p className="mb-2">Боломжит хэмжээ: {product.sizes.join(", ")}</p>
                  <p>
                    Тань дунд хэмжээтэй (regular fit) загвар. Хэрэв та чөлөөтэй өмсөхийг хүсвэл нэг
                    хэмжээ томыг сонгоорой.
                  </p>
                </div>
              )}
              {tab === 2 && (
                <div className="space-y-1">
                  <p><b>Материал:</b> {product.material}</p>
                  <p><b>Загвар:</b> {product.fit}</p>
                  <p><b>Арчилгаа:</b> {product.careInstructions}</p>
                </div>
              )}
              {tab === 3 && (
                <div className="space-y-1">
                  <p>Стандарт хүргэлт: 1–3 ажлын өдөр (₮150,000+ үнэгүй).</p>
                  <p>Шуурхай хүргэлт: 1 өдөр (+₮8,000).</p>
                  <p>14 хоногийн дотор асуудалгүй буцаалт.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
