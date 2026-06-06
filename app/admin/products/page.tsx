"use client";

import { useMemo, useState } from "react";
import { PRODUCTS } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/data/categories";
import type { Product } from "@/lib/types";
import { finalPrice, formatMNT, classNames } from "@/lib/utils";
import { ProductImage } from "@/components/ProductImage";

type Row = Pick<Product, "id" | "name" | "category" | "gender" | "price" | "discountPercent" | "totalStock" | "isActive" | "images" | "collection">;

export default function AdminProducts() {
  const [rows, setRows] = useState<Row[]>(PRODUCTS.map((p) => ({ ...p })));
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
        if (catFilter && r.category !== catFilter) return false;
        if (stockFilter === "out" && r.totalStock > 0) return false;
        if (stockFilter === "low" && (r.totalStock === 0 || r.totalStock > 5)) return false;
        if (stockFilter === "in" && r.totalStock <= 5) return false;
        return true;
      }),
    [rows, search, catFilter, stockFilter]
  );

  const update = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2000);
  };

  const addProduct = (data: { name: string; category: string; price: number; stock: number }) => {
    const seq = String(rows.length + 1).padStart(4, "0");
    const id = `CO-2025-${seq}`;
    setRows((rs) => [
      {
        id,
        name: data.name,
        category: data.category,
        gender: "unisex",
        price: data.price,
        discountPercent: 0,
        totalStock: data.stock,
        isActive: true,
        images: [data.name.toLowerCase().replace(/\s/g, "-")],
        collection: "New Arrivals",
      },
      ...rs,
    ]);
    setShowForm(false);
    notify(`${id} нэмэгдлээ`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Бараа</h1>
          <p className="text-sm text-muted">{filtered.length} бараа</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
        >
          {showForm ? "Хаах" : "+ Шинэ бараа"}
        </button>
      </div>

      {showForm && <ProductForm onSubmit={addProduct} />}

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр эсвэл SKU хайх..."
          className="rounded-md border bg-surface px-3 py-2 text-sm outline-none"
        />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="rounded-md border bg-surface px-3 py-2 text-sm">
          <option value="">Бүх ангилал</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{c.nameMn}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="rounded-md border bg-surface px-3 py-2 text-sm">
          <option value="">Бүх нөөц</option>
          <option value="in">Бэлэн</option>
          <option value="low">Цөөн (≤5)</option>
          <option value="out">Дууссан</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b bg-background text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Бараа</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Ангилал</th>
              <th className="px-4 py-3">Үнэ</th>
              <th className="px-4 py-3">Нөөц</th>
              <th className="px-4 py-3">Төлөв</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-background/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-9 overflow-hidden rounded">
                      <ProductImage seed={r.images[0] ?? r.id} label={r.name} className="h-full w-full" />
                    </div>
                    <span className="font-medium">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{r.id}</td>
                <td className="px-4 py-3">{r.category}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={r.price}
                    onChange={(e) => update(r.id, { price: Number(e.target.value) })}
                    className="w-24 rounded border bg-background px-2 py-1 text-sm"
                  />
                  {r.discountPercent > 0 && (
                    <span className="ml-1 text-xs text-accent-dark">→ {formatMNT(finalPrice(r))}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={r.totalStock}
                    onChange={(e) => update(r.id, { totalStock: Math.max(0, Number(e.target.value)) })}
                    className={classNames(
                      "w-16 rounded border bg-background px-2 py-1 text-sm",
                      r.totalStock === 0 && "text-danger",
                      r.totalStock > 0 && r.totalStock <= 5 && "text-accent-dark"
                    )}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => update(r.id, { isActive: !r.isActive })}
                    className={classNames(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      r.isActive ? "bg-success/15 text-success" : "bg-border text-muted"
                    )}
                  >
                    {r.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-md bg-foreground px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function ProductForm({ onSubmit }: { onSubmit: (d: { name: string; category: string; price: number; stock: number }) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name || !price) return;
        onSubmit({ name, category, price: Number(price), stock: Number(stock) || 0 });
      }}
      className="mt-5 grid gap-4 rounded-xl border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Барааны нэр *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Ангилал *</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Үнэ (₮) *</span>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Нөөц</span>
        <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </label>
      <div className="sm:col-span-2 lg:col-span-4">
        <button className="rounded-md bg-foreground px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent hover:text-foreground">
          Бараа хадгалах
        </button>
      </div>
    </form>
  );
}
