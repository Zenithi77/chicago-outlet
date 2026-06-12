"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { BRANDS, CATEGORIES } from "@/lib/data/categories";
import { PRODUCTS } from "@/lib/data/products";
import { useCart } from "@/lib/store/cart";
import { classNames, finalPrice, formatMNT } from "@/lib/utils";
import { ProductImage } from "./ProductImage";
import {
  SearchIcon,
  BagIcon,
  UserIcon,
  HeartIcon,
  MenuIcon,
  CloseIcon,
  ChevronDown,
} from "./Icons";

// Top-level navigation: categories open a mega-menu; "Хямдрал" routes to sale.
const NAV_ITEMS: {
  slug: string;
  label: string;
  href?: string;
  hasMenu?: boolean;
  accent?: boolean;
}[] = (() => {
  const cats = CATEGORIES.map((c) => ({ slug: c.slug, label: c.nameMn, hasMenu: true }));
  const mid = Math.ceil(cats.length / 2);
  return [
    ...cats.slice(0, mid),
    { slug: "brands", label: "Брэндүүд", href: "/shop?sort=brand", hasMenu: true },
    ...cats.slice(mid),
    { slug: "sale", label: "Хямдрал", href: "/shop?gender=sale", accent: true },
  ];
})();

const DEFAULT_ANNOUNCEMENTS = [
  `₮${BRAND.freeShippingThreshold.toLocaleString()}+ захиалгад үнэгүй хүргэлт`,
  "14 хоногийн дотор асуудалгүй буцаалт",
  "100% жинхэнэ брэндийн бүтээгдэхүүн",
];

export function Header({
  announcements,
}: {
  announcements?: string[];
} = {}) {
  const router = useRouter();
  const count = useCart((s) => s.count());
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu = (slug: string | null) => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
    setHovered(slug);
  };
  const scheduleClose = () => {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = setTimeout(() => setHovered(null), 180);
  };
  const closeMenu = () => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
    setHovered(null);
  };
  const [scrolled, setScrolled] = useState(false);
  const [announce, setAnnounce] = useState(0);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const ANNOUNCEMENTS =
    announcements && announcements.length > 0 ? announcements : DEFAULT_ANNOUNCEMENTS;

  useEffect(() => setMounted(true), []);

  // Smart live search — debounced fetch from Supabase via /api/search
  type SearchHit = {
    id: string;
    slug: string;
    name: string;
    brand: string;
    category: string;
    subcategory: string;
    finalPrice: number;
    price: number;
    discountPercent: number;
    image: string;
    soldOut: boolean;
  };
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        // ignored — likely aborted
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  // Highlight matched text in product names
  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-accent/40 text-foreground rounded px-0.5">{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const featured = useMemo(
    () => PRODUCTS.filter((p) => p.isActive && p.isFeatured).slice(0, 4),
    []
  );

  // Focus the field, lock scroll and wire ESC while the overlay is open.
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => searchInputRef.current?.focus(), 140);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setAnnounce((a) => (a + 1) % ANNOUNCEMENTS.length),
      4000
    );
    return () => clearInterval(id);
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Main bar — double row on desktop */}
      <div
        className={classNames(
          "relative border-b bg-surface/85 backdrop-blur-md transition-all duration-300",
          scrolled ? "shadow-[0_4px_24px_-12px_rgba(0,0,0,0.25)]" : ""
        )}
        onMouseLeave={() => setHovered(null)}
      >
        {/* ── Row 1: Logo + actions ───────────────────────────────────────── */}
        <div className="container-page flex items-center justify-between gap-4 py-3">
          {/* Mobile: hamburger */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Цэс нээх"
          >
            <MenuIcon />
          </button>

          {/* Desktop left placeholder */}
          <div className="hidden md:block" style={{ minWidth: 120 }} />

          {/* Center: brand logo — absolutely centered so it's always in the middle */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-center leading-none"
            onMouseEnter={() => setHovered(null)}
          >
            <span
              className="block font-serif text-[1.25rem] font-bold tracking-[0.18em] md:text-[1.75rem]"
              style={{ color: "#B22234" }}
            >
              CHICAGO
            </span>
            <span
              className="mt-1 block text-[13px] font-semibold uppercase tracking-[0.5em] md:text-[14.4px]"
              style={{ color: "#B22234" }}
            >
              Outlet
            </span>
          </Link>

          {/* Right: actions */}
          <div className="flex items-center gap-1 sm:gap-1.5" style={{ minWidth: 120, justifyContent: "flex-end" }}>
            {/* Search — visible on both mobile and desktop */}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="rounded-full p-2 transition hover:bg-background"
              aria-label="Хайх"
            >
              <SearchIcon />
            </button>
            <Link
              href="/account"
              className="hidden rounded-full p-2 transition hover:bg-background sm:block"
              aria-label="Хүслийн жагсаалт"
            >
              <HeartIcon />
            </Link>
            <Link
              href="/account"
              className="rounded-full p-2 transition hover:bg-background"
              aria-label="Бүртгэл"
            >
              <UserIcon />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative rounded-full p-2 transition hover:bg-background"
              aria-label="Сагс"
            >
              <BagIcon />
              {mounted && count > 0 && (
                <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-foreground">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Row 2: Navigation (desktop only) ───────────────────────────── */}
        <div className="hidden border-t md:block">
          <nav
            className="container-page flex items-center justify-center gap-1 font-elegant text-[13.5px] tracking-wide lg:gap-2 lg:text-[14.5px]"
            onMouseLeave={scheduleClose}
          >
            {NAV_ITEMS.map((n) => {
              const href =
                n.href ??
                `/shop?category=${encodeURIComponent(CATEGORIES.find((c) => c.slug === n.slug)?.name ?? n.label)}`;
              return (
                <div
                  key={n.slug}
                  onMouseEnter={() => openMenu(n.hasMenu ? n.slug : null)}
                  className="flex items-center"
                >
                  <Link
                    href={href}
                    onClick={closeMenu}
                    className={classNames(
                      "group relative flex items-center gap-0.5 px-3 py-3 font-medium transition-colors",
                      n.accent ? "italic text-danger" : "hover:text-accent-dark"
                    )}
                  >
                    {n.label}
                    {n.hasMenu && (
                      <ChevronDown className="h-3 w-3 opacity-50 transition-transform group-hover:rotate-180" />
                    )}
                    <span
                      className={classNames(
                        "absolute inset-x-0 -bottom-px h-[2px] origin-left scale-x-0 bg-foreground transition-transform duration-300 group-hover:scale-x-100",
                        hovered === n.slug && "scale-x-100"
                      )}
                    />
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Mega-menu dropdown */}
        <div
          className={classNames(
            "absolute inset-x-0 top-full hidden overflow-hidden bg-surface transition-all duration-300 md:block",
            (() => {
              if (!hovered) return false;
              if (hovered === "brands") return true;
              const cat = CATEGORIES.find((c) => c.slug === hovered);
              if (!cat) return false;
              return (cat.byGender && cat.byGender.length > 0) || (cat.children && cat.children.length > 0);
            })()
              ? "max-h-[32rem] border-b opacity-100 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.18)]"
              : "pointer-events-none max-h-0 opacity-0"
          )}
          onMouseEnter={() => openMenu(hovered)}
          onMouseLeave={scheduleClose}
          onClick={closeMenu}
        >
          {/* gradient accent bar */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-accent to-transparent" />
          <div className="container-page py-10">
            {(() => {
              // Brands panel — static
              if (hovered === "brands") {
                return (
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-lg font-bold">Брэндүүд</h3>
                        <p className="text-xs text-muted">{BRANDS.length} брэнд</p>
                      </div>
                      <Link
                        href="/shop?sort=brand"
                        className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-dark"
                      >
                        Бүгдийг үзэх
                        <ChevronDown className="-rotate-90 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-4 gap-3 lg:grid-cols-6">
                      {BRANDS.map((brand) => (
                        <Link
                          key={brand}
                          href={`/shop?brand=${encodeURIComponent(brand)}`}
                          className="group relative overflow-hidden rounded-lg border border-transparent bg-background/50 px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-surface hover:shadow-md"
                        >
                          {brand}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              const cat = CATEGORIES.find((c) => c.slug === hovered);
              if (!cat) return null;

              // Хувцас — gender columns from static byGender
              if (cat.byGender && cat.byGender.length > 0) {
                return (
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-lg font-bold">{cat.nameMn}</h3>
                      </div>
                      <Link
                        href={`/shop?category=${encodeURIComponent(cat.name)}`}
                        className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-dark"
                      >
                        Бүгдийг үзэх
                        <ChevronDown className="-rotate-90 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                    <div
                      className={classNames(
                        "grid gap-10",
                        cat.byGender.length === 1 && "grid-cols-1",
                        cat.byGender.length === 2 && "grid-cols-2",
                        cat.byGender.length === 3 && "grid-cols-3"
                      )}
                    >
                      {cat.byGender.map((col) => (
                        <div key={col.key} className="group/col">
                          <Link
                            href={`/shop?category=${encodeURIComponent(cat.name)}&gender=${col.key}`}
                            className="flex items-center gap-2 pb-3 font-serif text-[15px] font-semibold tracking-wide transition-colors hover:text-accent-dark"
                          >
                            {col.label}
                            <ChevronDown className="-rotate-90 opacity-0 transition-all group-hover/col:translate-x-1 group-hover/col:opacity-60" />
                          </Link>
                          <div className="mb-3 h-px w-10 bg-accent" />
                          <ul className="space-y-1.5">
                            {col.subs.map((sub) => (
                              <li key={sub}>
                                <Link
                                  href={`/shop?category=${encodeURIComponent(cat.name)}&gender=${col.key}&subcategory=${encodeURIComponent(sub)}`}
                                  className="group/link inline-flex items-center gap-1.5 rounded-md py-1 text-[13px] text-muted transition-colors hover:text-foreground"
                                >
                                  <span className="h-px w-0 bg-foreground transition-all duration-300 group-hover/link:w-4" />
                                  {sub}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Other categories — same style as Хувцас, auto-wrap every 4 items
              const children = cat.children ?? [];
              if (children.length === 0) return null;
              return (
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold">{cat.nameMn}</h3>
                    <Link
                      href={`/shop?category=${encodeURIComponent(cat.name)}`}
                      className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-dark"
                    >
                      Бүгдийг үзэх
                      <ChevronDown className="-rotate-90 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                  <div className="mb-3 h-px w-10 bg-accent" />
                  <ul className="grid grid-cols-4 gap-x-10 gap-y-0">
                    {children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/shop?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(child.name)}`}
                          className="group/link inline-flex items-center gap-1.5 rounded-md py-1 text-[13px] text-muted transition-colors hover:text-foreground"
                        >
                          <span className="h-px w-0 bg-foreground transition-all duration-300 group-hover/link:w-4" />
                          {child.nameMn}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Search overlay */}
      <div
        className={classNames(
          "fixed inset-0 z-50 transition-opacity duration-300",
          searchOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!searchOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        />
        {/* Panel slides down from the top */}
        <div
          className={classNames(
            "relative w-full border-b bg-surface shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-out",
            searchOpen ? "translate-y-0" : "-translate-y-6"
          )}
        >
          <div className="container-page py-5 sm:py-6">
            {/* Search bar grows from the centre outwards */}
            <form
              onSubmit={search}
              className={classNames(
                "mx-auto flex items-center gap-3 rounded-full border bg-background px-5 py-3.5 shadow-sm transition-all duration-500 ease-out",
                searchOpen ? "max-w-3xl opacity-100" : "max-w-[18rem] opacity-0"
              )}
            >
              <SearchIcon className="shrink-0 text-muted" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Бараа, брэнд, ангилал хайх..."
                className="w-full bg-transparent text-base outline-none placeholder:text-muted"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Цэвэрлэх"
                  className="shrink-0 text-muted transition hover:text-foreground"
                >
                  <CloseIcon />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Хаах"
                className="ml-1 hidden shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide text-muted transition hover:text-foreground sm:block"
              >
                ESC
              </button>
            </form>

            {/* Live results */}
            <div
              className={classNames(
                "mx-auto mt-5 max-w-3xl transition-all duration-500",
                searchOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              )}
            >
              {query.trim() === "" ? (
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Эрэлттэй хайлт
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {NAV_ITEMS.map((n) => (
                        <button
                          key={n.slug}
                          type="button"
                          onClick={() => {
                            router.push(
                              n.slug === "sale"
                                ? "/shop?gender=sale"
                                : `/shop?category=${encodeURIComponent(CATEGORIES.find((c) => c.slug === n.slug)?.name ?? n.label)}`
                            );
                            setSearchOpen(false);
                          }}
                          className={classNames(
                            "rounded-full border px-4 py-1.5 text-sm transition hover:border-foreground",
                            n.accent ? "text-danger" : ""
                          )}
                        >
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Онцлох бараа
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {featured.map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="group rounded-xl p-2 transition hover:bg-background"
                        >
                          <ProductImage
                            seed={p.images[0]}
                            label={p.name}
                            className="aspect-square w-full rounded-lg"
                          />
                          <p className="mt-2 truncate text-xs font-medium">{p.name}</p>
                          <p className="text-xs text-muted">{formatMNT(finalPrice(p))}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">
                  {searching ? "Хайж байна…" : `«${query}» — илэрц олдсонгүй.`}
                </p>
              ) : (
                <div className="space-y-1">
                  {results.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-4 rounded-xl p-2 transition hover:bg-background"
                    >
                      <ProductImage
                        seed={p.image}
                        label={p.name}
                        className="h-14 w-14 shrink-0 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{highlight(p.name, query)}</p>
                        <p className="truncate text-xs text-muted">
                          {p.brand} · {p.subcategory}
                          {p.soldOut && <span className="ml-2 text-danger font-medium">Дууссан</span>}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatMNT(p.finalPrice)}
                      </span>
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={search}
                    className="mt-2 w-full rounded-xl bg-foreground py-3 text-sm font-medium text-white transition hover:bg-foreground/90"
                  >
                    «{query}» бүх илэрцийг харах
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={classNames(
          "fixed inset-0 z-50 bg-black/40 transition-opacity md:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        className={classNames(
          "fixed left-0 top-0 z-50 flex h-full w-[88%] max-w-sm flex-col bg-surface shadow-2xl transition-transform duration-300 md:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-foreground px-6 pb-6 pt-6 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p
                className="font-serif text-xl font-bold tracking-[0.14em]"
                style={{ color: "#B22234" }}
              >
                CHICAGO
              </p>
              <p
                className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.42em]"
                style={{ color: "#B22234" }}
              >
                Outlet
              </p>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Хаах"
              className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Search */}
          <div className="px-5 pt-5">
            <form
              onSubmit={search}
              className="flex items-center gap-2 rounded-full border bg-background px-4 py-2.5 transition focus-within:border-foreground focus-within:shadow-sm"
            >
              <SearchIcon className="text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Бараа, брэнд хайх..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </form>
          </div>

          {/* Mobile: top-level categories */}
          <div className="px-5 pt-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">Дэлгүүр</p>
            <div className="space-y-1">
              {NAV_ITEMS.map((n) => (
                <Link
                  key={n.slug}
                  href={
                    n.slug === "sale"
                      ? "/shop?gender=sale"
                      : `/shop?category=${encodeURIComponent(CATEGORIES.find((c) => c.slug === n.slug)?.name ?? n.label)}`
                  }
                  onClick={() => setMenuOpen(false)}
                  className={classNames(
                    "group flex items-center justify-between rounded-xl px-3 py-3 font-elegant text-xl font-medium transition",
                    n.accent
                      ? "italic text-danger hover:bg-danger/5"
                      : "hover:bg-background hover:text-accent-dark"
                  )}
                >
                  <span>{n.label}</span>
                  <span className="text-muted transition group-hover:translate-x-1 group-hover:text-foreground">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile: subcategories removed */}
        </div>

        {/* Footer actions removed: account & cart already in main header */}
      </aside>
    </header>
  );
}
