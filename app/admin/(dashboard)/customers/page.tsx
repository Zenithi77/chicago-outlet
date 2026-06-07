"use client";

import { ORDERS } from "@/lib/data/orders";
import { formatMNT, classNames } from "@/lib/utils";

const TIER_COLOR: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-700",
  Silver: "bg-gray-200 text-gray-700",
  Gold: "bg-accent/25 text-accent-dark",
  Platinum: "bg-foreground text-white",
};

export default function AdminCustomers() {
  // Derive customers from demo orders
  const map = new Map<string, { name: string; email: string; phone: string; orders: number; spent: number }>();
  ORDERS.forEach((o) => {
    const k = o.customer.email;
    const cur = map.get(k) ?? { name: o.customer.name, email: o.customer.email, phone: o.customer.phone, orders: 0, spent: 0 };
    cur.orders += 1;
    if (o.paymentStatus === "paid") cur.spent += o.total;
    map.set(k, cur);
  });
  const customers = [...map.values()].sort((a, b) => b.spent - a.spent);

  const tier = (spent: number) =>
    spent >= 500000 ? "Platinum" : spent >= 300000 ? "Gold" : spent >= 100000 ? "Silver" : "Bronze";

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Хэрэглэгч</h1>
      <p className="text-sm text-muted">{customers.length} хэрэглэгч</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {(["Bronze", "Silver", "Gold", "Platinum"] as const).map((t) => (
          <div key={t} className="rounded-xl border bg-surface p-4">
            <span className={classNames("rounded-full px-2.5 py-0.5 text-xs font-semibold", TIER_COLOR[t])}>{t}</span>
            <p className="mt-2 font-serif text-2xl font-bold">{customers.filter((c) => tier(c.spent) === t).length}</p>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="mt-5 space-y-3 md:hidden">
        {customers.map((c) => (
          <div key={c.email} className="rounded-xl border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted">{c.email}</p>
                <p className="text-xs text-muted">{c.phone}</p>
              </div>
              <span className={classNames("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", TIER_COLOR[tier(c.spent)])}>
                {tier(c.spent)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted">{c.orders} захиалга</span>
              <span className="font-semibold">{formatMNT(c.spent)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table (desktop) */}
      <div className="mt-5 hidden overflow-x-auto rounded-xl border bg-surface md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-background text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Нэр</th>
              <th className="px-4 py-3">И-мэйл</th>
              <th className="px-4 py-3">Утас</th>
              <th className="px-4 py-3 text-center">Захиалга</th>
              <th className="px-4 py-3 text-right">Нийт зарцуулсан</th>
              <th className="px-4 py-3">Түвшин</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((c) => (
              <tr key={c.email} className="hover:bg-background/50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.email}</td>
                <td className="px-4 py-3 text-muted">{c.phone}</td>
                <td className="px-4 py-3 text-center">{c.orders}</td>
                <td className="px-4 py-3 text-right font-medium">{formatMNT(c.spent)}</td>
                <td className="px-4 py-3">
                  <span className={classNames("rounded-full px-2.5 py-0.5 text-xs font-semibold", TIER_COLOR[tier(c.spent)])}>
                    {tier(c.spent)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
