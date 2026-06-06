"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { CATEGORIES } from "@/lib/data/categories";
import { useCart } from "@/lib/store/cart";
import { classNames } from "@/lib/utils";
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

const ANNOUNCEMENTS = [
  `₮${BRAND.freeShippingThreshold.toLocaleString()}+ захиалгад үнэгүй хүргэлт`,
  "14 хоногийн дотор асуудалгүй буцаалт",
  "100% жинхэнэ брэндийн бүтээгдэхүүн",
];

export function Header() {
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

  useEffect(() => setMounted(true), []);

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
            <nav className="hidden items-center gap-7 text-[13px] font-medium tracking-wide md:flex">
              {GENDER_LINKS.map((g) => (
                <div key={g.value} onMouseEnter={() => setHovered(g.value)} className="flex items-center">
                  <Link
                    href={`/shop?gender=${g.value}`}
                    className={classNames(
                      "group relative flex items-center gap-1 py-2 transition-colors",
                      g.accent ? "text-danger" : "hover:text-accent-dark"
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
              aria-label="Бүртгэл"
            >
              <UserIcon />
            </Link>
            <Link
              href="/account"
              className="hidden rounded-full p-2 transition hover:bg-background sm:block"
              aria-label="Хүслийн жагсаалт"
            >
              <HeartIcon />
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

      {/* Expandable search bar */}
      <div
        className={classNames(
          "overflow-hidden border-b bg-surface transition-all duration-300",
          searchOpen ? "max-h-24 opacity-100" : "max-h-0 border-b-0 opacity-0"
        )}
      >
        <form onSubmit={search} className="container-page flex items-center gap-3 py-4">
          <SearchIcon className="text-muted" />
          <input
            autoFocus={searchOpen}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Бараа, ангилал хайх..."
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Хаах"
            className="p-1 text-muted hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </form>
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
          "fixed left-0 top-0 z-50 flex h-full w-80 max-w-[85%] flex-col bg-surface shadow-xl transition-transform duration-300 md:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <span className="font-serif text-lg font-bold tracking-wide">CHICAGO OUTLET</span>
          <button onClick={() => setMenuOpen(false)} aria-label="Хаах">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <form
            onSubmit={search}
            className="mb-5 flex items-center gap-2 rounded-full border bg-background px-4 py-2.5"
          >
            <SearchIcon className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Хайх..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </form>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Дэлгүүр</p>
          {GENDER_LINKS.map((g) => (
            <Link
              key={g.value}
              href={`/shop?gender=${g.value}`}
              onClick={() => setMenuOpen(false)}
              className={classNames(
                "block border-b py-3 text-[15px] font-medium",
                g.accent && "text-danger"
              )}
            >
              {g.label}
            </Link>
          ))}
          <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted">Ангилал</p>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${encodeURIComponent(c.name)}`}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm text-muted"
            >
              {c.nameMn}
            </Link>
          ))}
        </div>
        <div className="border-t px-5 py-4">
          <Link
            href="/account"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium"
          >
            <UserIcon /> Миний бүртгэл
          </Link>
          <Link
            href="/admin"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm text-muted"
          >
            Админ нэвтрэх
          </Link>
        </div>
      </aside>
    </header>
  );
}
