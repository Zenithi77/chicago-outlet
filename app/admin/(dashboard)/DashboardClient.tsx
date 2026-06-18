"use client";

import { formatMNT, formatDate } from "@/lib/utils";

export type DashboardData = {
  revenue: number;
  orderCount: number;
  paidCount: number;
  aov: number;
  pending: number;
  skuCount: number;
  stockValue: number;
  byCat: Record<string, number>;
  topSellers: { name: string; qty: number; rev: number }[];
  lowStock: { id: string; name: string; totalStock: number }[];
  outStock: { id: string; name: string; totalStock: number }[];
  recentOrders: { id: string; customer: string; createdAt: string; total: number }[];
};

export function DashboardClient({ data }: { data: DashboardData }) {
  const {
    revenue, orderCount, paidCount, aov, pending, skuCount, stockValue,
    byCat, topSellers, lowStock, outStock, recentOrders,
  } = data;

  const maxCat = Math.max(...Object.values(byCat), 1);

  return (
    <div>
      <h1 className="font-serif text-xl font-bold sm:text-2xl">Хяналтын самбар</h1>
      <p className="text-sm text-muted">Борлуулалт болон агуулахын тойм</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Нийт орлого" value={formatMNT(revenue)} sub={`${paidCount} төлөгдсөн`} />
        <Kpi label="Захиалга" value={`${orderCount}`} sub={`${pending} хүлээгдэж буй`} />
        <Kpi label="Дундаж захиалга" value={formatMNT(aov)} sub="AOV" />
        <Kpi label="Агуулахын үнэлгээ" value={formatMNT(stockValue)} sub={`${skuCount} SKU`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Ангилал тус бүрийн орлого">
          {Object.keys(byCat).length === 0 ? (
            <p className="text-sm text-muted">Мэдээлэл алга.</p>
          ) : (
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
          )}
        </Card>

        <Card title="Шилдэг борлуулалттай бараа">
          {topSellers.length === 0 ? (
            <p className="text-sm text-muted">Мэдээлэл алга.</p>
          ) : (
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
                  <tr key={s.name + i}>
                    <td className="py-2 text-muted">{i + 1}</td>
                    <td className="py-2">{s.name}</td>
                    <td className="py-2 text-right">{s.qty}</td>
                    <td className="py-2 text-right font-medium">{formatMNT(s.rev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

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

        <Card title="Сүүлийн захиалга">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted">Захиалга алга.</p>
          ) : (
            <ul className="divide-y text-sm">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-mono text-xs font-semibold">{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted">{o.customer} · {formatDate(o.createdAt)}</p>
                  </div>
                  <span className="font-medium">{formatMNT(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border bg-surface p-4 transition hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.25)] sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-xs">{label}</p>
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
