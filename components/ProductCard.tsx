"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { finalPrice, formatMNT, classNames } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { ProductImage } from "./ProductImage";
import { Badge } from "./Badge";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const [activeColor, setActiveColor] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const fp = finalPrice(product);
  const soldOut = product.totalStock <= 0;
  const lowStock = product.totalStock > 0 && product.totalStock <= 5;
  const color = product.colors[activeColor];
  const seed = product.images[activeImg] ?? product.slug;

  const quickAdd = () => {
    if (soldOut) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.id,
      size: product.sizes[Math.floor(product.sizes.length / 2)] ?? "M",
      color: color.name,
      colorHex: color.hex,
      qty: 1,
      unitPrice: fp,
      image: product.images[0] ?? product.slug,
      maxStock: product.totalStock,
    });
  };

  return (
    <div className="group flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-lg bg-surface"
        onMouseEnter={() => product.images[1] && setActiveImg(1)}
        onMouseLeave={() => setActiveImg(0)}
      >
        <ProductImage
          seed={seed}
          label={product.name}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isNewArrival && !product.isOnSale && (
            <Badge variant="new">New</Badge>
          )}
          {product.isOnSale && (
            <Badge variant="sale">-{product.discountPercent}%</Badge>
          )}
          {soldOut ? (
            <Badge variant="sold">Дууссан</Badge>
          ) : lowStock ? (
            <Badge variant="low">Цөөн үлдсэн</Badge>
          ) : null}
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-[11px] uppercase tracking-wider text-muted">
          {product.brand}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="mt-0.5 text-sm font-medium leading-snug hover:text-accent-dark"
        >
          {product.name}
        </Link>
        {/* Branch badge */}
        {(product as { branch?: string }).branch && (
          <span className={classNames(
            "mt-1 inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold",
            (product as { branch?: string }).branch === "park_od"
              ? "bg-blue-50 text-blue-600"
              : (product as { branch?: string }).branch === "riveria"
              ? "bg-purple-50 text-purple-600"
              : "bg-amber-50 text-amber-600"
          )}>
            {(product as { branch?: string }).branch === "park_od"
              ? "Park-Od"
              : (product as { branch?: string }).branch === "riveria"
              ? "Riveria"
              : "Захиалга"}
          </span>
        )}
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold">{formatMNT(fp)}</span>
          {product.discountPercent > 0 && (
            <span className="text-xs text-muted line-through">
              {formatMNT(product.price)}
            </span>
          )}
        </div>

        {/* Color swatches — fixed row to keep cards aligned */}
        <div className="mt-2 flex min-h-[1rem] items-center gap-1.5">
          {product.colors.slice(0, 5).map((c, i) => (
            <button
              key={`${c.name}-${i}`}
              type="button"
              title={c.name}
              onClick={() => setActiveColor(i)}
              className={classNames(
                "h-4 w-4 rounded-full border ring-offset-1 transition",
                i === activeColor ? "ring-2 ring-accent" : "ring-0"
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={c.name}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut}
          className={classNames(
            "mt-auto w-full rounded-md py-2 text-xs font-semibold uppercase tracking-wider transition",
            soldOut
              ? "cursor-not-allowed bg-border text-muted"
              : "bg-foreground text-white hover:bg-accent hover:text-foreground"
          )}
          style={{ marginTop: "0.75rem" }}
        >
          {soldOut ? "Дууссан" : "Сагсанд нэмэх"}
        </button>
      </div>
    </div>
  );
}
