"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { formatMNT, classNames } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/auth";
import { logout, updateProfile } from "./actions";
import { DashboardIcon, CheckIcon } from "@/components/Icons";

type Order = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: { product_name: string; qty: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  processing: "Боловсруулж буй",
  shipped: "Илгээгдсэн",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
  refunded: "Буцаагдсан",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
  refunded: "bg-gray-100 text-gray-600",
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
  orders = [],
}: {
  profile: Profile;
  staff: boolean;
  orders?: Order[];
}) {
  const [tab, setTab] = useState<"orders" | "profile">("orders");
  const name = profile.full_name || profile.email?.split("@")[0] || "Зочин";
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, undefined);

  return (
    <div className="container-page py-10">
      {/* Header */}
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
              <DashboardIcon className="h-4 w-4" /> Админ хэсэг
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

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b text-sm">
        {(
          [
            ["orders", `Захиалга (${orders.length})`],
            ["profile", "Тохиргоо"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={classNames(
              "px-4 py-2.5 font-medium transition",
              tab === k ? "border-b-2 border-foreground text-foreground" : "text-muted hover:text-foreground"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === "orders" && (
        <div>
          {orders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted">Танд одоогоор захиалга байхгүй байна.</p>
              <Link href="/shop" className="mt-3 inline-block text-sm text-accent-dark underline">
                Дэлгүүр үзэх
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border bg-surface p-5 transition hover:shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold tracking-wider">{o.id}</p>
                      <p className="text-xs text-muted">
                        {new Date(o.created_at).toLocaleDateString("mn-MN", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={classNames("rounded-full px-3 py-1 text-xs font-semibold", STATUS_COLOR[o.status] ?? "bg-background text-muted")}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                    <span className="font-serif text-base font-bold">{formatMNT(o.total)}</span>
                  </div>
                  {o.items.length > 0 && (
                    <p className="mt-2 text-sm text-muted">
                      {o.items.map((i) => `${i.product_name} ×${i.qty}`).join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Profile tab */}
      {tab === "profile" && (
        <form action={profileAction} className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Бүтэн нэр</label>
            <input
              name="full_name"
              defaultValue={profile.full_name ?? ""}
              placeholder="Нэр"
              className="w-full rounded-lg border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">И-мэйл</label>
            <input
              value={profile.email ?? ""}
              disabled
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-muted"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Утасны дугаар</label>
            <input
              name="phone"
              defaultValue={profile.phone ?? ""}
              placeholder="8812XXXX"
              className="w-full rounded-lg border bg-surface px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
          </div>
          {profileState?.error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{profileState.error}</p>
          )}
          {profileState?.message && (
            <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              <CheckIcon className="h-4 w-4" /> {profileState.message}
            </p>
          )}
          <button
            type="submit"
            disabled={profilePending}
            className="rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50"
          >
            {profilePending ? "Хадгалж байна…" : "Хадгалах"}
          </button>
        </form>
      )}
    </div>
  );
}

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
