"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { CATEGORIES } from "@/lib/data/categories";
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

const GENDER_LINKS = [
  { label: "Эрэгтэй", value: "men", accent: false },
  { label: "Эмэгтэй", value: "women", accent: false },
  { label: "Юнисекс", value: "unisex", accent: false },
  { label: "Хямдрал", value: "sale", accent: true },
];

const DEFAULT_ANNOUNCEMENTS = [
  `₮${BRAND.freeShippingThreshold.toLocaleString()}+ захиалгад үнэгүй хүргэлт`,
  "14 хоногийн дотор асуудалгүй буцаалт",
  "100% жинхэнэ брэндийн бүтээгдэхүүн",
];

export function Header({ announcements }: { announcements?: string[] } = {}) {
  const router = useRouter();
  const count = useCart((s) => s.count());
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [announce, setAnnounce] = useState(0);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const ANNOUNCEMENTS =
    announcements && announcements.length > 0 ? announcements : DEFAULT_ANNOUNCEMENTS;

  useEffect(() => setMounted(true), []);

  // Live results as the visitor types.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter((p) => p.isActive)
      .filter((p) =>
        [p.name, p.brand, p.category, p.subcategory, ...(p.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 6);
  }, [query]);

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
      {/* Announcement bar */}
      <div className="bg-foreground text-white">
        <div className="container-page flex h-8 items-center justify-center overflow-hidden text-[11px] font-medium uppercase tracking-[0.18em]">
          <span key={announce} className="animate-fade-up text-center text-white/90">
            {ANNOUNCEMENTS[announce]}
          </span>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={classNames(
          "relative border-b bg-surface/85 backdrop-blur-md transition-all duration-300",
          scrolled ? "shadow-[0_4px_24px_-12px_rgba(0,0,0,0.25)]" : ""
        )}
        onMouseLeave={() => setHovered(null)}
      >
        <div
          className={classNames(
            "container-page relative flex items-center justify-between gap-4 transition-all duration-300",
            scrolled ? "h-14" : "h-[4.5rem]"
          )}
        >
          {/* Left: mobile menu + desktop nav */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Цэс нээх"
            >
              <MenuIcon />
            </button>
            <nav className="hidden items-center gap-8 font-elegant text-[17px] tracking-wide md:flex">
              {GENDER_LINKS.map((g) => (
                <div key={g.value} onMouseEnter={() => setHovered(g.value)} className="flex items-center">
                  <Link
                    href={`/shop?gender=${g.value}`}
                    className={classNames(
                      "group relative flex items-center gap-1 py-2 font-medium transition-colors",
                      g.accent ? "italic text-danger" : "hover:text-accent-dark"
                    )}
                  >
                    {g.label}
                    {!g.accent && (
                      <ChevronDown className="opacity-50 transition-transform group-hover:rotate-180" />
                    )}
                    <span
                      className={classNames(
                        "absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-foreground transition-transform duration-300 group-hover:scale-x-100",
                        hovered === g.value && "scale-x-100"
                      )}
                    />
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* Center: logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-center leading-none"
            onMouseEnter={() => setHovered(null)}
          >
            <span className="block font-serif text-[1.35rem] font-bold tracking-[0.12em] md:text-2xl">
              CHICAGO
            </span>
            <span className="-mt-0.5 block text-[9px] font-medium uppercase tracking-[0.42em] text-accent-dark">
              Outlet
            </span>
          </Link>

          {/* Right: actions */}
          <div className="flex items-center gap-1 sm:gap-1.5">
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

        {/* Mega-menu dropdown */}
        <div
          className={classNames(
            "absolute inset-x-0 top-full hidden overflow-hidden border-b bg-surface shadow-lg transition-all duration-300 md:block",
            hovered && hovered !== "sale"
              ? "max-h-96 opacity-100"
              : "pointer-events-none max-h-0 opacity-0"
          )}
        >
          <div className="container-page grid grid-cols-4 gap-8 py-8">
            {CATEGORIES.slice(0, 4).map((c) => (
              <div key={c.slug}>
                <Link
                  href={`/shop?category=${encodeURIComponent(c.name)}`}
                  className="font-serif text-sm font-semibold hover:text-accent-dark"
                >
                  {c.nameMn}
                </Link>
                <ul className="mt-3 space-y-2">
                  {c.children?.map((sub) => (
                    <li key={sub.slug}>
                      <Link
                        href={`/shop?category=${encodeURIComponent(c.name)}`}
                        className="text-[13px] text-muted transition-colors hover:text-foreground"
                      >
                        {sub.nameMn}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
                      {GENDER_LINKS.map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => {
                            router.push(`/shop?gender=${g.value}`);
                            setSearchOpen(false);
                          }}
                          className={classNames(
                            "rounded-full border px-4 py-1.5 text-sm transition hover:border-foreground",
                            g.accent ? "text-danger" : ""
                          )}
                        >
                          {g.label}
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
                  «{query}» — илэрц олдсонгүй.
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
                        seed={p.images[0]}
                        label={p.name}
                        className="h-14 w-14 shrink-0 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="truncate text-xs text-muted">
                          {p.brand} · {p.subcategory}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {formatMNT(finalPrice(p))}
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
              <p className="font-serif text-xl font-bold tracking-[0.14em]">CHICAGO</p>
              <p className="-mt-1 text-[10px] font-medium uppercase tracking-[0.42em] text-accent">Outlet</p>
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

          {/* Gender (elegant) */}
          <div className="px-5 pt-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">Дэлгүүр</p>
            <div className="space-y-1">
              {GENDER_LINKS.map((g) => (
                <Link
                  key={g.value}
                  href={`/shop?gender=${g.value}`}
                  onClick={() => setMenuOpen(false)}
                  className={classNames(
                    "group flex items-center justify-between rounded-xl px-3 py-3 font-elegant text-xl font-medium transition",
                    g.accent
                      ? "italic text-danger hover:bg-danger/5"
                      : "hover:bg-background hover:text-accent-dark"
                  )}
                >
                  <span>{g.label}</span>
                  <span className="text-muted transition group-hover:translate-x-1 group-hover:text-foreground">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="px-5 pb-6 pt-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">Ангилал</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?category=${encodeURIComponent(c.name)}`}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-black/5 bg-background px-3 py-2.5 text-[13px] font-medium text-foreground/80 transition hover:border-foreground hover:text-foreground"
                >
                  {c.nameMn}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions removed: account & cart already in main header */}
      </aside>
    </header>
  );
}
