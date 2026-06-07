"use client";

import { ORDERS } from "@/lib/data/orders";
import { PRODUCTS } from "@/lib/data/products";
import { formatMNT, formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const revenue = ORDERS.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
  const orderCount = ORDERS.length;
  const aov = orderCount ? Math.round(revenue / ORDERS.filter((o) => o.paymentStatus === "paid").length || 1) : 0;
  const pending = ORDERS.filter((o) => o.status === "pending").length;

  const lowStock = PRODUCTS.filter((p) => p.totalStock > 0 && p.totalStock <= 5);
  const outStock = PRODUCTS.filter((p) => p.totalStock <= 0);
  const stockValue = PRODUCTS.reduce((s, p) => s + p.totalStock * p.price, 0);

  // Revenue by category
  const byCat: Record<string, number> = {};
  ORDERS.forEach((o) =>
    o.items.forEach((i) => {
      const prod = PRODUCTS.find((p) => p.id === i.productId);
      const cat = prod?.category ?? "Бусад";
      byCat[cat] = (byCat[cat] ?? 0) + i.subtotal;
    })
  );
  const maxCat = Math.max(...Object.values(byCat), 1);

  // Top sellers
  const sold: Record<string, { name: string; qty: number; rev: number }> = {};
  ORDERS.forEach((o) =>
    o.items.forEach((i) => {
      if (!sold[i.productId]) sold[i.productId] = { name: i.productName, qty: 0, rev: 0 };
      sold[i.productId].qty += i.qty;
      sold[i.productId].rev += i.subtotal;
    })
  );
  const topSellers = Object.values(sold).sort((a, b) => b.rev - a.rev).slice(0, 5);

  return (
    <div>
      <h1 className="font-serif text-xl font-bold sm:text-2xl">Хяналтын самбар</h1>
      <p className="text-sm text-muted">Борлуулалт болон агуулахын тойм</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Нийт орлого" value={formatMNT(revenue)} sub="Төлөгдсөн" />
        <Kpi label="Захиалга" value={`${orderCount}`} sub={`${pending} хүлээгдэж буй`} />
        <Kpi label="Дундаж захиалга" value={formatMNT(aov)} sub="AOV" />
        <Kpi label="Агуулахын үнэлгээ" value={formatMNT(stockValue)} sub={`${PRODUCTS.length} SKU`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Revenue by category */}
        <Card title="Ангилал тус бүрийн орлого">
          <div className="space-y-3">
            {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
              <div key={cat}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{cat}</span>
                  <span className="font-medium">{formatMNT(val)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-background">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(val / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top sellers */}
        <Card title="Шилдэг борлуулалттай бараа">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="pb-2">#</th>
                <th className="pb-2">Бараа</th>
                <th className="pb-2 text-right">Тоо</th>
                <th className="pb-2 text-right">Орлого</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topSellers.map((s, i) => (
                <tr key={s.name}>
                  <td className="py-2 text-muted">{i + 1}</td>
                  <td className="py-2">{s.name}</td>
                  <td className="py-2 text-right">{s.qty}</td>
                  <td className="py-2 text-right font-medium">{formatMNT(s.rev)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Inventory alerts */}
        <Card title="Агуулахын анхааруулга">
          <div className="mb-3 flex gap-4 text-sm">
            <span className="rounded-md bg-danger/10 px-3 py-1 font-medium text-danger">
              Дууссан: {outStock.length}
            </span>
            <span className="rounded-md bg-accent/20 px-3 py-1 font-medium text-accent-dark">
              Цөөн: {lowStock.length}
            </span>
          </div>
          <ul className="space-y-2 text-sm">
            {[...outStock, ...lowStock].slice(0, 6).map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.name}</span>
                <span className={p.totalStock === 0 ? "font-semibold text-danger" : "text-accent-dark"}>
                  {p.totalStock} ширхэг
                </span>
              </li>
            ))}
            {outStock.length + lowStock.length === 0 && <li className="text-muted">Бүх бараа хангалттай.</li>}
          </ul>
        </Card>

        {/* Recent orders */}
        <Card title="Сүүлийн захиалга">
          <ul className="divide-y text-sm">
            {ORDERS.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-mono text-xs font-semibold">{o.id}</p>
                  <p className="text-xs text-muted">{o.customer.name} · {formatDate(o.createdAt)}</p>
                </div>
                <span className="font-medium">{formatMNT(o.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border bg-surface p-4 transition hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.25)] sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-xs">
        {label}
      </p>
      <p className="mt-1 font-serif text-xl font-bold sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-accent-dark">{sub}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-surface p-5 transition hover:shadow-[0_12px_30px_-20px_rgba(0,0,0,0.2)]">
      <h2 className="mb-4 font-serif text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
