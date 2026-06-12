"use client";

import { useState } from "react";
import { formatMNT, classNames } from "@/lib/utils";
import { ProductImage } from "@/components/ProductImage";

const TIER_COLOR: Record<string, string> = {
  Bronze: "bg-amber-100 text-amber-700",
  Silver: "bg-gray-200 text-gray-700",
  Gold: "bg-accent/25 text-accent-dark",
  Platinum: "bg-foreground text-white",
};

function tier(spent: number) {
  if (spent >= 500000) return "Platinum";
  if (spent >= 300000) return "Gold";
  if (spent >= 100000) return "Silver";
  return "Bronze";
}

export type OrderItem = {
  productName: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  qty: number;
  unitPrice: number;
  subtotal: number;
  image: string | null;
};

export type CustomerOrder = {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  shippingFee: number;
  address: string;
  items: OrderItem[];
};

export type Customer = {
  email: string;
  name: string;
  phone: string;
  orders: CustomerOrder[];
  totalSpent: number;
  orderCount: number;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    unpaid: "bg-yellow-100 text-yellow-700",
    pending: "bg-gray-100 text-gray-600",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const label: Record<string, string> = {
    paid: "Төлсөн",
    unpaid: "Хүлээгдэж буй",
    pending: "Хүлээгдэж буй",
    processing: "Боловсруулж буй",
    shipped: "Илгээсэн",
    delivered: "Хүргэгдсэн",
    cancelled: "Цуцлагдсан",
  };
  return (
    <span className={classNames("rounded-full px-2 py-0.5 text-[11px] font-semibold", map[status] ?? "bg-gray-100 text-gray-600")}>
      {label[status] ?? status}
    </span>
  );
}

function CustomerDrawer({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const t = tier(customer.totalSpent);
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-5 py-4">
          <div>
            <h2 className="font-serif text-lg font-bold">{customer.name}</h2>
            <p className="text-xs text-muted">{customer.email}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-surface text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 space-y-5 p-5">
          {/* Summary */}
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border bg-surface px-4 py-3 text-center flex-1">
              <p className="text-xs text-muted">Захиалга</p>
              <p className="font-bold text-xl">{customer.orderCount}</p>
            </div>
            <div className="rounded-xl border bg-surface px-4 py-3 text-center flex-1">
              <p className="text-xs text-muted">Нийт зарцуулсан</p>
              <p className="font-bold text-xl">{formatMNT(customer.totalSpent)}</p>
            </div>
            <div className="rounded-xl border bg-surface px-4 py-3 text-center flex-1">
              <p className="text-xs text-muted">Түвшин</p>
              <span className={classNames("rounded-full px-2.5 py-0.5 text-xs font-semibold", TIER_COLOR[t])}>{t}</span>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border bg-surface p-4 space-y-1 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Холбоо барих</p>
            <p><span className="text-muted">Утас:</span> <span className="font-medium">{customer.phone || "—"}</span></p>
            <p><span className="text-muted">И-мэйл:</span> <span className="font-medium">{customer.email}</span></p>
          </div>

          {/* Orders */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Захиалгын түүх</p>
            <div className="space-y-3">
              {customer.orders.length === 0 && (
                <p className="text-sm text-muted">Захиалга байхгүй</p>
              )}
              {customer.orders.map((order) => (
                <div key={order.id} className="rounded-xl border bg-surface p-4 space-y-3">
                  {/* Order header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-bold">{order.id}</p>
                      <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString("mn-MN")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={order.paymentStatus} />
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="rounded-lg bg-background px-3 py-2 text-xs text-muted flex gap-1.5 items-start">
                    <span>📍</span>
                    <span>{order.address || "Хаяг бүртгэгдээгүй"}</span>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {item.image ? (
                          <div className="h-14 w-12 shrink-0 overflow-hidden rounded-md border">
                            <ProductImage seed={item.image} label={item.productName} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-14 w-12 shrink-0 rounded-md border bg-border/20 flex items-center justify-center text-xl">👕</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug truncate">{item.productName}</p>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {item.size && (
                              <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold">
                                {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold">
                                {item.color}
                              </span>
                            )}
                            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-dark">
                              × {item.qty}
                            </span>
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-bold">{formatMNT(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between border-t pt-2 text-sm">
                    <span className="text-muted">Нийт</span>
                    <span className="font-bold">{formatMNT(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [selected, setSelected] = useState<Customer | null>(null);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Хэрэглэгч</h1>
      <p className="text-sm text-muted">{customers.length} хэрэглэгч</p>

      {/* Tier summary */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {(["Bronze", "Silver", "Gold", "Platinum"] as const).map((t) => (
          <div key={t} className="rounded-xl border bg-surface p-4">
            <span className={classNames("rounded-full px-2.5 py-0.5 text-xs font-semibold", TIER_COLOR[t])}>{t}</span>
            <p className="mt-2 font-serif text-2xl font-bold">{customers.filter((c) => tier(c.totalSpent) === t).length}</p>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="mt-5 space-y-3 md:hidden">
        {customers.map((c) => (
          <button key={c.email} onClick={() => setSelected(c)} className="w-full rounded-xl border bg-surface p-4 text-left hover:border-foreground/30 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted">{c.email}</p>
                <p className="text-xs text-muted">{c.phone}</p>
              </div>
              <span className={classNames("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", TIER_COLOR[tier(c.totalSpent)])}>
                {tier(c.totalSpent)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted">{c.orderCount} захиалга</span>
              <span className="font-semibold">{formatMNT(c.totalSpent)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop table */}
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
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((c) => (
              <tr key={c.email} className="hover:bg-background/50 cursor-pointer" onClick={() => setSelected(c)}>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.email}</td>
                <td className="px-4 py-3 text-muted">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-center">{c.orderCount}</td>
                <td className="px-4 py-3 text-right font-medium">{formatMNT(c.totalSpent)}</td>
                <td className="px-4 py-3">
                  <span className={classNames("rounded-full px-2.5 py-0.5 text-xs font-semibold", TIER_COLOR[tier(c.totalSpent)])}>
                    {tier(c.totalSpent)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted text-xs">Дэлгэрэнгүй →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
