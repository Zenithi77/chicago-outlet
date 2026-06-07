"use client";

import { useState } from "react";
import { ORDERS } from "@/lib/data/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { formatMNT, formatDate, classNames } from "@/lib/utils";

const STATUS: { value: OrderStatus; label: string; color: string }[] = [
  { value: "pending", label: "Хүлээгдэж буй", color: "bg-accent/20 text-accent-dark" },
  { value: "confirmed", label: "Баталгаажсан", color: "bg-blue-100 text-blue-700" },
  { value: "processing", label: "Боловсруулж буй", color: "bg-indigo-100 text-indigo-700" },
  { value: "shipped", label: "Илгээгдсэн", color: "bg-purple-100 text-purple-700" },
  { value: "delivered", label: "Хүргэгдсэн", color: "bg-success/15 text-success" },
  { value: "cancelled", label: "Цуцлагдсан", color: "bg-danger/15 text-danger" },
  { value: "refunded", label: "Буцаагдсан", color: "bg-border text-muted" },
];

const statusMeta = (s: OrderStatus) => STATUS.find((x) => x.value === s)!;

const FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: ["refunded"],
  refunded: [],
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>(ORDERS.map((o) => ({ ...o })));
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [confirm, setConfirm] = useState<{ order: Order; to: OrderStatus } | null>(null);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const changeStatus = (id: string, to: OrderStatus) => {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: to } : o)));
    setSelected((s) => (s && s.id === id ? { ...s, status: to } : s));
    setConfirm(null);
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Захиалга</h1>
      <p className="text-sm text-muted">{filtered.length} захиалга</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label={`Бүгд (${orders.length})`} />
        {STATUS.map((s) => {
          const n = orders.filter((o) => o.status === s.value).length;
          return <FilterChip key={s.value} active={filter === s.value} onClick={() => setFilter(s.value)} label={`${s.label} (${n})`} />;
        })}
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelected(o)}
            className="w-full rounded-xl border bg-surface p-4 text-left"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold">{o.id}</span>
              <span className={classNames("rounded-full px-2.5 py-1 text-xs font-semibold", statusMeta(o.status).color)}>
                {statusMeta(o.status).label}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium">{o.customer.name}</p>
            <p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} ширхэг</p>
            <div className="mt-2 flex items-center justify-between">
              <span className={classNames("rounded-full px-2 py-0.5 text-xs", o.paymentStatus === "paid" ? "bg-success/15 text-success" : "bg-accent/20 text-accent-dark")}>
                {o.paymentStatus === "paid" ? "Төлсөн" : "Хүлээгдэж буй"}
              </span>
              <span className="font-semibold">{formatMNT(o.total)}</span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-xl border bg-surface px-4 py-10 text-center text-sm text-muted">
            Захиалга алга.
          </p>
        )}
      </div>

      {/* Table (desktop) */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border bg-surface md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b bg-background text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Захиалга</th>
              <th className="px-4 py-3">Огноо</th>
              <th className="px-4 py-3">Хэрэглэгч</th>
              <th className="px-4 py-3">Бараа</th>
              <th className="px-4 py-3">Дүн</th>
              <th className="px-4 py-3">Төлбөр</th>
              <th className="px-4 py-3">Төлөв</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-background/50" onClick={() => setSelected(o)}>
                <td className="px-4 py-3 font-mono text-xs font-semibold">{o.id}</td>
                <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3">{o.customer.name}</td>
                <td className="px-4 py-3 text-muted">{o.items.reduce((n, i) => n + i.qty, 0)} ширхэг</td>
                <td className="px-4 py-3 font-medium">{formatMNT(o.total)}</td>
                <td className="px-4 py-3">
                  <span className={classNames("rounded-full px-2 py-0.5 text-xs", o.paymentStatus === "paid" ? "bg-success/15 text-success" : "bg-accent/20 text-accent-dark")}>
                    {o.paymentStatus === "paid" ? "Төлсөн" : "Хүлээгдэж буй"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={classNames("rounded-full px-2.5 py-1 text-xs font-semibold", statusMeta(o.status).color)}>
                    {statusMeta(o.status).label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelected(null)} />
          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold">{selected.id}</h2>
              <button onClick={() => setSelected(null)} className="text-xl">✕</button>
            </div>
            <span className={classNames("mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold", statusMeta(selected.status).color)}>
              {statusMeta(selected.status).label}
            </span>

            <div className="mt-5 rounded-lg border bg-background p-4 text-sm">
              <p className="font-semibold">{selected.customer.name}</p>
              <p className="text-muted">{selected.customer.phone} · {selected.customer.email}</p>
              <p className="text-muted">{selected.customer.address}</p>
            </div>

            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted">
                <tr><th className="pb-2">Бараа</th><th className="pb-2 text-center">Тоо</th><th className="pb-2 text-right">Дүн</th></tr>
              </thead>
              <tbody className="divide-y">
                {selected.items.map((i) => (
                  <tr key={`${i.sku}-${i.size}-${i.color}`}>
                    <td className="py-2">{i.productName}<span className="block text-xs text-muted">{i.color}/{i.size}</span></td>
                    <td className="py-2 text-center">{i.qty}</td>
                    <td className="py-2 text-right">{formatMNT(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <Row label="Дэд дүн" value={formatMNT(selected.subtotal)} />
              {selected.discountAmount > 0 && <Row label={`Хямдрал (${selected.couponCode})`} value={`-${formatMNT(selected.discountAmount)}`} />}
              <Row label="Хүргэлт" value={selected.shippingFee === 0 ? "Үнэгүй" : formatMNT(selected.shippingFee)} />
              <div className="flex justify-between border-t pt-2 font-bold"><span>Нийт</span><span>{formatMNT(selected.total)}</span></div>
            </div>

            <div className="mt-4 text-sm text-muted">
              <p>Төлбөр: {selected.paymentMethod} · {selected.paymentStatus}</p>
              <p>Хүргэлт: {selected.shippingMethod}{selected.trackingNumber && ` · ${selected.trackingNumber}`}</p>
              {selected.notes && <p>Тэмдэглэл: {selected.notes}</p>}
            </div>

            {/* Status actions */}
            {FLOW[selected.status].length > 0 ? (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase text-muted">Төлөв шинэчлэх</p>
                <div className="flex flex-wrap gap-2">
                  {FLOW[selected.status].map((to) => (
                    <button
                      key={to}
                      onClick={() => setConfirm({ order: selected, to })}
                      className={classNames(
                        "rounded-md px-4 py-2 text-sm font-semibold",
                        to === "cancelled" || to === "refunded"
                          ? "border border-danger text-danger hover:bg-danger/10"
                          : "bg-foreground text-white hover:bg-accent hover:text-foreground"
                      )}
                    >
                      → {statusMeta(to).label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">Энэ захиалга төгсгөлийн төлөвт байна.</p>
            )}
          </aside>
        </>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6">
            <h3 className="font-serif text-lg font-bold">Төлөв өөрчлөх үү?</h3>
            <p className="mt-2 text-sm text-muted">
              {confirm.order.id} захиалгыг <b>{statusMeta(confirm.to).label}</b> болгох гэж байна.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="rounded-md border px-4 py-2 text-sm">Болих</button>
              <button onClick={() => changeStatus(confirm.order.id, confirm.to)} className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-white">
                Тийм, өөрчлөх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={classNames("rounded-full px-3 py-1.5 text-xs font-medium", active ? "bg-foreground text-white" : "border bg-surface hover:border-foreground")}
    >
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span>{value}</span></div>;
}
