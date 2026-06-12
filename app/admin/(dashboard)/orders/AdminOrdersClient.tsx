"use client";

import { useState, useTransition } from "react";
import { formatMNT, formatDate, classNames } from "@/lib/utils";
import { CloseIcon } from "@/components/Icons";
import { updateOrderStatus } from "./actions";

type OrderItem = {
  productName: string;
  sku: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

type Order = {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode: string;
  paymentMethod: string;
  shippingMethod: string;
  trackingNumber: string;
  notes: string;
  customer: { name: string; email: string; phone: string; address: string };
  items: OrderItem[];
};

const STATUSES = [
  { value: "pending",    label: "Хүлээгдэж буй",      color: "bg-yellow-100 text-yellow-700" },
  { value: "processing", label: "Бэлтгэж байна",       color: "bg-blue-100 text-blue-700" },
  { value: "shipped",    label: "Хүргэлтэнд гарсан",   color: "bg-purple-100 text-purple-700" },
  { value: "delivered",  label: "Хүргэгдсэн",          color: "bg-green-100 text-green-700" },
  { value: "cancelled",  label: "Цуцлагдсан",          color: "bg-red-100 text-red-700" },
];

const statusMeta = (s: string) =>
  STATUSES.find((x) => x.value === s) ?? { value: s, label: s, color: "bg-gray-100 text-gray-700" };

// What transitions are allowed from each status
const NEXT: Record<string, string[]> = {
  pending:    ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped:    ["delivered"],
  delivered:  [],
  cancelled:  [],
};

export function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const changeStatus = (orderId: string, toStatus: string) => {
    setActionError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, toStatus);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: toStatus } : o))
      );
      setSelected((s) => (s?.id === orderId ? { ...s, status: toStatus } : s));
    });
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Захиалга</h1>
      <p className="text-sm text-muted">{filtered.length} захиалга</p>

      {/* Filter chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")} label={`Бүгд (${orders.length})`} />
        {STATUSES.map((s) => {
          const n = orders.filter((o) => o.status === s.value).length;
          if (n === 0) return null;
          return (
            <Chip key={s.value} active={filter === s.value} onClick={() => setFilter(s.value)}
              label={`${s.label} (${n})`} />
          );
        })}
      </div>

      {actionError && (
        <p className="mt-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{actionError}</p>
      )}

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.length === 0 && (
          <p className="rounded-xl border bg-surface px-4 py-10 text-center text-sm text-muted">Захиалга алга.</p>
        )}
        {filtered.map((o) => (
          <button key={o.id} onClick={() => setSelected(o)}
            className="w-full rounded-xl border bg-surface p-4 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold">{o.id}</span>
              <span className={classNames("rounded-full px-2.5 py-1 text-xs font-semibold", statusMeta(o.status).color)}>
                {statusMeta(o.status).label}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium">{o.customer.name}</p>
            <p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} ширхэг</p>
            <div className="mt-2 flex items-center justify-between">
              <span className={classNames("rounded-full px-2 py-0.5 text-xs",
                o.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                {o.paymentStatus === "paid" ? "Төлсөн" : "Хүлээгдэж буй"}
              </span>
              <span className="font-semibold">{formatMNT(o.total)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border bg-surface md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b bg-background text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Захиалга</th>
              <th className="px-4 py-3">Огноо</th>
              <th className="px-4 py-3">Хэрэглэгч</th>
              <th className="px-4 py-3">Утас</th>
              <th className="px-4 py-3">Бараа</th>
              <th className="px-4 py-3">Дүн</th>
              <th className="px-4 py-3">Төлбөр</th>
              <th className="px-4 py-3">Төлөв</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">Захиалга алга.</td></tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-background/50" onClick={() => setSelected(o)}>
                <td className="px-4 py-3 font-mono text-xs font-semibold">{o.id}</td>
                <td className="px-4 py-3 text-muted">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3">{o.customer.name}</td>
                <td className="px-4 py-3 text-muted">{o.customer.phone}</td>
                <td className="px-4 py-3 text-muted">{o.items.reduce((n, i) => n + i.qty, 0)} ширхэг</td>
                <td className="px-4 py-3 font-medium">{formatMNT(o.total)}</td>
                <td className="px-4 py-3">
                  <span className={classNames("rounded-full px-2 py-0.5 text-xs",
                    o.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
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
              <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <span className={classNames("mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold", statusMeta(selected.status).color)}>
              {statusMeta(selected.status).label}
            </span>

            {/* Customer info */}
            <div className="mt-5 rounded-lg border bg-background p-4 text-sm space-y-1">
              <p className="font-semibold">{selected.customer.name}</p>
              <p className="text-muted">{selected.customer.phone}</p>
              <p className="text-muted">{selected.customer.email}</p>
              <p className="text-muted">{selected.customer.address}</p>
            </div>

            {/* Items */}
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted">
                <tr>
                  <th className="pb-2">Бараа</th>
                  <th className="pb-2 text-center">Тоо</th>
                  <th className="pb-2 text-right">Дүн</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selected.items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="py-2">
                      {i.productName}
                      <span className="block text-xs text-muted">
                        {[i.color, i.size].filter(Boolean).join(" / ")}
                      </span>
                    </td>
                    <td className="py-2 text-center">{i.qty}</td>
                    <td className="py-2 text-right">{formatMNT(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <Row label="Дэд дүн" value={formatMNT(selected.subtotal)} />
              {selected.discountAmount > 0 && (
                <Row label={`Хямдрал${selected.couponCode ? ` (${selected.couponCode})` : ""}`}
                  value={`-${formatMNT(selected.discountAmount)}`} />
              )}
              <Row label="Хүргэлт" value={selected.shippingFee === 0 ? "Үнэгүй" : formatMNT(selected.shippingFee)} />
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Нийт</span><span>{formatMNT(selected.total)}</span>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted space-y-0.5">
              <p>Төлбөр: {selected.paymentMethod} ·{" "}
                <span className={selected.paymentStatus === "paid" ? "text-green-600 font-medium" : "text-yellow-600"}>
                  {selected.paymentStatus === "paid" ? "Төлсөн" : "Хүлээгдэж буй"}
                </span>
              </p>
              {selected.notes && <p>Тэмдэглэл: {selected.notes}</p>}
            </div>

            {/* Status change buttons */}
            {(NEXT[selected.status] ?? []).length > 0 ? (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase text-muted">Төлөв шинэчлэх</p>
                <div className="flex flex-wrap gap-2">
                  {(NEXT[selected.status] ?? []).map((toStatus) => (
                    <button
                      key={toStatus}
                      disabled={pending}
                      onClick={() => changeStatus(selected.id, toStatus)}
                      className={classNames(
                        "rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
                        toStatus === "cancelled"
                          ? "border border-red-400 text-red-600 hover:bg-red-50"
                          : "bg-foreground text-white hover:opacity-80"
                      )}
                    >
                      {pending ? "…" : statusMeta(toStatus).label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted italic">Энэ захиалга төгсгөлийн төлөвт байна.</p>
            )}
          </aside>
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={classNames("rounded-full px-3 py-1.5 text-xs font-medium transition",
        active ? "bg-foreground text-white" : "border bg-surface hover:border-foreground")}>
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
