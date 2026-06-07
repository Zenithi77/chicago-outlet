"use client";

import { useEffect, useMemo, useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { finalPrice, formatMNT, classNames } from "@/lib/utils";
import {
  createProduct,
  updateProductFields,
  toggleProductActive,
  type ProductActionState,
} from "./actions";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  category: string;
  gender: string;
  price: number;
  discountPercent: number;
  totalStock: number;
  isActive: boolean;
  images: string[];
  collection: string;
};

type Cat = { name: string; nameMn: string };

export function ProductsClient({
  initial,
  categories,
  loadError,
}: {
  initial: ProductRow[];
  categories: Cat[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const [isPending, startTransition] = useTransition();

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const filtered = useMemo(
    () =>
      initial.filter((r) => {
        if (
          search &&
          !r.name.toLowerCase().includes(search.toLowerCase()) &&
          !r.sku.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        if (catFilter && r.category !== catFilter) return false;
        if (stockFilter === "out" && r.totalStock > 0) return false;
        if (stockFilter === "low" && (r.totalStock === 0 || r.totalStock > 5))
          return false;
        if (stockFilter === "in" && r.totalStock <= 5) return false;
        return true;
      }),
    [initial, search, catFilter, stockFilter]
  );

  const persist = (
    fn: () => Promise<ProductActionState>,
    okMsg?: string
  ) =>
    startTransition(async () => {
      const res = await fn();
      if (res?.ok) {
        notify(okMsg ?? res.message);
        router.refresh();
      } else if (res && !res.ok) {
        notify(res.error);
      }
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Бараа</h1>
          <p className="text-sm text-muted">
            {filtered.length} бараа{isPending && " · хадгалж байна…"}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
        >
          {showForm ? "Хаах" : "+ Шинэ бараа"}
        </button>
      </div>

      {loadError && (
        <p className="mt-4 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          Бараа уншихад алдаа гарлаа: {loadError}. Supabase тохиргоо болон schema-аа
          шалгана уу.
        </p>
      )}

      {showForm && (
        <ProductForm
          categories={categories}
          onDone={(msg) => {
            setShowForm(false);
            notify(msg);
            router.refresh();
          }}
        />
      )}

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр эсвэл SKU хайх..."
          className="rounded-md border bg-surface px-3 py-2 text-sm outline-none"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-md border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Бүх ангилал</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.nameMn}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="rounded-md border bg-surface px-3 py-2 text-sm"
        >
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
                      <ProductImage
                        seed={r.images[0] ?? r.sku}
                        label={r.name}
                        className="h-full w-full"
                      />
                    </div>
                    <span className="font-medium">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{r.sku}</td>
                <td className="px-4 py-3">{r.category}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    defaultValue={r.price}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== r.price)
                        persist(() => updateProductFields(r.id, { price: v }));
                    }}
                    className="w-24 rounded border bg-background px-2 py-1 text-sm"
                  />
                  {r.discountPercent > 0 && (
                    <span className="ml-1 text-xs text-accent-dark">
                      → {formatMNT(finalPrice(r))}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    defaultValue={r.totalStock}
                    onBlur={(e) => {
                      const v = Math.max(0, Number(e.target.value));
                      if (v !== r.totalStock)
                        persist(() =>
                          updateProductFields(r.id, { total_stock: v })
                        );
                    }}
                    className={classNames(
                      "w-16 rounded border bg-background px-2 py-1 text-sm",
                      r.totalStock === 0 && "text-danger",
                      r.totalStock > 0 && r.totalStock <= 5 && "text-accent-dark"
                    )}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      persist(() => toggleProductActive(r.id, !r.isActive))
                    }
                    className={classNames(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      r.isActive
                        ? "bg-success/15 text-success"
                        : "bg-border text-muted"
                    )}
                  >
                    {r.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loadError && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  Бараа алга. “+ Шинэ бараа” дарж нэмнэ үү.
                </td>
              </tr>
            )}
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

function ProductForm({
  categories,
  onDone,
}: {
  categories: Cat[];
  onDone: (msg: string) => void;
}) {
  const [state, action, pending] = useActionState<ProductActionState, FormData>(
    createProduct,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onDone(state.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const field = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  const lbl = "mb-1 block text-xs font-medium";

  return (
    <form
      action={action}
      className="mt-5 grid gap-4 rounded-xl border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <label className="block">
        <span className={lbl}>Барааны нэр *</span>
        <input name="name" required className={field} />
      </label>
      <label className="block">
        <span className={lbl}>SKU (хоосон бол автоматаар)</span>
        <input name="sku" placeholder="CO-2025-0001" className={field} />
      </label>
      <label className="block">
        <span className={lbl}>Ангилал</span>
        <select name="category" className={field} defaultValue={categories[0]?.name}>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.nameMn}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={lbl}>Дэд ангилал</span>
        <input name="subcategory" placeholder="Shirts" className={field} />
      </label>
      <label className="block">
        <span className={lbl}>Хүйс</span>
        <select name="gender" className={field} defaultValue="unisex">
          <option value="men">Эрэгтэй</option>
          <option value="women">Эмэгтэй</option>
          <option value="unisex">Юнисекс</option>
          <option value="kids">Хүүхэд</option>
        </select>
      </label>
      <label className="block">
        <span className={lbl}>Загвар (fit)</span>
        <select name="fit" className={field} defaultValue="regular">
          <option value="slim">Slim</option>
          <option value="regular">Regular</option>
          <option value="relaxed">Relaxed</option>
          <option value="oversized">Oversized</option>
        </select>
      </label>

      <label className="block">
        <span className={lbl}>Үнэ (₮) *</span>
        <input name="price" type="number" min={0} required className={field} />
      </label>
      <label className="block">
        <span className={lbl}>Хямдрал (%)</span>
        <input
          name="discount_percent"
          type="number"
          min={0}
          max={100}
          defaultValue={0}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>Нийт нөөц (хоосон бол өнгөнөөс)</span>
        <input name="total_stock" type="number" min={0} className={field} />
      </label>

      <label className="block">
        <span className={lbl}>Хэмжээнүүд (таслалаар)</span>
        <input name="sizes" placeholder="S, M, L, XL" className={field} />
      </label>
      <label className="block">
        <span className={lbl}>Зургийн seed/URL (таслалаар)</span>
        <input name="images" placeholder="oxford-1, oxford-2" className={field} />
      </label>
      <label className="block">
        <span className={lbl}>Таг (таслалаар)</span>
        <input name="tags" placeholder="classic, office" className={field} />
      </label>

      <label className="block">
        <span className={lbl}>Материал</span>
        <input name="material" placeholder="100% Cotton" className={field} />
      </label>
      <label className="block">
        <span className={lbl}>Цуглуулга</span>
        <input name="collection" placeholder="Urban Essentials" className={field} />
      </label>
      <label className="block">
        <span className={lbl}>Улирал</span>
        <input name="season" placeholder="all-season" className={field} />
      </label>

      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Өнгөнүүд — мөр бүрт “Нэр|#hex|нөөц”</span>
        <textarea
          name="colors"
          rows={3}
          placeholder={"White|#F7F7F4|14\nNavy|#1F2A44|9"}
          className={field}
        />
      </label>

      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Богино тайлбар</span>
        <input name="short_description" className={field} />
      </label>
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Дэлгэрэнгүй тайлбар</span>
        <textarea name="description" rows={3} className={field} />
      </label>
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Арчилгаа</span>
        <input name="care_instructions" className={field} />
      </label>

      <div className="flex flex-wrap items-center gap-5 sm:col-span-2 lg:col-span-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked /> Идэвхтэй
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" /> Онцлох
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_new_arrival" /> Шинэ бараа
        </label>
      </div>

      {state && !state.ok && (
        <p className="text-sm text-danger sm:col-span-2 lg:col-span-3">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2 lg:col-span-3">
        <button
          disabled={pending}
          className="rounded-md bg-foreground px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent hover:text-foreground disabled:opacity-60"
        >
          {pending ? "Хадгалж байна…" : "Бараа хадгалах"}
        </button>
      </div>
    </form>
  );
}
