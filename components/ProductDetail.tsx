"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { finalPrice, savings, formatMNT, classNames } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { ProductImage } from "@/components/ProductImage";
import { Badge } from "@/components/Badge";
import { StarIcon, HeartIcon } from "@/components/Icons";

const TABS = ["Тайлбар", "Хэмжээний заавар", "Материал & Арчилгаа"];

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
  const hasColors = product.colors.length > 0;
  const hasSizes = product.sizes.length > 0;
  const color = hasColors
    ? product.colors[colorIdx] ?? product.colors[0]
    : { name: "", hex: "#000000" };
  const soldOut = product.totalStock <= 0;

  const add = (buyNow = false) => {
    if (hasSizes && !size) {
      setError("Хэмжээгээ сонгоно уу.");
      return;
    }
    setError("");
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.id,
      size: size ?? "",
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
    <div>
      {/* Breadcrumb */}
      <div className="container-page py-3">
        <nav className="text-xs text-muted">
          <Link href="/" className="hover:text-foreground">Нүүр</Link> /{" "}
          <Link href="/shop" className="hover:text-foreground">Дэлгүүр</Link> /{" "}
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-foreground">
            {product.category}
          </Link>{" "}
          / <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="lg:container-page lg:grid lg:gap-10 lg:grid-cols-2 lg:pb-16">
        {/* Gallery */}
        <div>
          {/* Main image — edge-to-edge on mobile */}
          <div className="relative w-full overflow-hidden lg:rounded-xl">
            <ProductImage
              seed={product.images[imgIdx] ?? product.slug}
              label={product.name}
              className="aspect-square w-full lg:aspect-[4/5]"
            />
            <div className="absolute left-3 top-3 flex gap-1">
              {product.isNewArrival && <Badge variant="new">New</Badge>}
              {product.isOnSale && <Badge variant="sale">-{product.discountPercent}%</Badge>}
            </div>
          </div>
          {/* Thumbnail row — horizontal scroll on mobile, hidden on desktop */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar lg:hidden">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImgIdx(i)}
                  className={classNames(
                    "h-16 w-14 shrink-0 overflow-hidden rounded-md border-2",
                    i === imgIdx ? "border-accent" : "border-border"
                  )}
                >
                  <ProductImage seed={img} label={product.name} className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
          {/* Desktop vertical thumbnails */}
          {product.images.length > 1 && (
            <div className="mt-3 hidden gap-2 lg:flex">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImgIdx(i)}
                  className={classNames(
                    "h-16 w-14 shrink-0 overflow-hidden rounded-md border-2",
                    i === imgIdx ? "border-accent" : "border-transparent"
                  )}
                >
                  <ProductImage seed={img} label={product.name} className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pb-10 pt-4 lg:px-0 lg:pt-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent-dark">
            <span>{product.brand}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{product.collection}</span>
          </div>
          <h1 className="mt-1.5 font-serif text-xl font-bold leading-snug md:text-2xl lg:text-3xl">{product.name}</h1>
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
          {hasColors && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">
              Өнгө: <span className="text-muted">{color.name}</span>
            </p>
            <div className="flex gap-2">
              {product.colors.map((c, i) => (
                <button
                  key={`${c.name}-${i}`}
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
          )}

          {/* Sizes */}
          {hasSizes && (
          <div className="mt-6">
            <div className="mb-2">
              <p className="text-sm font-medium">Хэмжээ</p>
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
          )}

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

          {/* Qty + actions — desktop only */}
          <div className="mt-5 hidden flex-col gap-3 sm:flex-row sm:items-center lg:flex">
            <div className="flex items-center rounded-md border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3">−</button>
              <span className="w-10 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(10, product.totalStock, q + 1))}
                className="px-4 py-3"
              >
                +
              </button>
            </div>
            <button
              onClick={() => add(false)}
              disabled={soldOut}
              className={classNames(
                "flex-1 rounded-md py-3.5 text-sm font-semibold uppercase tracking-wider transition",
                soldOut
                  ? "cursor-not-allowed bg-border text-muted"
                  : "bg-foreground text-white hover:bg-accent hover:text-foreground"
              )}
            >
              Сагсанд нэмэх
            </button>
          </div>
          <div className="mt-3 hidden gap-3 lg:flex">
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

            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile footer */}
      <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-surface/95 backdrop-blur-sm px-4 py-3 lg:hidden" style={{position:'fixed',bottom:0,left:0,right:0}}>
        <div className="flex items-center gap-3">
          {/* Qty */}
          <div className="flex items-center rounded-lg border bg-background">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-3 py-2.5 text-lg font-medium leading-none"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(10, product.totalStock, q + 1))}
              className="px-3 py-2.5 text-lg font-medium leading-none"
            >
              +
            </button>
          </div>
          {/* Add to cart */}
          <button
            onClick={() => add(false)}
            disabled={soldOut}
            className={classNames(
              "flex-1 rounded-lg py-3 text-sm font-semibold uppercase tracking-wider transition",
              soldOut
                ? "cursor-not-allowed bg-border text-muted"
                : "bg-foreground text-white"
            )}
          >
            {soldOut ? "Дууссан" : "Сагсанд нэмэх"}
          </button>
          {/* Buy now */}
          <button
            onClick={() => add(true)}
            disabled={soldOut}
            className="rounded-lg border border-accent bg-accent px-4 py-3 text-sm font-semibold text-foreground disabled:opacity-40"
          >
            Авах
          </button>
        </div>
        {error && <p className="mt-1.5 text-center text-xs text-danger">{error}</p>}
      </div>
      {/* Bottom padding so sticky footer doesn't cover content on mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
