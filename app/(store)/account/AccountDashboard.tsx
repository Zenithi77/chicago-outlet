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
