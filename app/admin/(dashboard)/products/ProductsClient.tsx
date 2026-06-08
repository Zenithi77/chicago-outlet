"use client";

import { useEffect, useMemo, useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { finalPrice, formatMNT, classNames } from "@/lib/utils";
import { CameraIcon, UploadIcon, CloudIcon, CloseIcon } from "@/components/Icons";

// ── Excel import state lives here so it sits above the form ──────────────────
function useExcelImport(onSuccess: (msg: string) => void) {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const runImport = async (file: File) => {
    setImporting(true);
    setImportMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = await res.json();
      if (data.inserted > 0) {
        setImportMsg({ ok: true, text: data.message });
        onSuccess(data.message);
        router.refresh();
      } else {
        const errLines = (data.errors ?? [])
          .slice(0, 5)
          .map((e: { row: number; error: string }) => `Мөр ${e.row}: ${e.error}`)
          .join(" | ");
        setImportMsg({ ok: false, text: data.message + (errLines ? " — " + errLines : "") });
      }
    } catch {
      setImportMsg({ ok: false, text: "Сүлжээний алдаа." });
    } finally {
      setImporting(false);
    }
  };

  return { importing, importMsg, runImport };
}
import {
  createProduct,
  updateProduct,
  updateProductFields,
  toggleProductActive,
  type ProductActionState,
} from "./actions";
import { BarcodeScanner } from "./BarcodeScanner";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  subcategory: string;
  gender: string;
  branchStock: Record<string, number>;
  isOnline: boolean;
  price: number;
  discountPercent: number;
  totalStock: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  images: string[];
  collection: string;
  material: string;
  fit: string;
  season: string;
  tags: string[];
  sizes: string[];
  colors: Array<{ name: string; hex: string; stock: number }>;
  shortDescription: string;
  description: string;
  careInstructions: string;
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
  const [branchFilter, setBranchFilter] = useState<"" | "park_od" | "riveria" | "online">("");
  const [catFilter, setCatFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
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
        if (branchFilter === "online" && !r.isOnline) return false;
        if (branchFilter === "park_od" && !r.branchStock["park_od"]) return false;
        if (branchFilter === "riveria" && !r.branchStock["riveria"]) return false;
        if (catFilter && r.category !== catFilter) return false;
        if (stockFilter === "out" && r.totalStock > 0) return false;
        if (stockFilter === "low" && (r.totalStock === 0 || r.totalStock > 5))
          return false;
        if (stockFilter === "in" && r.totalStock <= 5) return false;
        return true;
      }),
    [initial, search, branchFilter, catFilter, stockFilter]
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

  const { importing, importMsg, runImport } = useExcelImport((msg) => notify(msg));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Бараа</h1>
          <p className="text-sm text-muted">
            {filtered.length} бараа{isPending && " · хадгалж байна…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Excel template download */}
          <a
            href="/api/import/template"
            download
            className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium text-muted hover:border-foreground hover:text-foreground"
          >
            <UploadIcon className="h-4 w-4 rotate-180" />
            Загвар татах
          </a>
          {/* Excel file import */}
          <label className={classNames(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition",
            importing
              ? "cursor-not-allowed border-border text-muted opacity-60"
              : "hover:border-foreground hover:text-foreground"
          )}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { runImport(f); e.target.value = ""; }
              }}
            />
            <UploadIcon className="h-4 w-4" />
            {importing ? "Оруулж байна…" : "Excel оруулах"}
          </label>
          <button
            onClick={() => { setShowForm((v) => !v); setEditingProduct(null); }}
            className="rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
          >
            {showForm && !editingProduct ? "Хаах" : "+ Шинэ бараа"}
          </button>
        </div>
      </div>

      {importMsg && (
        <p className={classNames(
          "mt-3 rounded-lg px-4 py-2.5 text-sm",
          importMsg.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        )}>
          {importMsg.text}
        </p>
      )}

      {loadError && (
        <p className="mt-4 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          Бараа уншихад алдаа гарлаа: {loadError}. Supabase тохиргоог болон
          schema-аа шалгана уу.
        </p>
      )}

      {(showForm || editingProduct) && (
        <ProductForm
          categories={categories}
          editProduct={editingProduct ?? undefined}
          onDone={(msg) => {
            setShowForm(false);
            setEditingProduct(null);
            notify(msg);
            router.refresh();
          }}
        />
      )}

      {/* Шүүлтүүрүүд */}
      <div className="mt-5 space-y-3">
        {/* Branch tabs */}
        <div className="flex gap-1 rounded-lg border bg-surface p-1 w-fit">
          {(["", "park_od", "riveria", "online"] as const).map((b) => {
            const label = b === "" ? "Бүгд" : b === "park_od" ? "Park-Od" : b === "riveria" ? "Riveria" : "Захиалга";
            return (
              <button
                key={b}
                onClick={() => setBranchFilter(b)}
                className={classNames(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition",
                  branchFilter === b
                    ? "bg-foreground text-white"
                    : "text-muted hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        {/* Other filters */}
        <div className="flex flex-wrap gap-3">
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
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.branchStock["park_od"] !== undefined && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">Park-Od: {r.branchStock["park_od"]}</span>
                  )}
                  {r.branchStock["riveria"] !== undefined && (
                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">Riveria: {r.branchStock["riveria"]}</span>
                  )}
                  {r.isOnline && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Захиалга</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button
                  onClick={() => { setEditingProduct(r); setShowForm(false); window.scrollTo({top:0, behavior:'smooth'}); }}
                  className="rounded px-2.5 py-1 text-xs font-medium border hover:border-foreground"
                >
                  Засах
                </button>
                <button
                  onClick={() => persist(() => toggleProductActive(r.id, !r.isActive))}
                  className={classNames(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    r.isActive ? "bg-success/15 text-success" : "bg-border text-muted"
                  )}
                >
                  {r.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                </button>
              </div>
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
              <th className="px-4 py-3">Салбар / Нөөц</th>
              <th className="px-4 py-3">Ангилал</th>
              <th className="px-4 py-3">Үнэ</th>
              <th className="px-4 py-3">Төлөв</th>
              <th className="px-4 py-3"></th>
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
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.branchStock["park_od"] !== undefined && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        Park-Od: {r.branchStock["park_od"]}
                      </span>
                    )}
                    {r.branchStock["riveria"] !== undefined && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        Riveria: {r.branchStock["riveria"]}
                      </span>
                    )}
                    {r.isOnline && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Захиалга
                      </span>
                    )}
                  </div>
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
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      setEditingProduct(r);
                      setShowForm(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded border px-3 py-1 text-xs font-medium hover:border-foreground hover:text-foreground"
                  >
                    Засах
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loadError && (
              <tr>
                <td
                  colSpan={7}
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
  editProduct,
  onDone,
}: {
  categories: Cat[];
  editProduct?: ProductRow;
  onDone: (msg: string) => void;
}) {
  const isEdit = !!editProduct;
  const action = isEdit ? updateProduct : createProduct;

  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(
    action,
    undefined
  );

  const [v, setV] = useState({
    name: editProduct?.name ?? "",
    sku: editProduct?.sku ?? "",
    brand: editProduct?.brand ?? "",
    category: editProduct?.category ?? categories[0]?.name ?? "",
    subcategory: editProduct?.subcategory ?? "",
    gender: editProduct?.gender ?? "unisex",
    has_park_od: !!(editProduct?.branchStock?.["park_od"] !== undefined),
    stock_park_od: String(editProduct?.branchStock?.["park_od"] ?? ""),
    has_riveria: !!(editProduct?.branchStock?.["riveria"] !== undefined),
    stock_riveria: String(editProduct?.branchStock?.["riveria"] ?? ""),
    is_online: editProduct?.isOnline ?? true,
    fit: editProduct?.fit ?? "regular",
    price: editProduct ? String(editProduct.price) : "",
    discount_percent: String(editProduct?.discountPercent ?? "0"),
    sizes: editProduct?.sizes?.join(", ") ?? "",
    images: editProduct?.images?.join(", ") ?? "",
    tags: editProduct?.tags?.join(", ") ?? "",
    material: editProduct?.material ?? "",
    collection: editProduct?.collection ?? "",
    season: editProduct?.season ?? "",
    colors: editProduct?.colors?.map(c => `${c.name}|${c.hex}|${c.stock}`).join("\n") ?? "",
    short_description: editProduct?.shortDescription ?? "",
    description: editProduct?.description ?? "",
    care_instructions: editProduct?.careInstructions ?? "",
  });
  const set = (k: keyof typeof v, val: string | boolean) =>
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
    gender?: string;
    sizes?: string[];
    colors?: { name: string; hex: string; stock: number }[];
    images?: string[];
    error?: string;
  };

  const lookup = async (codeRaw: string) => {
    const code = codeRaw.replace(/\D/g, "").trim();
    if (code.length < 6) {
      setLookupMsg({ ok: false, text: "Зөв Barcode  оруулна уу." });
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
            "Энэ Barcode оор бараа олдсонгүй. Гараараа бөглөнө үү.",
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
        gender: data.gender || prev.gender,
        sizes: data.sizes?.length ? data.sizes.join(", ") : prev.sizes,
        images: data.images?.length ? data.images.join(", ") : prev.images,
        colors: data.colors?.length
          ? data.colors.map((c) => `${c.name}|${c.hex}|0`).join("\n")
          : prev.colors,
        short_description: data.short_description || prev.short_description,
        description: data.description || prev.description,
      }));
      const filled: string[] = [];
      if (data.name) filled.push("нэр");
      if (data.gender) filled.push("хүйс");
      if (data.material) filled.push("материал");
      if (data.colors?.length) filled.push("өнгө");
      if (data.sizes?.length) filled.push("хэмжээ");
      if (data.images?.length) filled.push("зураг");
      setLookupMsg({
        ok: true,
        text: `Татагдлаа${filled.length ? ` (${filled.join(", ")})` : ""}. Үнэ болон нөөцийг нэмнэ үү.`,
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
      action={formAction}
      className="mt-5 grid gap-4 rounded-xl border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {/* Edit mode: hidden product ID */}
      {isEdit && <input type="hidden" name="_product_id" value={editProduct!.id} />}

      <div className="flex items-center justify-between sm:col-span-2 lg:col-span-3">
        <h2 className="font-serif text-lg font-bold">
          {isEdit ? `Засах: ${editProduct!.name}` : "Шинэ бараа нэмэх"}
        </h2>
      </div>

      {/* Barcode оор хайх */}
      <div className="sm:col-span-2 lg:col-span-3">
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Barcode оор бараа татах
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
              placeholder="Barcode  (EAN/UPC)…"
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

      {/* 1. Нэр */}
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Барааны нэр *</span>
        <input
          name="name"
          required
          value={v.name}
          onChange={(e) => set("name", e.target.value)}
          className={field}
        />
      </label>

      {/* 2. Зураг — томхон preview, тус бүрд устгах товч */}
      <div className="sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Зурагнууд</span>
        <input type="hidden" name="images" value={v.images} />
        {(() => {
          const list = v.images
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const removeAt = (idx: number) => {
            const next = list.filter((_, i) => i !== idx).join(", ");
            set("images", next);
          };
          return (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((s, i) => (
                  <div
                    key={`${s}-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border bg-background"
                  >
                    <ProductImage
                      seed={s}
                      label={v.name || "Бараа"}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/85 text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Зураг устгах"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-background text-xs font-medium text-muted transition hover:border-foreground hover:text-foreground">
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
                  <UploadIcon className="h-6 w-6" />
                  <span className="text-center leading-tight">
                    {uploading ? "Хуулж байна…" : "Зураг нэмэх"}
                  </span>
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="url"
                  placeholder="Зургийн URL эсвэл seed нэр…"
                  value={v.images}
                  onChange={(e) => set("images", e.target.value)}
                  className={field + " min-w-[200px] flex-1"}
                />
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
            </>
          );
        })()}
      </div>

      {/* 3. Богино тайлбар, Дэлгэрэнгүй тайлбар */}
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

      {/* 4. SKU, Брэнд, Ангилал */}
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

      {/* Салбар & нөөц */}
      <div className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Салбар & нөөц *</span>
        <div className="mt-1 flex flex-wrap gap-4 rounded-md border bg-background p-4">
          {/* Park-Od */}
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="has_park_od"
              checked={v.has_park_od}
              onChange={(e) => set("has_park_od", e.target.checked)}
            />
            Park-Od Mall
          </label>
          {v.has_park_od && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">Нөөц:</span>
              <input
                type="number"
                name="stock_park_od"
                min={0}
                value={v.stock_park_od}
                onChange={(e) => set("stock_park_od", e.target.value)}
                className="w-20 rounded border bg-surface px-2 py-1 text-sm"
                placeholder="0"
              />
            </label>
          )}
          {/* Riveria */}
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="has_riveria"
              checked={v.has_riveria}
              onChange={(e) => set("has_riveria", e.target.checked)}
            />
            Parko Riveria
          </label>
          {v.has_riveria && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">Нөөц:</span>
              <input
                type="number"
                name="stock_riveria"
                min={0}
                value={v.stock_riveria}
                onChange={(e) => set("stock_riveria", e.target.value)}
                className="w-20 rounded border bg-surface px-2 py-1 text-sm"
                placeholder="0"
              />
            </label>
          )}
          {/* Online */}
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="is_online"
              checked={v.is_online}
              onChange={(e) => set("is_online", e.target.checked)}
            />
            Захиалга (онлайн)
          </label>
        </div>
      </div>
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

      {/* 5. Үнэ, Хямдрал */}
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

      {/* 6. Нөөц, Хэмжээ */}
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
          <input type="checkbox" name="is_active" defaultChecked={editProduct?.isActive ?? true} /> Идэвхтэй
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" defaultChecked={editProduct?.isFeatured ?? false} /> Онцлох
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_new_arrival" defaultChecked={editProduct?.isNewArrival ?? false} /> Шинэ бараа
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
          {pending ? "Хадгалж байна…" : isEdit ? "Өөрчлөлт хадгалах" : "Бараа хадгалах"}
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
