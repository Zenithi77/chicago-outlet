"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdmin } from "@/lib/store/admin";
import { classNames } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Хяналтын самбар", icon: "▤" },
  { href: "/admin/products", label: "Бараа", icon: "▦" },
  { href: "/admin/orders", label: "Захиалга", icon: "▣" },
  { href: "/admin/customers", label: "Хэрэглэгч", icon: "☺" },
  { href: "/admin/coupons", label: "Купон & Урамшуулал", icon: "◈" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authed, login, logout, username } = useAdmin();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Ачааллаж байна…</div>;
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foreground p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!login(u, p)) setErr("Нэвтрэх нэр эсвэл нууц үг буруу байна.");
          }}
          className="w-full max-w-sm rounded-xl bg-surface p-8"
        >
          <p className="text-center font-serif text-2xl font-bold">CHICAGO OUTLET</p>
          <p className="mb-6 text-center text-sm text-muted">Админ удирдлага</p>
          <input
            placeholder="Нэвтрэх нэр"
            value={u}
            onChange={(e) => setU(e.target.value)}
            className="mb-3 w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="password"
            placeholder="Нууц үг"
            value={p}
            onChange={(e) => setP(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none"
          />
          {err && <p className="mt-2 text-sm text-danger">{err}</p>}
          <button className="mt-4 w-full rounded-md bg-foreground py-3 text-sm font-semibold text-white hover:bg-accent hover:text-foreground">
            Нэвтрэх
          </button>
          <p className="mt-4 text-center text-xs text-muted">Demo: admin / chicago2025</p>
          <Link href="/" className="mt-3 block text-center text-xs text-accent-dark underline">
            ← Дэлгүүр рүү буцах
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-surface md:flex">
        <div className="border-b px-5 py-5">
          <Link href="/admin" className="font-serif text-lg font-bold">
            CHICAGO <span className="text-accent-dark">OUTLET</span>
          </Link>
          <p className="mt-0.5 text-xs text-muted">Admin · {username}</p>
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
          <Link href="/" className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-background">
            ↗ Дэлгүүр үзэх
          </Link>
          <button
            onClick={logout}
            className="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-background"
          >
            ⏻ Гарах
          </button>
        </div>
      </aside>

      <div className="flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b bg-surface px-4 py-3 md:hidden">
          <span className="font-serif font-bold">Admin</span>
          <button onClick={logout} className="text-sm text-danger">Гарах</button>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b bg-surface px-4 py-2 text-sm no-scrollbar md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={classNames(
                "whitespace-nowrap rounded-md px-3 py-1.5",
                pathname === n.href ? "bg-foreground text-white" : "bg-background"
              )}
            >
              {n.label}
            </Link>
          ))}
        </div>
        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
