"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PRODUCTS } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/data/categories";
import { ProductCard } from "@/components/ProductCard";
import { finalPrice, classNames } from "@/lib/utils";
import { FilterIcon } from "@/components/Icons";
import type { Product } from "@/lib/types";

const SORTS = [
  { value: "relevance", label: "Хамаарал" },
  { value: "newest", label: "Шинэ эхэндээ" },
  { value: "price-asc", label: "Үнэ: бага → их" },
  { value: "price-desc", label: "Үнэ: их → бага" },
  { value: "discount", label: "Хямдрал ихтэй" },
  { value: "rating", label: "Үнэлгээ өндөр" },
];

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function ShopContent() {
  const params = useSearchParams();
  const q = params.get("q")?.toLowerCase() ?? "";
  const genderParam = params.get("gender") ?? "";
  const categoryParam = params.get("category") ?? "";
  const collectionParam = params.get("collection") ?? "";

  const [sort, setSort] = useState("relevance");
  const [activeCats, setActiveCats] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [activeSizes, setActiveSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.isActive);

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
      );
    }
    if (genderParam === "sale") {
      list = list.filter((p) => p.isOnSale);
    } else if (genderParam) {
      list = list.filter((p) => p.gender === genderParam || p.gender === "unisex");
    }
    if (collectionParam) {
      list = list.filter((p) => p.collection === collectionParam);
    }
    if (activeCats.length) {
      list = list.filter((p) => activeCats.includes(p.category));
    }
    if (activeSizes.length) {
      list = list.filter((p) => p.sizes.some((s) => activeSizes.includes(s)));
    }
    list = list.filter((p) => finalPrice(p) <= maxPrice);
    if (inStockOnly) {
      list = list.filter((p) => p.totalStock > 0);
    }

    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case "price-asc":
        sorted.sort((a, b) => finalPrice(a) - finalPrice(b));
        break;
      case "price-desc":
        sorted.sort((a, b) => finalPrice(b) - finalPrice(a));
        break;
      case "discount":
        sorted.sort((a, b) => b.discountPercent - a.discountPercent);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
    }
    return sorted;
  }, [q, genderParam, collectionParam, activeCats, activeSizes, maxPrice, inStockOnly, sort]);

  const title = q
    ? `"${q}" хайлтын үр дүн`
    : collectionParam || categoryParam || (genderParam === "sale" ? "Хямдрал" : "Бүх бараа");

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wider text-muted">
          Нүүр / Дэлгүүр
        </p>
        <h1 className="font-serif text-3xl font-bold capitalize">{title}</h1>
        <p className="text-sm text-muted">{filtered.length} бараа олдлоо</p>
      </div>

      <div className="flex items-center justify-between border-y py-3 md:hidden">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold"
        >
          <FilterIcon className="h-4 w-4" /> Шүүлтүүр
        </button>
        <SortSelect sort={sort} setSort={setSort} />
      </div>

      <div className="flex gap-8">
        {/* Filters */}
        <aside
          className={classNames(
            "w-60 shrink-0 space-y-6 md:block",
            filtersOpen ? "block" : "hidden"
          )}
        >
          <FilterGroup label="Ангилал">
            {CATEGORIES.map((c) => (
              <label key={c.slug} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={activeCats.includes(c.name)}
                  onChange={() => toggle(activeCats, c.name, setActiveCats)}
                  className="accent-[var(--accent)]"
                />
                {c.nameMn}
              </label>
            ))}
          </FilterGroup>

          <FilterGroup label="Хэмжээ">
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(activeSizes, s, setActiveSizes)}
                  className={classNames(
                    "h-9 w-9 rounded-md border text-xs font-medium",
                    activeSizes.includes(s)
                      ? "border-foreground bg-foreground text-white"
                      : "bg-surface hover:border-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label={`Дээд үнэ: ₮${maxPrice.toLocaleString()}`}>
            <input
              type="range"
              min={20000}
              max={500000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </FilterGroup>

          <FilterGroup label="Бэлэн байдал">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              Зөвхөн бэлэн байгаа
            </label>
          </FilterGroup>

          <button
            onClick={() => {
              setActiveCats([]);
              setActiveSizes([]);
              setMaxPrice(500000);
              setInStockOnly(false);
            }}
            className="text-sm text-accent-dark underline"
          >
            Шүүлтүүр цэвэрлэх
          </button>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          <div className="mb-4 hidden items-center justify-end md:flex">
            <SortSelect sort={sort} setSort={setSort} />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="font-serif text-xl">Бараа олдсонгүй</p>
              <p className="text-sm text-muted">
                Шүүлтүүрээ өөрчилж эсвэл өөр түлхүүр үг ашиглаж үзнэ үү.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
              {filtered.map((p: Product) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b pb-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider">{label}</p>
      {children}
    </div>
  );
}

function SortSelect({ sort, setSort }: { sort: string; setSort: (s: string) => void }) {
  return (
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value)}
      className="rounded-md border bg-surface px-3 py-1.5 text-sm outline-none"
    >
      {SORTS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-muted">Ачааллаж байна…</div>}>
      <ShopContent />
    </Suspense>
  );
}
