"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { formatMNT, classNames } from "@/lib/utils";
import { setDiscount, clearDiscount } from "./actions";

export type DiscountProduct = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  price: number;
  discountPercent: number;
  discountExpiresAt: string | null; // ISO timestamp
  image: string;
  isActive: boolean;
};

/** Convert an ISO datetime → value usable by <input type="datetime-local"> */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isExpired(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export function DiscountsClient({
  products,
  loadError,
}: {
  products: DiscountProduct[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "with" | "expired">("all");
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 2500);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) {
        return false;
      }
      if (filter === "with" && p.discountPercent <= 0) return false;
      if (filter === "expired" && !isExpired(p.discountExpiresAt)) return false;
      return true;
    });
  }, [products, search, filter]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Хямдрал</h1>
          <p className="text-sm text-muted">
            Бараа бүрд хямдралын хувь, дуусах хугацааг тохируулна. Хугацаа дуусмагц
            дэлгүүрт хямдрал автоматаар хасагдана.
          </p>
        </div>
      </div>

      {loadError && (
        <p className="mb-4 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          Бараа уншихад алдаа гарлаа: {loadError}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр эсвэл SKU хайх…"
          className="min-w-[220px] flex-1 rounded-md border bg-surface px-3 py-2 text-sm outline-none"
        />
        <div className="flex gap-1 rounded-lg border bg-surface p-1">
          {(
            [
              { v: "all", label: "Бүгд" },
              { v: "with", label: "Хямдралтай" },
              { v: "expired", label: "Хугацаа дууссан" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.v}
              onClick={() => setFilter(opt.v)}
              className={classNames(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                filter === opt.v ? "bg-foreground text-white" : "text-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">{filtered.length} бараа</span>
      </div>

      {toast && (
        <p
          className={classNames(
            "mb-3 rounded-md px-4 py-2 text-sm",
            toast.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}
        >
          {toast.text}
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((p) => (
          <DiscountRow key={p.id} product={p} onSaved={notify} onChanged={() => router.refresh()} />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-md border bg-surface px-4 py-10 text-center text-sm text-muted">
            Бараа олдсонгүй.
          </p>
        )}
      </div>
    </div>
  );
}

function DiscountRow({
  product,
  onSaved,
  onChanged,
}: {
  product: DiscountProduct;
  onSaved: (ok: boolean, text: string) => void;
  onChanged: () => void;
}) {
  const [percent, setPercent] = useState<number>(product.discountPercent);
  const [expires, setExpires] = useState<string>(isoToLocalInput(product.discountExpiresAt));
  const [pending, startTransition] = useTransition();

  const expired = isExpired(product.discountExpiresAt) && product.discountPercent > 0;
  const finalPrice = Math.round(product.price * (1 - percent / 100));

  const save = () => {
    startTransition(async () => {
      const res = await setDiscount(product.id, percent, expires || null);
      if (res.ok) {
        onSaved(true, `${product.name}: ${percent > 0 ? `${percent}% хямдрал` : "хямдрал хасагдлаа"}`);
        onChanged();
      } else {
        onSaved(false, res.error);
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      const res = await clearDiscount(product.id);
      if (res.ok) {
        setPercent(0);
        setExpires("");
        onSaved(true, `${product.name}: хямдрал хасагдлаа`);
        onChanged();
      } else {
        onSaved(false, res.error);
      }
    });
  };

  return (
    <div
      className={classNames(
        "flex flex-col gap-3 rounded-xl border bg-surface p-3 md:flex-row md:items-center",
        !product.isActive && "opacity-60"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-14 w-12 shrink-0 overflow-hidden rounded">
          <ProductImage seed={product.image || product.sku} label={product.name} className="h-full w-full" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="font-mono text-[11px] text-muted">{product.sku}</p>
          <p className="text-[11px] text-muted">
            {product.category}
            {product.subcategory ? ` · ${product.subcategory}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-muted">Үнэ</p>
          <p className="text-sm font-medium">{formatMNT(product.price)}</p>
        </div>

        <div>
          <p className="text-[11px] text-muted">Хямдрал %</p>
          <input
            type="number"
            min={0}
            max={95}
            value={percent}
            onChange={(e) => setPercent(Math.min(95, Math.max(0, Number(e.target.value) || 0)))}
            className="w-20 rounded-md border bg-background px-2 py-1.5 text-sm outline-none"
          />
        </div>

        <div>
          <p className="text-[11px] text-muted">Дуусах огноо</p>
          <input
            type="datetime-local"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none"
          />
        </div>

        <div className="text-right">
          <p className="text-xs text-muted">Эцсийн үнэ</p>
          <p className="text-sm font-semibold">
            {percent > 0 ? formatMNT(finalPrice) : "—"}
          </p>
        </div>

        {expired && (
          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
            Хугацаа дууссан
          </span>
        )}

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={pending}
            className="rounded-md bg-foreground px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 hover:opacity-80"
          >
            {pending ? "…" : "Хадгалах"}
          </button>
          {product.discountPercent > 0 && (
            <button
              onClick={remove}
              disabled={pending}
              className="rounded-md border border-danger/40 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger hover:text-white disabled:opacity-40"
            >
              Хасах
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
