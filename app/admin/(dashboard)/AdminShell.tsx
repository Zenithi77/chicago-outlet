"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { classNames } from "@/lib/utils";
import { logout } from "./actions";
import type { Role } from "@/lib/supabase/auth";

const NAV = [
  { href: "/admin", label: "Хяналтын самбар", icon: "▤" },
  { href: "/admin/products", label: "Бараа", icon: "▦" },
  { href: "/admin/orders", label: "Захиалга", icon: "▣" },
  { href: "/admin/customers", label: "Хэрэглэгч", icon: "☺" },
  { href: "/admin/coupons", label: "Купон & Урамшуулал", icon: "◈" },
];

const ROLE_LABEL: Record<Role, string> = {
  admin: "Админ",
  manager: "Менежер",
  staff: "Ажилтан",
  customer: "Хэрэглэгч",
};

export function AdminShell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-surface md:flex">
        <div className="border-b px-5 py-5">
          <Link href="/admin" className="font-serif text-lg font-bold">
            CHICAGO <span className="text-accent-dark">OUTLET</span>
          </Link>
          <p className="mt-0.5 text-xs text-muted">
            {ROLE_LABEL[role]} · {name}
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={classNames(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                  active ? "bg-foreground text-white" : "hover:bg-background"
                )}
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-background"
          >
            ↗ Дэлгүүр үзэх
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-background"
            >
              ⏻ Гарах
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/admin" className="font-serif text-base font-bold">
            CHICAGO <span className="text-accent-dark">OUTLET</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-muted">
              {ROLE_LABEL[role]}
            </span>
            <Link href="/" aria-label="Дэлгүүр" className="text-sm text-muted">
              ↗
            </Link>
            <form action={logout}>
              <button type="submit" className="text-sm font-medium text-danger">
                Гарах
              </button>
            </form>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="sticky top-[49px] z-20 flex gap-2 overflow-x-auto border-b bg-surface px-4 py-2.5 text-sm no-scrollbar md:hidden">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={classNames(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition",
                  active ? "bg-foreground text-white" : "bg-background text-muted"
                )}
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </div>
        <main className="w-full max-w-full overflow-x-hidden p-4 sm:p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
