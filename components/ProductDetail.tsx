"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatMNT, classNames } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { ProductImage } from "@/components/ProductImage";
import { Badge } from "@/components/Badge";
import { HeartIcon } from "@/components/Icons";

const TABS = ["Тайлбар", "Хэмжээний заавар", "Материал & Арчилгаа"];

export function ProductDetail({ product, isLoggedIn = false }: { product: Product; isLoggedIn?: boolean }) {
  const addItem = useCart((s) => s.addItem);
  const cartOpen = useCart((s) => s.isOpen);
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null
  );
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Per-size stock lookup
  const hasSizeStocks = product.sizeStocks && product.sizeStocks.length > 0;
  const getSizeStock = (s: string) => {
    if (!hasSizeStocks) return product.totalStock;
    return product.sizeStocks.find((ss) => ss.size === s)?.stock ?? 0;
  };

  // Uniform price (no per-size pricing)
  const fp = product.discountPercent > 0
    ? Math.round(product.price * (1 - product.discountPercent / 100))
    : product.price;
  const save = product.price - fp;
  const hasColors = product.colors.length > 0;
  const hasSizes = product.sizes.length > 0;
  const color = hasColors
    ? product.colors[colorIdx] ?? product.colors[0]
    : { name: "", hex: "#000000" };

  // Sold out: if size selected + sizeStocks exist, check per-size; else check total
  const selectedSizeStock = size ? getSizeStock(size) : null;
  const soldOut = hasSizeStocks
    ? (selectedSizeStock !== null ? selectedSizeStock <= 0 : product.totalStock <= 0)
    : product.totalStock <= 0;

  const add = (buyNow = false) => {
    if (hasSizes && !size) {
      setError("Хэмжээгээ сонгоно уу.");
      return;
    }
    const effectiveStock = size ? getSizeStock(size) : product.totalStock;
    if (effectiveStock <= 0) {
      setError("Энэ хэмжээ дууссан байна.");
      return;
    }
    if (buyNow && !isLoggedIn) {
      setError("auth");
      return;
    }
    setError("");
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.id,
      branch: product.branch,
      isOnline: product.isOnline,
      size: size ?? "",
      color: color.name,
      colorHex: color.hex,
      qty,
      unitPrice: fp,
      image: product.images[0] ?? product.slug,
      maxStock: effectiveStock,
    });
    if (buyNow) {
      window.location.href = "/checkout";
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-4 py-3 lg:mx-auto lg:max-w-5xl lg:px-6">
        <nav className="text-xs text-muted">
          <Link href="/" className="hover:text-foreground">Нүүр</Link> /{" "}
          <Link href="/shop" className="hover:text-foreground">Дэлгүүр</Link> /{" "}
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-foreground">
            {product.category}
          </Link>{" "}
          / <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="lg:mx-auto lg:grid lg:max-w-5xl lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12 lg:px-6 lg:pb-16 lg:pt-2">
        {/* Gallery */}
        <div>
          <div className="lg:flex lg:gap-3">
            {/* Desktop vertical thumbnails — Nike-style left rail */}
            {product.images.length > 1 && (
              <div className="hidden max-h-[475px] flex-col gap-2 overflow-y-auto no-scrollbar lg:flex">
                {product.images.slice(0, 8).map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setImgIdx(i)}
                    onMouseEnter={() => setImgIdx(i)}
                    className={classNames(
                      "h-[52px] w-[44px] shrink-0 overflow-hidden rounded-md border transition",
                      i === imgIdx ? "border-foreground" : "border-border/50 hover:border-foreground/50"
                    )}
                  >
                    <ProductImage seed={img} label={product.name} className="h-full w-full" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="relative w-full overflow-hidden bg-white lg:w-[380px] lg:rounded-xl lg:border lg:border-border/50">
              <ProductImage
                seed={product.images[imgIdx] ?? product.slug}
                label={product.name}
                fit="contain"
                className="aspect-square w-full lg:aspect-[4/5]"
              />
              <div className="absolute left-3 top-3 flex gap-1">
                {product.isNewArrival && <Badge variant="new">New</Badge>}
                {product.isOnSale && <Badge variant="sale">-{product.discountPercent}%</Badge>}
              </div>
            </div>
          </div>

          {/* Mobile thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar lg:hidden">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setImgIdx(i)}
                  className={classNames(
                    "h-16 w-14 shrink-0 overflow-hidden rounded-md border-2",
                    i === imgIdx ? "border-foreground" : "border-border"
                  )}
                >
                  <ProductImage seed={img} label={product.name} className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pb-10 pt-5 lg:px-0 lg:pt-2 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-accent-dark">
            <span className="font-semibold">{product.brand}</span>
            {product.collection && (
              <>
                <span className="text-muted">·</span>
                <span className="text-muted">{product.collection}</span>
              </>
            )}
          </div>
          <h1 className="mt-1.5 text-xl font-semibold leading-snug md:text-2xl">{product.name}</h1>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">SKU: {product.id}</p>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xl font-bold lg:text-2xl">{formatMNT(fp)}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-base text-muted line-through">{formatMNT(product.price)}</span>
                <span className="rounded-md bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                  -{formatMNT(save)} хэмнэлт
                </span>
              </>
            )}
          </div>

          {/* Colors */}
          {hasColors && (
          <div className="mt-6">
            <p className="mb-2.5 text-sm font-medium">
              Өнгө: <span className="text-muted">{color.name}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c, i) => (
                <button
                  key={`${c.name}-${i}`}
                  onClick={() => setColorIdx(i)}
                  title={c.name}
                  className={classNames(
                    "h-9 w-9 rounded-full border border-border ring-offset-2 transition hover:scale-105",
                    i === colorIdx ? "ring-2 ring-foreground" : ""
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
            <div className="mb-2.5">
              <p className="text-sm font-medium">Хэмжээ</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const sStock = getSizeStock(s);
                const isSoldOut = hasSizeStocks && sStock <= 0;
                return (
                  <button
                    key={s}
                    onClick={() => { if (!isSoldOut) { setSize(s); setError(""); } }}
                    disabled={isSoldOut}
                    className={classNames(
                      "relative flex h-12 min-w-[3rem] flex-col items-center justify-center rounded-md border px-3 text-sm font-semibold transition",
                      isSoldOut
                        ? "cursor-not-allowed border-border bg-border/30 text-muted line-through"
                        : size === s
                        ? "border-foreground bg-foreground text-white"
                        : "border-border bg-surface hover:border-foreground"
                    )}
                  >
                    <span>{s}</span>
                    {isSoldOut && (
                      <span className="text-[9px] font-normal leading-none text-danger/70">Дууссан</span>
                    )}
                  </button>
                );
              })}
            </div>
            {error && error !== "auth" && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
          </div>
          )}

          {/* Stock */}
          <p className="mt-4 text-sm">
            {soldOut ? (
              <span className="font-semibold text-danger">
                {size && hasSizeStocks ? `${size} хэмжээ дууссан` : "Дууссан"}
              </span>
            ) : selectedSizeStock !== null && selectedSizeStock <= 5 ? (
              <span className="font-semibold text-danger">
                {size} хэмжээнд зөвхөн {selectedSizeStock} ширхэг үлдсэн!
              </span>
            ) : product.totalStock <= 5 && !hasSizeStocks ? (
              <span className="font-semibold text-danger">
                Зөвхөн {product.totalStock} ширхэг үлдсэн!
              </span>
            ) : (
              <span className="font-semibold text-success">Бэлэн байгаа</span>
            )}
          </p>

          {/* Online order terms notice */}
          {product.isOnline && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
              <p className="mb-2 font-semibold text-sm">📦 Захиалгын барааны үйлчилгээний нөхцөл</p>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">1. Тээвэрлэлтийн хугацаа</p>
                  <p className="mt-0.5">Агаарын тээвэр: ажлын <strong>7–14 хоног</strong></p>
                  <p>Газрын тээвэр: ажлын <strong>45–60 хоног</strong></p>
                  <p className="mt-0.5 text-amber-700">(Гааль, давагдашгүй хүчин зүйлээс шалтгаалж өөрчлөгдөж болно.)</p>
                </div>
                <div>
                  <p className="font-semibold">2. Тээврийн зардал (Карго)</p>
                  <p className="mt-0.5">Бараа Монголд ирэх үед хүлээн авагч хариуцан төлнө.</p>
                  <p>Агаарын: <strong>1 кг → 10$</strong> · Газрын: хэмжээгээр тусгай тариф</p>
                </div>
                <div>
                  <p className="font-semibold">3. Буцаалт & Солилцоо</p>
                  <p className="mt-0.5"><span className="font-medium text-red-700">Буцаалт хийх боломжгүй.</span></p>
                  <p>Размер/өнгө зөрүүтэй бол хүлээн авснаас хойш <strong>7 хоногийн дотор</strong> салбарт биечлэн ирж солих боломжтой.</p>
                </div>
              </div>
            </div>
          )}

          {/* Qty + actions — desktop only */}
          <div className="mt-6 hidden lg:block">
            <div className="flex items-stretch gap-3">
              <div className="flex items-center rounded-lg border bg-surface">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 text-lg font-medium hover:bg-background"
                  aria-label="Хасах"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(10, Math.max(1, selectedSizeStock ?? product.totalStock), q + 1))}
                  className="px-4 py-3 text-lg font-medium hover:bg-background"
                  aria-label="Нэмэх"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => add(false)}
                disabled={soldOut}
                className={classNames(
                  "flex-1 rounded-lg py-3.5 text-sm font-semibold uppercase tracking-wider transition",
                  soldOut
                    ? "cursor-not-allowed bg-border text-muted"
                    : "bg-foreground text-white hover:bg-accent hover:text-foreground"
                )}
              >
                {soldOut ? "Дууссан" : "Сагсанд нэмэх"}
              </button>
              <button
                className="flex items-center rounded-lg border px-4 hover:border-foreground"
                aria-label="Хадгалах"
              >
                <HeartIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => add(true)}
              disabled={soldOut}
              className="mt-3 w-full rounded-lg border border-accent bg-accent py-3 text-sm font-semibold uppercase tracking-wider text-foreground transition hover:bg-accent-dark hover:text-white disabled:opacity-50"
            >
              Шууд авах
            </button>
          </div>

          {/* Auth prompt when not logged in */}
          {error === "auth" && (
            <div className="mt-3 rounded-lg border border-accent/40 bg-accent/5 p-4 text-sm">
              <p className="font-medium">Захиалга өгөхийн тулд нэвтрэнэ үү.</p>
              <div className="mt-3 flex gap-3">
                <Link
                  href={`/account?next=/product/${product.slug}`}
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
                >
                  Нэвтрэх
                </Link>
                <Link
                  href={`/account?next=/product/${product.slug}`}
                  className="rounded-md border px-4 py-2 text-sm font-semibold hover:border-foreground"
                >
                  Бүртгүүлэх
                </Link>
              </div>
            </div>
          )}

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

      {/* Bottom padding so sticky footer doesn't cover content on mobile */}
      <div className="h-20 lg:hidden" />

      {/* Sticky mobile footer — rendered in body via portal to avoid transform/overflow issues */}
      {mounted && !cartOpen && createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur-sm px-4 py-3 lg:hidden">
          {error === "auth" ? (
            <div className="rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
              <p className="font-medium">Захиалга өгөхийн тулд нэвтрэнэ үү.</p>
              <div className="mt-2 flex gap-2">
                <Link
                  href={`/account?next=/product/${product.slug}`}
                  className="flex-1 rounded-lg bg-foreground py-2.5 text-center text-sm font-semibold text-white"
                >
                  Нэвтрэх
                </Link>
                <Link
                  href={`/account?next=/product/${product.slug}`}
                  className="flex-1 rounded-lg border py-2.5 text-center text-sm font-semibold"
                >
                  Бүртгүүлэх
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-stretch gap-2">
              <div className="flex items-center rounded-lg border border-border bg-surface">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2.5 text-lg font-medium leading-none"
                  aria-label="Хасах"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(10, Math.max(1, selectedSizeStock ?? product.totalStock), q + 1))}
                  className="px-3 py-2.5 text-lg font-medium leading-none"
                  aria-label="Нэмэх"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => add(false)}
                disabled={soldOut}
                className={classNames(
                  "flex-1 rounded-lg text-sm font-semibold uppercase tracking-wider transition",
                  soldOut ? "cursor-not-allowed bg-border text-muted" : "bg-foreground text-white"
                )}
              >
                {soldOut ? "Дууссан" : "Сагсанд нэмэх"}
              </button>
            </div>
          )}
          {error && error !== "auth" && <p className="mt-1.5 text-center text-xs text-red-500">{error}</p>}
        </div>,
        document.body
      )}
    </div>
  );
}
