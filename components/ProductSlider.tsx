"use client";

import { useRef, useState, useEffect } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { ArrowRightIcon } from "./Icons";

export function ProductSlider({ products }: { products: Product[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [products.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(280, el.clientWidth * 0.85);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (products.length === 0) {
    return <p className="text-sm text-muted">Энэ ангилалд бүтээгдэхүүн алга.</p>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Өмнөх"
        onClick={() => scrollBy(-1)}
        disabled={!canPrev}
        className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full border bg-surface shadow-md transition disabled:opacity-0 md:flex"
      >
        <ArrowRightIcon className="h-4 w-4 rotate-180" />
      </button>
      <button
        type="button"
        aria-label="Дараах"
        onClick={() => scrollBy(1)}
        disabled={!canNext}
        className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border bg-surface shadow-md transition disabled:opacity-0 md:flex"
      >
        <ArrowRightIcon className="h-4 w-4" />
      </button>

      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-6"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="snap-start shrink-0 basis-[calc(50%-0.5rem)] sm:basis-[40%] md:basis-[28%] lg:basis-[22%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
