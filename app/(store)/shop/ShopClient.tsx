"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/data/categories";
import { ProductCard } from "@/components/ProductCard";
import { finalPrice, classNames } from "@/lib/utils";
import { CloseIcon, FilterIcon } from "@/components/Icons";
import type { Product } from "@/lib/types";

const SORTS = [
  { value: "newest", label: "Шинэ эхэндээ" },
  { value: "relevance", label: "Хамаарал" },
  { value: "price-asc", label: "Үнэ: бага → их" },
  { value: "price-desc", label: "Үнэ: их → бага" },
  { value: "discount", label: "Хямдрал ихтэй" },
  { value: "rating", label: "Үнэлгээ өндөр" },
];

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function ShopContent({ products }: { products: Product[] }) {
  const params = useSearchParams();
  const q = params.get("q")?.toLowerCase() ?? "";
  const genderParam = params.get("gender") ?? "";
  const branchParam = params.get("branch") ?? "";
  const categoryParam = params.get("category") ?? "";
  const subcategoryParam = params.get("subcategory") ?? "";
  const collectionParam = params.get("collection") ?? "";

  // Live price bounds derived from the current product list. These shift as
  // products are added / removed so the slider always covers the real range.
  const { dataMin, dataMax } = useMemo(() => {
    const prices = products.filter((p) => p.isActive).map((p) => finalPrice(p));
    if (prices.length === 0) return { dataMin: 0, dataMax: 1000000 };
    const min = Math.floor(Math.min(...prices) / 1000) * 1000;
    const max = Math.ceil(Math.max(...prices) / 1000) * 1000;
    return { dataMin: min, dataMax: Math.max(max, min + 1000) };
  }, [products]);

  const [sort, setSort] = useState("newest");
  const [activeBranch, setActiveBranch] = useState<string>(branchParam);
  const [activeCats, setActiveCats] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );
  const [activeSubs, setActiveSubs] = useState<string[]>(
    subcategoryParam ? [subcategoryParam] : []
  );
  const [activeSizes, setActiveSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(dataMin);
  const [maxPrice, setMaxPrice] = useState(dataMax);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Keep slider bounds in sync when product list changes.
  useEffect(() => {
    setMinPrice((v) => Math.max(dataMin, Math.min(v, dataMax)));
    setMaxPrice((v) => Math.max(dataMin, Math.min(v || dataMax, dataMax)));
  }, [dataMin, dataMax]);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.isActive);

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
      );
    }
    if (activeBranch) {
      if (activeBranch === "online") {
        list = list.filter((p) => p.isOnline || p.branch === "online");
      } else {
        list = list.filter((p) => {
          if (p.branchStock && Object.keys(p.branchStock).length > 0) {
            return (p.branchStock[activeBranch] ?? 0) > 0 || activeBranch in p.branchStock;
          }
          return p.branch === activeBranch;
        });
      }
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
    if (activeSubs.length) {
      list = list.filter((p) => activeSubs.includes(p.subcategory));
    }
    if (activeSizes.length) {
      list = list.filter((p) => p.sizes.some((s) => activeSizes.includes(s)));
    }
    list = list.filter((p) => {
      const fp = finalPrice(p);
      return fp >= minPrice && fp <= maxPrice;
    });
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
  }, [products, q, activeBranch, genderParam, collectionParam, activeCats, activeSubs, activeSizes, minPrice, maxPrice, inStockOnly, sort]);

  const branchLabel =
    activeBranch === "park_od"
      ? "Park-Od Mall"
      : activeBranch === "riveria"
      ? "Parko Riveria"
      : activeBranch === "online"
      ? "Захиалга"
      : "";
  const title = q
    ? `"${q}" хайлтын үр дүн`
    : branchLabel || collectionParam || categoryParam || (genderParam === "sale" ? "Хямдрал" : "Бүх бараа");

  return (
    <div className="container-page py-8">
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wider text-muted">Нүүр / Дэлгүүр</p>
        <h1 className="font-serif text-3xl font-bold capitalize">{title || "Бүх бараа"}</h1>
        <p className="text-sm text-muted">{filtered.length} бараа олдлоо</p>
      </div>

      {/* Branch tabs */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {([
          { value: "", label: "Бүгд" },
          { value: "park_od", label: "Park-Od Mall" },
          { value: "riveria", label: "Parko Riveria" },
          { value: "online", label: "Захиалга" },
        ] as const).map((b) => (
          <button
            key={b.value}
            onClick={() => setActiveBranch(b.value)}
            className={classNames(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              activeBranch === b.value
                ? "border-foreground bg-foreground text-white"
                : "border-border text-muted hover:border-foreground hover:text-foreground"
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-y py-3 md:hidden">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-foreground/20 bg-surface px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-foreground hover:bg-background active:scale-95"
        >
          <FilterIcon className="h-4 w-4" /> Шүүлтүүр
        </button>
        <SortSelect sort={sort} setSort={setSort} />
      </div>

      {/* Mobile filter bottom-sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 md:hidden" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-surface pb-safe shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-surface px-5 py-4">
              <span className="font-serif text-base font-bold">Шүүлтүүр</span>
              <button onClick={() => setFiltersOpen(false)} aria-label="Хаах">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 px-5 py-4">
              <FilterGroup label="Ангилал">
                {CATEGORIES.map((c) => {
                  const isActive = activeCats.includes(c.name);
                  const subs = Array.from(new Set(products.filter((p) => p.isActive && p.category === c.name && p.subcategory).map((p) => p.subcategory))).sort();
                  return (
                    <div key={c.slug} className="py-1">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" checked={isActive} onChange={() => { toggle(activeCats, c.name, setActiveCats); if (isActive) setActiveSubs((s) => s.filter((x) => !subs.includes(x))); }} className="accent-[var(--accent)]" />
                        {c.nameMn}
                      </label>
                      {isActive && subs.length > 0 && (
                        <div className="ml-5 mt-1 space-y-1 border-l pl-3">
                          {subs.map((sub) => (
                            <label key={sub} className="flex cursor-pointer items-center gap-2 text-[13px]">
                              <input type="checkbox" checked={activeSubs.includes(sub)} onChange={() => toggle(activeSubs, sub, setActiveSubs)} className="accent-[var(--accent)]" />
                              {sub}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </FilterGroup>
              <FilterGroup label="Хэмжээ">
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((s) => (
                    <button key={s} onClick={() => toggle(activeSizes, s, setActiveSizes)} className={classNames("h-10 w-10 rounded-md border text-xs font-medium", activeSizes.includes(s) ? "border-foreground bg-foreground text-white" : "bg-surface hover:border-foreground")}>{s}</button>
                  ))}
                </div>
              </FilterGroup>
              <FilterGroup label={`Үнэ: ₮${minPrice.toLocaleString()} – ₮${maxPrice.toLocaleString()}`}>
                <div className="space-y-3">
                  <div><p className="mb-1 text-[11px] text-muted">Доод хязгаар</p><input type="range" min={dataMin} max={dataMax} step={1000} value={minPrice} onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))} className="w-full accent-[var(--accent)]" /></div>
                  <div><p className="mb-1 text-[11px] text-muted">Дээд хязгаар</p><input type="range" min={dataMin} max={dataMax} step={1000} value={maxPrice} onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))} className="w-full accent-[var(--accent)]" /></div>
                </div>
              </FilterGroup>
              <FilterGroup label="Бэлэн байдал">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-[var(--accent)]" />
                  Зөвхөн бэлэн байгаа
                </label>
              </FilterGroup>
              <div className="flex gap-3 pb-2">
                <button onClick={() => { setActiveCats([]); setActiveSubs([]); setActiveSizes([]); setMinPrice(dataMin); setMaxPrice(dataMax); setInStockOnly(false); }} className="flex-1 rounded-md border py-3 text-sm font-semibold">Цэвэрлэх</button>
                <button onClick={() => setFiltersOpen(false)} className="flex-1 rounded-md bg-foreground py-3 text-sm font-semibold text-white">Харуулах ({filtered.length})</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8">
        <aside
          className="hidden w-60 shrink-0 space-y-6 md:block"
        >
          <FilterGroup label="Ангилал">
            {CATEGORIES.map((c) => {
              const isActive = activeCats.includes(c.name);
              // Subcategories actually present for this category in the data.
              const subs = Array.from(
                new Set(
                  products
                    .filter((p) => p.isActive && p.category === c.name && p.subcategory)
                    .map((p) => p.subcategory)
                )
              ).sort();
              return (
                <div key={c.slug} className="py-1">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => {
                        toggle(activeCats, c.name, setActiveCats);
                        // Drop subcategory selections that no longer apply.
                        if (isActive) {
                          setActiveSubs((s) => s.filter((x) => !subs.includes(x)));
                        }
                      }}
                      className="accent-[var(--accent)]"
                    />
                    {c.nameMn}
                  </label>
                  {isActive && subs.length > 0 && (
                    <div className="ml-5 mt-1 space-y-1 border-l pl-3">
                      {subs.map((sub) => (
                        <label key={sub} className="flex cursor-pointer items-center gap-2 text-[13px]">
                          <input
                            type="checkbox"
                            checked={activeSubs.includes(sub)}
                            onChange={() => toggle(activeSubs, sub, setActiveSubs)}
                            className="accent-[var(--accent)]"
                          />
                          {sub}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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

          <FilterGroup label={`Үнэ: ₮${minPrice.toLocaleString()} – ₮${maxPrice.toLocaleString()}`}>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[11px] text-muted">Доод хязгаар</p>
                <input
                  type="range"
                  min={dataMin}
                  max={dataMax}
                  step={1000}
                  value={minPrice}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMinPrice(Math.min(v, maxPrice));
                  }}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] text-muted">Дээд хязгаар</p>
                <input
                  type="range"
                  min={dataMin}
                  max={dataMax}
                  step={1000}
                  value={maxPrice}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMaxPrice(Math.max(v, minPrice));
                  }}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
              <p className="text-[11px] text-muted">
                Бүх барааны хүрээ: ₮{dataMin.toLocaleString()} – ₮{dataMax.toLocaleString()}
              </p>
            </div>
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
              setActiveSubs([]);
              setActiveSizes([]);
              setMinPrice(dataMin);
              setMaxPrice(dataMax);
              setInStockOnly(false);
            }}
            className="text-sm text-accent-dark underline"
          >
            Шүүлтүүр цэвэрлэх
          </button>
        </aside>

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

export function ShopClient({ products }: { products: Product[] }) {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-muted">Ачааллаж байна…</div>}>
      <ShopContent products={products} />
    </Suspense>
  );
}
