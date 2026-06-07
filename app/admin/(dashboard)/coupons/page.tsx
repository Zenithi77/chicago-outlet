"use client";

import { useState } from "react";
import { COUPONS } from "@/lib/data/orders";
import type { Coupon } from "@/lib/types";
import { classNames } from "@/lib/utils";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(COUPONS.map((c) => ({ ...c })));
  const [show, setShow] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [err, setErr] = useState("");

  const toggle = (c: string) =>
    setCoupons((cs) => cs.map((x) => (x.code === c ? { ...x, isActive: !x.isActive } : x)));

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const upper = code.trim().toUpperCase();
    if (!upper || !value) return;
    if (coupons.some((c) => c.code === upper)) {
      setErr("Энэ код аль хэдийн байна.");
      return;
    }
    setCoupons((cs) => [
      {
        code: upper,
        type,
        value: Number(value),
        minOrder: Number(minOrder) || 0,
        maxUses: null,
        usedCount: 0,
        expiresAt: null,
        isActive: true,
        appliesTo: "all",
      },
      ...cs,
    ]);
    setCode(""); setValue(""); setMinOrder(""); setErr(""); setShow(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Купон & Урамшуулал</h1>
          <p className="text-sm text-muted">{coupons.length} купон</p>
        </div>
        <button onClick={() => setShow((v) => !v)} className="rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent hover:text-foreground">
          {show ? "Хаах" : "+ Шинэ купон"}
        </button>
      </div>

      {show && (
        <form onSubmit={create} className="mt-5 grid gap-4 rounded-xl border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Код *</span>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER25" className="w-full rounded-md border bg-background px-3 py-2 text-sm uppercase" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Төрөл</span>
            <select value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="percent">Хувь (%)</option>
              <option value="fixed">Тогтмол (₮)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Утга *</span>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Доод дүн (₮)</span>
            <input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </label>
          {err && <p className="text-sm text-danger sm:col-span-2 lg:col-span-4">{err}</p>}
          <div className="sm:col-span-2 lg:col-span-4">
            <button className="rounded-md bg-foreground px-6 py-2.5 text-sm font-semibold text-white">Купон үүсгэх</button>
          </div>
        </form>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((c) => (
          <div key={c.code} className="rounded-xl border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-lg font-bold">{c.code}</p>
                <p className="text-sm text-muted">
                  {c.type === "percent" ? `${c.value}% хямдрал` : `₮${c.value.toLocaleString()} хямдрал`}
                </p>
              </div>
              <button
                onClick={() => toggle(c.code)}
                className={classNames("rounded-full px-3 py-1 text-xs font-semibold", c.isActive ? "bg-success/15 text-success" : "bg-border text-muted")}
              >
                {c.isActive ? "Идэвхтэй" : "Идэвхгүй"}
              </button>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted">
              <p>Доод дүн: {c.minOrder ? `₮${c.minOrder.toLocaleString()}` : "Байхгүй"}</p>
              <p>Ашигласан: {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</p>
              <p>Дуусах: {c.expiresAt ? c.expiresAt.slice(0, 10) : "Хязгааргүй"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
