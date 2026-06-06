"use client";

import Link from "next/link";
import { useState } from "react";
import { ORDERS } from "@/lib/data/orders";
import { formatMNT, formatDate, classNames } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  processing: "Боловсруулж буй",
  shipped: "Илгээгдсэн",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
  refunded: "Буцаагдсан",
};

export default function AccountPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [tab, setTab] = useState<"orders" | "wishlist" | "profile">("orders");

  if (!loggedIn) {
    return (
      <div className="container-page flex justify-center py-16">
        <div className="w-full max-w-md rounded-xl border bg-surface p-8">
          <div className="mb-6 flex gap-2 text-sm">
            <button
              onClick={() => setMode("login")}
              className={classNames("flex-1 rounded-md py-2 font-semibold", mode === "login" ? "bg-foreground text-white" : "border")}
            >
              Нэвтрэх
            </button>
            <button
              onClick={() => setMode("register")}
              className={classNames("flex-1 rounded-md py-2 font-semibold", mode === "register" ? "bg-foreground text-white" : "border")}
            >
              Бүртгүүлэх
            </button>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); setLoggedIn(true); }}
            className="space-y-3"
          >
            {mode === "register" && (
              <input placeholder="Нэр" className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none" />
            )}
            <input type="email" placeholder="И-мэйл" required className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none" />
            <input type="password" placeholder="Нууц үг" required minLength={8} className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none" />
            <button className="w-full rounded-md bg-foreground py-3 text-sm font-semibold text-white hover:bg-accent hover:text-foreground">
              {mode === "login" ? "Нэвтрэх" : "Бүртгэл үүсгэх"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-muted">
            Demo: ямар ч мэдээллээр нэвтрэх боломжтой.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Сайн байна уу, Зочин 👋</h1>
          <p className="text-sm text-muted">Silver гишүүн · 1,240 оноо</p>
        </div>
        <button onClick={() => setLoggedIn(false)} className="text-sm text-accent-dark underline">
          Гарах
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Захиалга" value={`${ORDERS.length}`} />
        <Stat label="Хүслийн жагсаалт" value="3" />
        <Stat label="Урамшууллын оноо" value="1,240" />
      </div>

      <div className="mt-8 flex gap-1 border-b text-sm">
        {([["orders", "Захиалга"], ["wishlist", "Хүслийн жагсаалт"], ["profile", "Тохиргоо"]] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={classNames("px-4 py-2 font-medium", tab === k ? "border-b-2 border-foreground" : "text-muted")}
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
            <Link href="/shop" className="mt-3 inline-block text-accent-dark underline">Дэлгүүр үзэх</Link>
          </div>
        )}
        {tab === "profile" && (
          <div className="max-w-md space-y-3">
            <input defaultValue="Зочин" className="w-full rounded-md border bg-surface px-3 py-2.5 text-sm" />
            <input defaultValue="guest@example.mn" className="w-full rounded-md border bg-surface px-3 py-2.5 text-sm" />
            <input defaultValue="88001122" className="w-full rounded-md border bg-surface px-3 py-2.5 text-sm" />
            <button className="rounded-md bg-foreground px-6 py-2.5 text-sm font-semibold text-white">Хадгалах</button>
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
