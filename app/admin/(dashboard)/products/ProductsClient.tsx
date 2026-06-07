"use client";

import { useEffect, useMemo, useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { finalPrice, formatMNT, classNames } from "@/lib/utils";
import { CameraIcon, UploadIcon, CloudIcon } from "@/components/Icons";
import {
  createProduct,
  updateProductFields,
  toggleProductActive,
  type ProductActionState,
} from "./actions";
import { BarcodeScanner } from "./BarcodeScanner";

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
          Бараа уншихад алдаа гарлаа: {loadError}. Supabase тохиргоог болон
          schema-аа шалгана уу.
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

      {/* Шүүлтүүрүүд */}
      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр эсвэл SKU хайх…"
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

      {/* Мобайл карт */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border bg-surface p-4">
            <div className="flex items-start gap-3">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded">
                <ProductImage
                  seed={r.images[0] ?? r.sku}
                  label={r.name}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name}</p>
                <p className="font-mono text-xs text-muted">{r.sku}</p>
                <p className="text-xs text-muted">{r.category}</p>
              </div>
              <button
                onClick={() => persist(() => toggleProductActive(r.id, !r.isActive))}
                className={classNames(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  r.isActive ? "bg-success/15 text-success" : "bg-border text-muted"
                )}
              >
                {r.isActive ? "Идэвхтэй" : "Идэвхгүй"}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">
                  Үнэ (₮)
                </span>
                <input
                  type="number"
                  defaultValue={r.price}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (val !== r.price)
                      persist(() => updateProductFields(r.id, { price: val }));
                  }}
                  className="w-full rounded border bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">
                  Нөөц
                </span>
                <input
                  type="number"
                  defaultValue={r.totalStock}
                  onBlur={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    if (val !== r.totalStock)
                      persist(() =>
                        updateProductFields(r.id, { total_stock: val })
                      );
                  }}
                  className={classNames(
                    "w-full rounded border bg-background px-2 py-1.5 text-sm",
                    r.totalStock === 0 && "text-danger",
                    r.totalStock > 0 && r.totalStock <= 5 && "text-accent-dark"
                  )}
                />
              </label>
            </div>
            {r.discountPercent > 0 && (
              <p className="mt-2 text-xs text-accent-dark">
                Хямдралтай үнэ: {formatMNT(finalPrice(r))}
              </p>
            )}
          </div>
        ))}
        {filtered.length === 0 && !loadError && (
          <p className="rounded-xl border bg-surface px-4 py-10 text-center text-sm text-muted">
            Бараа алга. &ldquo;+ Шинэ бараа&rdquo; дарж нэмнэ үү.
          </p>
        )}
      </div>

      {/* Хүснэгт (desktop) */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border bg-surface md:block">
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
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {r.sku}
                </td>
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
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-muted"
                >
                  Бараа алга. &ldquo;+ Шинэ бараа&rdquo; дарж нэмнэ үү.
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

  const [v, setV] = useState({
    name: "",
    sku: "",
    brand: "",
    category: categories[0]?.name ?? "",
    subcategory: "",
    gender: "unisex",
    fit: "regular",
    price: "",
    discount_percent: "0",
    total_stock: "",
    sizes: "",
    images: "",
    tags: "",
    material: "",
    collection: "",
    season: "",
    colors: "",
    short_description: "",
    description: "",
    care_instructions: "",
  });
  const set = (k: keyof typeof v, val: string) =>
    setV((p) => ({ ...p, [k]: val }));

  const [kind, setKind] = useState<"apparel" | "food" | "home" | "other">(
    "apparel"
  );
  const isApparel = kind === "apparel";

  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  type Lookup = {
    found: boolean;
    barcode?: string;
    name?: string;
    brand?: string;
    subcategory?: string;
    description?: string;
    short_description?: string;
    material?: string;
    sizes?: string[];
    colors?: { name: string; hex: string; stock: number }[];
    images?: string[];
    error?: string;
  };

  const lookup = async (codeRaw: string) => {
    const code = codeRaw.replace(/\D/g, "").trim();
    if (code.length < 6) {
      setLookupMsg({ ok: false, text: "Зөв штрих код оруулна уу." });
      return;
    }
    setLooking(true);
    setLookupMsg(null);
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`);
      const data: Lookup = await res.json();
      if (!data.found) {
        setLookupMsg({
          ok: false,
          text:
            data.error ??
            "Энэ штрих кодоор бараа олдсонгүй. Гараараа бөглөнө үү.",
        });
        return;
      }
      setV((prev) => ({
        ...prev,
        sku: prev.sku || data.barcode || prev.sku,
        name: data.name || prev.name,
        brand: data.brand || prev.brand,
        subcategory: data.subcategory || prev.subcategory,
        material: data.material || prev.material,
        sizes: data.sizes?.length ? data.sizes.join(", ") : prev.sizes,
        images: data.images?.length ? data.images.join(", ") : prev.images,
        colors: data.colors?.length
          ? data.colors.map((c) => `${c.name}|${c.hex}|0`).join("\n")
          : prev.colors,
        short_description: data.short_description || prev.short_description,
        description: data.description || prev.description,
      }));
      setLookupMsg({
        ok: true,
        text: "Мэдээлэл татагдлаа. Үнэ болон нөөцийг нэмнэ үү.",
      });
    } catch {
      setLookupMsg({ ok: false, text: "Сүлжээний алдаа. Дахин оролдоно уу." });
    } finally {
      setLooking(false);
    }
  };

  const [uploading, setUploading] = useState(false);
  const [imgMsg, setImgMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const appendImages = (urls: string[]) => {
    setV((prev) => {
      const existing = prev.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const merged = [
        ...existing,
        ...urls.filter((u) => !existing.includes(u)),
      ];
      return { ...prev, images: merged.join(", ") };
    });
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setImgMsg(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !data.urls?.length) {
        setImgMsg({ ok: false, text: data.error ?? "Хуулж чадсангүй." });
        return;
      }
      appendImages(data.urls);
      setImgMsg({
        ok: true,
        text: `${data.urls.length} зураг Cloudinary-д хадгалагдлаа.`,
      });
    } catch {
      setImgMsg({ ok: false, text: "Сүлжээний алдаа." });
    } finally {
      setUploading(false);
    }
  };

  const rehostImages = async () => {
    const urls = v.images
      .split(",")
      .map((s) => s.trim())
      .filter(
        (s) =>
          /^https?:\/\//i.test(s) && !s.includes("res.cloudinary.com")
      );
    if (urls.length === 0) {
      setImgMsg({
        ok: false,
        text: "Cloudinary руу хуулах гадны зураг алга.",
      });
      return;
    }
    setUploading(true);
    setImgMsg(null);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !data.urls?.length) {
        setImgMsg({ ok: false, text: data.error ?? "Хуулж чадсангүй." });
        return;
      }
      setV((prev) => {
        const kept = prev.images
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s && !urls.includes(s));
        return { ...prev, images: [...kept, ...data.urls!].join(", ") };
      });
      setImgMsg({
        ok: true,
        text: `${data.urls.length} зураг Cloudinary-д хадгалагдлаа.`,
      });
    } catch {
      setImgMsg({ ok: false, text: "Сүлжээний алдаа." });
    } finally {
      setUploading(false);
    }
  };

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
      {/* Штрих кодоор хайх */}
      <div className="sm:col-span-2 lg:col-span-3">
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Штрих кодоор бараа татах
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  lookup(barcode);
                }
              }}
              inputMode="numeric"
              placeholder="Штрих код (EAN/UPC)…"
              className="min-w-[180px] flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none"
            />
            <button
              type="button"
              onClick={() => lookup(barcode)}
              disabled={looking}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              {looking ? "Хайж байна…" : "Хайх"}
            </button>
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-foreground px-4 py-2 text-sm font-semibold hover:bg-background"
            >
              <CameraIcon className="h-4 w-4" /> Камераар
            </button>
          </div>
          {lookupMsg && (
            <p
              className={classNames(
                "mt-2 text-xs",
                lookupMsg.ok ? "text-success" : "text-danger"
              )}
            >
              {lookupMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* Барааны төрөл */}
      <div className="sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Барааны төрөл</span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["apparel", "Хувцас"],
              ["food", "Хүнс & Нэмэлт тэжээл"],
              ["home", "Гэр ахуй"],
              ["other", "Бусад"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={classNames(
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                kind === k
                  ? "bg-foreground text-white"
                  : "border bg-surface hover:border-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {!isApparel && (
          <p className="mt-1.5 text-xs text-muted">
            Хэмжээ, өнгө, загвар зэрэг хувцасны талбаруудыг нуусан. Зөвхөн
            хэрэгцээтэй мэдээллийг бөглөнө үү.
          </p>
        )}
      </div>

      {/* Нэр, SKU, Брэнд */}
      <label className="block">
        <span className={lbl}>Барааны нэр *</span>
        <input
          name="name"
          required
          value={v.name}
          onChange={(e) => set("name", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>SKU (хоосон бол автоматаар)</span>
        <input
          name="sku"
          placeholder="CO-2025-0001"
          value={v.sku}
          onChange={(e) => set("sku", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>Брэнд</span>
        <input
          name="brand"
          placeholder="Chicago Outlet"
          value={v.brand}
          onChange={(e) => set("brand", e.target.value)}
          className={field}
        />
      </label>

      {/* Ангилал, Дэд ангилал, Хүйс */}
      <label className="block">
        <span className={lbl}>Ангилал</span>
        <select
          name="category"
          className={field}
          value={v.category}
          onChange={(e) => set("category", e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.nameMn}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={lbl}>Дэд ангилал</span>
        <input
          name="subcategory"
          placeholder="Shirts"
          value={v.subcategory}
          onChange={(e) => set("subcategory", e.target.value)}
          className={field}
        />
      </label>
      {isApparel && (
        <label className="block">
          <span className={lbl}>Хүйс</span>
          <select
            name="gender"
            className={field}
            value={v.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="men">Эрэгтэй</option>
            <option value="women">Эмэгтэй</option>
            <option value="unisex">Юнисекс</option>
            <option value="kids">Хүүхэд</option>
          </select>
        </label>
      )}

      {/* Загвар, Үнэ, Хямдрал */}
      {isApparel && (
        <label className="block">
          <span className={lbl}>Загвар (fit)</span>
          <select
            name="fit"
            className={field}
            value={v.fit}
            onChange={(e) => set("fit", e.target.value)}
          >
            <option value="slim">Slim</option>
            <option value="regular">Regular</option>
            <option value="relaxed">Relaxed</option>
            <option value="oversized">Oversized</option>
          </select>
        </label>
      )}
      <label className="block">
        <span className={lbl}>Үнэ (₮) *</span>
        <input
          name="price"
          type="number"
          min={0}
          required
          value={v.price}
          onChange={(e) => set("price", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>Хямдрал (%)</span>
        <input
          name="discount_percent"
          type="number"
          min={0}
          max={100}
          value={v.discount_percent}
          onChange={(e) => set("discount_percent", e.target.value)}
          className={field}
        />
      </label>

      {/* Нийт нөөц, Хэмжээнүүд */}
      <label className="block">
        <span className={lbl}>Нийт нөөц (хоосон бол өнгөнүүдөөс)</span>
        <input
          name="total_stock"
          type="number"
          min={0}
          value={v.total_stock}
          onChange={(e) => set("total_stock", e.target.value)}
          className={field}
        />
      </label>
      {isApparel && (
        <label className="block">
          <span className={lbl}>Хэмжээнүүд (таслалаар)</span>
          <input
            name="sizes"
            placeholder="S, M, L, XL"
            value={v.sizes}
            onChange={(e) => set("sizes", e.target.value)}
            className={field}
          />
        </label>
      )}

      {/* Зурагнууд */}
      <div className="sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Зурагнууд</span>
        <input
          name="images"
          placeholder="oxford-1, oxford-2 эсвэл URL"
          value={v.images}
          onChange={(e) => set("images", e.target.value)}
          className={field}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium text-muted transition hover:border-foreground hover:text-foreground">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <UploadIcon className="h-4 w-4" />
            {uploading ? "Хуулж байна…" : "Зураг хуулах"}
          </label>
          <button
            type="button"
            onClick={rehostImages}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-muted transition hover:border-foreground hover:text-foreground disabled:opacity-50"
          >
            <CloudIcon className="h-4 w-4" /> Cloudinary руу хуулах
          </button>
        </div>
        {imgMsg && (
          <p
            className={`mt-2 text-xs ${imgMsg.ok ? "text-success" : "text-danger"}`}
          >
            {imgMsg.text}
          </p>
        )}
        {v.images.trim() && (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {v.images
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 8)
              .map((s, i) => (
                <div key={`${s}-${i}`} className="relative aspect-square">
                  <ProductImage
                    seed={s}
                    label={v.name || "Бараа"}
                    className="h-full w-full rounded-lg border object-cover"
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Богино тайлбар, Дэлгэрэнгүй тайлбар */}
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Богино тайлбар</span>
        <input
          name="short_description"
          value={v.short_description}
          onChange={(e) => set("short_description", e.target.value)}
          className={field}
        />
      </label>
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Дэлгэрэнгүй тайлбар</span>
        <textarea
          name="description"
          rows={3}
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
          className={field}
        />
      </label>

      {/* Таг, Материал, Цуглуулга, Улирал */}
      <label className="block">
        <span className={lbl}>Таг (таслалаар)</span>
        <input
          name="tags"
          placeholder="classic, office"
          value={v.tags}
          onChange={(e) => set("tags", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>Материал</span>
        <input
          name="material"
          placeholder="100% Cotton"
          value={v.material}
          onChange={(e) => set("material", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>Цуглуулга</span>
        <input
          name="collection"
          placeholder="Urban Essentials"
          value={v.collection}
          onChange={(e) => set("collection", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>Улирал</span>
        <input
          name="season"
          placeholder="all-season"
          value={v.season}
          onChange={(e) => set("season", e.target.value)}
          className={field}
        />
      </label>

      {/* Өнгөнүүд */}
      {isApparel && (
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={lbl}>
            Өнгөнүүд — мөр бүрт &ldquo;Нэр|#hex|нөөц&rdquo;
          </span>
          <textarea
            name="colors"
            rows={3}
            placeholder={"White|#F7F7F4|14\nNavy|#1F2A44|9"}
            value={v.colors}
            onChange={(e) => set("colors", e.target.value)}
            className={field}
          />
        </label>
      )}

      {/* Арчилгаа */}
      {isApparel && (
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={lbl}>Арчилгаа</span>
          <input
            name="care_instructions"
            value={v.care_instructions}
            onChange={(e) => set("care_instructions", e.target.value)}
            className={field}
          />
        </label>
      )}

      {/* Идэвхтэй, Онцлох, Шинэ */}
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
          disabled={pending || uploading}
          className="rounded-md bg-foreground px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent hover:text-foreground disabled:opacity-60"
        >
          {pending ? "Хадгалж байна…" : "Бараа хадгалах"}
        </button>
      </div>

      {scanning && (
        <BarcodeScanner
          onClose={() => setScanning(false)}
          onDetected={(code) => {
            setScanning(false);
            setBarcode(code);
            lookup(code);
          }}
        />
      )}
    </form>
  );
}
