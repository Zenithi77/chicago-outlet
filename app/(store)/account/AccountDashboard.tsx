"use client";

import Link from "next/link";
import { useState } from "react";
import { ORDERS } from "@/lib/data/orders";
import { formatMNT, formatDate, classNames } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/auth";
import { logout } from "./actions";
import { DashboardIcon } from "@/components/Icons";

const STATUS_LABEL: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  processing: "Боловсруулж буй",
  shipped: "Илгээгдсэн",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
  refunded: "Буцаагдсан",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Админ",
  manager: "Менежер",
  staff: "Ажилтан",
  customer: "Гишүүн",
};

export function AccountDashboard({
  profile,
  staff,
}: {
  profile: Profile;
  staff: boolean;
}) {
  const [tab, setTab] = useState<"orders" | "wishlist" | "profile">("orders");
  const name = profile.full_name || profile.email?.split("@")[0] || "Зочин";

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Сайн байна уу, {name}</h1>
          <p className="text-sm text-muted">
            {ROLE_LABEL[profile.role] ?? "Гишүүн"} · {profile.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {staff && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent hover:text-foreground"
            >
              <DashboardIcon className="h-4 w-4" /> Админ хэсэг рүү орох
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-danger/40 bg-surface px-5 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
            >
              Гарах
            </button>
          </form>
        </div>
      </div>

      {staff && (
        <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm text-foreground">
          Та <b>{ROLE_LABEL[profile.role]}</b> эрхтэй байна. Дэлгүүрийн удирдлагад
          хандахын тулд дээрх <b>“Админ хэсэг рүү орох”</b> товчийг дарна уу.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Захиалга" value={`${ORDERS.length}`} />
        <Stat label="Хүслийн жагсаалт" value="3" />
        <Stat label="Урамшууллын оноо" value="1,240" />
      </div>

      <div className="mt-8 flex gap-1 border-b text-sm">
        {(
          [
            ["orders", "Захиалга"],
            ["wishlist", "Хүслийн жагсаалт"],
            ["profile", "Тохиргоо"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={classNames(
              "px-4 py-2 font-medium",
              tab === k ? "border-b-2 border-foreground" : "text-muted"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "orders" && (
          <ul className="space-y-3">
            {ORDERS.map((o) => (
              <li key={o.id} className="rounded-lg border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold">{o.id}</p>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold">
                    {STATUS_LABEL[o.status]}
                  </span>
                  <span className="font-semibold">{formatMNT(o.total)}</span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {o.items.map((i) => `${i.productName} ×${i.qty}`).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
        {tab === "wishlist" && (
          <div className="py-12 text-center text-muted">
            <p>Таны хүслийн жагсаалт хоосон байна.</p>
            <Link href="/shop" className="mt-3 inline-block text-accent-dark underline">
              Дэлгүүр үзэх
            </Link>
          </div>
        )}
        {tab === "profile" && (
          <div className="max-w-md space-y-3">
            <input
              defaultValue={profile.full_name}
              placeholder="Нэр"
              className="w-full rounded-md border bg-surface px-3 py-2.5 text-sm"
            />
            <input
              defaultValue={profile.email ?? ""}
              disabled
              className="w-full rounded-md border bg-background px-3 py-2.5 text-sm text-muted"
            />
            <input
              defaultValue={profile.phone ?? ""}
              placeholder="Утас"
              className="w-full rounded-md border bg-surface px-3 py-2.5 text-sm"
            />
            <button className="rounded-md bg-foreground px-6 py-2.5 text-sm font-semibold text-white">
              Хадгалах
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold">{value}</p>
    </div>
  );
}
