import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { CATEGORIES } from "@/lib/data/categories";
import { ArrowRightIcon } from "@/components/Icons";

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-foreground text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div>
          <p className="font-serif text-xl font-bold">CHICAGO OUTLET</p>
          <p className="mt-3 max-w-xs text-sm text-white/60">{BRAND.tagline}</p>
          <p className="mt-4 text-sm text-white/60">{BRAND.address}</p>
          <p className="mt-1 text-sm text-white/60">{BRAND.phone}</p>
          <p className="text-sm text-white/60">{BRAND.phone2}</p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
            Дэлгүүр
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            {CATEGORIES.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/shop?category=${encodeURIComponent(c.name)}`}
                  className="hover:text-accent"
                >
                  {c.nameMn}
                </Link>
              </li>
            ))}
          </ul>
        </div>



        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
            Мэдээлэл авах
          </p>
          <p className="text-sm text-white/60">
            Шинэ цуглуулга, онцгой саналыг хүлээж аваарай.
          </p>
          <form className="mt-3 flex">
            <input
              type="email"
              placeholder="И-мэйл хаяг"
              className="w-full rounded-l-md border-0 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
            />
            <button
              type="submit"
              aria-label="Бүртгүүлэх"
              className="flex items-center justify-center rounded-r-md bg-accent px-4 text-foreground"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>
          <Link href="/admin" className="mt-4 inline-block text-xs text-white/40 hover:text-white/70">
            Админ нэвтрэх
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        &copy; {new Date().getFullYear()} Chicago Outlet. All rights reserved. &middot; Secure Payment &middot; QPay
      </div>
    </footer>
  );
}
