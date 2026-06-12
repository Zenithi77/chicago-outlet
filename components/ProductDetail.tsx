"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { finalPrice, savings, formatMNT, classNames } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { ProductImage } from "@/components/ProductImage";
import { Badge } from "@/components/Badge";
import { StarIcon, HeartIcon, RefreshIcon, TruckIcon } from "@/components/Icons";

const TABS = ["Ð¢Ð°Ð¹Ð»Ð±Ð°Ñ€", "Ð¥ÑÐ¼Ð¶ÑÑÐ½Ð¸Ð¹ Ð·Ð°Ð°Ð²Ð°Ñ€", "ÐœÐ°Ñ‚ÐµÑ€Ð¸Ð°Ð» & ÐÑ€Ñ‡Ð¸Ð»Ð³Ð°Ð°", "Ð¥Ò¯Ñ€Ð³ÑÐ»Ñ‚ & Ð‘ÑƒÑ†Ð°Ð°Ð»Ñ‚"];

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
      setError("Ð¥ÑÐ¼Ð¶ÑÑÐ³ÑÑ ÑÐ¾Ð½Ð³Ð¾Ð½Ð¾ ÑƒÑƒ.");
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
          <Link href="/" className="hover:text-foreground">ÐÒ¯Ò¯Ñ€</Link> /{" "}
          <Link href="/shop" className="hover:text-foreground">Ð”ÑÐ»Ð³Ò¯Ò¯Ñ€</Link> /{" "}
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-foreground">
            {product.category}
          </Link>{" "}
          / <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="lg:container-page lg:grid lg:gap-10 lg:grid-cols-2 lg:pb-16">
        {/* Gallery â€” full bleed on mobile, normal on desktop */}
        <div>
          <div className="flex gap-2 lg:gap-3">
            {/* Thumbnails â€” desktop only */}
            <div className="hidden flex-col gap-2 lg:flex">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImgIdx(i)}
                  className={classNames(
                    "h-16 w-14 overflow-hidden rounded-md border-2 shrink-0",
                    i === imgIdx ? "border-accent" : "border-transparent"
                  )}
                >
                  <ProductImage seed={img} label={product.name} className="h-full w-full" />
                </button>
              ))}
            </div>
            {/* Main image */}
            <div className="relative w-full overflow-hidden lg:rounded-xl">
              <ProductImage
                seed={product.images[imgIdx] ?? product.slug}
                label={product.name}
                className="aspect-square w-full lg:aspect-[4/5]"
              />
              {/* Mobile swipe dots */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 lg:hidden">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={classNames(
                        "h-1.5 rounded-full transition-all",
                        i === imgIdx ? "w-5 bg-accent" : "w-1.5 bg-white/60"
                      )}
                    />
                  ))}
                </div>
              )}
              <div className="absolute left-3 top-3 flex gap-1">
                {product.isNewArrival && <Badge variant="new">New</Badge>}
                {product.isOnSale && <Badge variant="sale">-{product.discountPercent}%</Badge>}
              </div>
            </div>
          </div>
          {/* Mobile thumbnail row */}
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
        </div>

        {/* Info */}
        <div className="px-4 pb-10 pt-4 lg:px-0 lg:pt-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent-dark">
            <span>{product.brand}</span>
            {product.collection && <><span className="text-muted">Â·</span><span className="text-muted">{product.collection}</span></>}
          </div>
          <h1 className="mt-1.5 font-serif text-xl font-bold leading-snug md:text-2xl lg:text-3xl">{product.name}</h1>
          <p className="mt-1 text-xs text-muted">SKU: {product.id}</p>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-accent-dark">
              <StarIcon className="h-4 w-4" /> {product.rating.toFixed(1)}
            </span>
            <span className="text-muted">({product.reviewCount} ÑÑÑ‚Ð³ÑÐ³Ð´ÑÐ»)</span>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold">{formatMNT(fp)}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-base text-muted line-through">{formatMNT(product.price)}</span>
                <span className="text-sm font-semibold text-danger">-{product.discountPercent}%</span>
              </>
            )}
          </div>

          {/* Colors */}
          {hasColors && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">
                Ó¨Ð½Ð³Ó©: <span className="text-muted">{color.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
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
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Ð¥ÑÐ¼Ð¶ÑÑ</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSize(s); setError(""); }}
                    className={classNames(
                      "min-w-[44px] rounded-md border px-3 py-2.5 text-sm font-medium transition",
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
              <span className="font-semibold text-danger">Ð”ÑƒÑƒÑÑÐ°Ð½</span>
            ) : product.totalStock <= 5 ? (
              <span className="font-semibold text-danger">Ð—Ó©Ð²Ñ…Ó©Ð½ {product.totalStock} ÑˆÐ¸Ñ€Ñ…ÑÐ³ Ò¯Ð»Ð´ÑÑÐ½!</span>
            ) : (
              <span className="font-semibold text-success">Ð‘ÑÐ»ÑÐ½ Ð±Ð°Ð¹Ð³Ð°Ð°</span>
            )}
          </p>

          {/* Qty + CTA */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3 text-lg">âˆ’</button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(10, product.totalStock, q + 1))} className="px-4 py-3 text-lg">+</button>
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
              Ð¡Ð°Ð³ÑÐ°Ð½Ð´ Ð½ÑÐ¼ÑÑ…
            </button>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => add(true)}
              disabled={soldOut}
              className="flex-1 rounded-md border border-accent bg-accent py-3.5 text-sm font-semibold text-foreground hover:bg-accent-dark hover:text-white disabled:opacity-50"
            >
              Ð¨ÑƒÑƒÐ´ Ð°Ð²Ð°Ñ…
            </button>
            <button className="flex items-center rounded-md border px-4 hover:border-foreground" aria-label="Ð¥Ð°Ð´Ð³Ð°Ð»Ð°Ñ…">
              <HeartIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 space-y-2 border-t pt-4 text-sm text-muted">
            <p className="flex items-center gap-2">
              <RefreshIcon className="h-4 w-4 shrink-0" /> 14 Ñ…Ð¾Ð½Ð¾Ð³Ð¸Ð¹Ð½ Ð´Ð¾Ñ‚Ð¾Ñ€ ÑÐ¾Ð»Ð¸ÑƒÐ»Ð°Ñ… Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ñ‚Ð¾Ð¹
            </p>
            <p className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4 shrink-0" /> Ð¥Ò¯Ñ€Ð³ÑÐ»Ñ‚ â‚®10,000 (1â€“3 Ð°Ð¶Ð»Ñ‹Ð½ Ó©Ð´Ó©Ñ€)
            </p>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <div className="flex gap-0 overflow-x-auto border-b text-sm no-scrollbar">
              {TABS.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setTab(i)}
                  className={classNames(
                    "whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors",
                    tab === i ? "border-b-2 border-foreground text-foreground" : "text-muted"
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
                  <p className="mb-2">Ð‘Ð¾Ð»Ð¾Ð¼Ð¶Ð¸Ñ‚ Ñ…ÑÐ¼Ð¶ÑÑ: {product.sizes.join(", ")}</p>
                  <p>Ð¢Ð°Ð½ÑŒ Ð´ÑƒÐ½Ð´ Ñ…ÑÐ¼Ð¶ÑÑÑ‚ÑÐ¹ (regular fit) Ð·Ð°Ð³Ð²Ð°Ñ€. Ð¥ÑÑ€ÑÐ² Ñ‚Ð° Ñ‡Ó©Ð»Ó©Ó©Ñ‚ÑÐ¹ Ó©Ð¼ÑÓ©Ñ…Ð¸Ð¹Ð³ Ñ…Ò¯ÑÐ²ÑÐ» Ð½ÑÐ³ Ñ…ÑÐ¼Ð¶ÑÑ Ñ‚Ð¾Ð¼Ñ‹Ð³ ÑÐ¾Ð½Ð³Ð¾Ð¾Ñ€Ð¾Ð¹.</p>
                </div>
              )}
              {tab === 2 && (
                <div className="space-y-1">
                  <p><b>ÐœÐ°Ñ‚ÐµÑ€Ð¸Ð°Ð»:</b> {product.material}</p>
                  <p><b>Ð—Ð°Ð³Ð²Ð°Ñ€:</b> {product.fit}</p>
                  <p><b>ÐÑ€Ñ‡Ð¸Ð»Ð³Ð°Ð°:</b> {product.careInstructions}</p>
                </div>
              )}
              {tab === 3 && (
                <div className="space-y-1">
                  <p>Ð¥Ò¯Ñ€Ð³ÑÐ»Ñ‚: 1â€“3 Ð°Ð¶Ð»Ñ‹Ð½ Ó©Ð´Ó©Ñ€ (â‚®10,000).</p>
                  <p>14 Ñ…Ð¾Ð½Ð¾Ð³Ð¸Ð¹Ð½ Ð´Ð¾Ñ‚Ð¾Ñ€ Ð°ÑÑƒÑƒÐ´Ð°Ð»Ð³Ò¯Ð¹ ÑÐ¾Ð»Ð¸ÑƒÐ»Ð°Ð»Ñ‚.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
