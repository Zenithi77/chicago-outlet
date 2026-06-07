"use client";

import { useEffect, useMemo, useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ProductImage";
import { finalPrice, formatMNT, classNames } from "@/lib/utils";
import { CameraIcon, UploadIcon, CloseIcon } from "@/components/Icons";
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
          <h1 className="font-serif text-2xl font-bold">Ð‘Ð°Ñ€Ð°Ð°</h1>
          <p className="text-sm text-muted">
            {filtered.length} Ð±Ð°Ñ€Ð°Ð°{isPending && " Â· Ñ…Ð°Ð´Ð³Ð°Ð»Ð¶ Ð±Ð°Ð¹Ð½Ð°â€¦"}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
        >
          {showForm ? "Ð¥Ð°Ð°Ñ…" : "+ Ð¨Ð¸Ð½Ñ Ð±Ð°Ñ€Ð°Ð°"}
        </button>
      </div>

      {loadError && (
        <p className="mt-4 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          Ð‘Ð°Ñ€Ð°Ð° ÑƒÐ½ÑˆÐ¸Ñ…Ð°Ð´ Ð°Ð»Ð´Ð°Ð° Ð³Ð°Ñ€Ð»Ð°Ð°: {loadError}. Supabase Ñ‚Ð¾Ñ…Ð¸Ñ€Ð³Ð¾Ð¾ Ð±Ð¾Ð»Ð¾Ð½ schema-Ð°Ð°
          ÑˆÐ°Ð»Ð³Ð°Ð½Ð° ÑƒÑƒ.
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
          placeholder="ÐÑÑ€ ÑÑÐ²ÑÐ» SKU Ñ…Ð°Ð¹Ñ…..."
          className="rounded-md border bg-surface px-3 py-2 text-sm outline-none"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-md border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Ð‘Ò¯Ñ… Ð°Ð½Ð³Ð¸Ð»Ð°Ð»</option>
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
          <option value="">Ð‘Ò¯Ñ… Ð½Ó©Ó©Ñ†</option>
          <option value="in">Ð‘ÑÐ»ÑÐ½</option>
          <option value="low">Ð¦Ó©Ó©Ð½ (â‰¤5)</option>
          <option value="out">Ð”ÑƒÑƒÑÑÐ°Ð½</option>
        </select>
      </div>

      {/* Mobile cards */}
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
                {r.isActive ? "Ð˜Ð´ÑÐ²Ñ…Ñ‚ÑÐ¹" : "Ð˜Ð´ÑÐ²Ñ…Ð³Ò¯Ð¹"}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">Ò®Ð½Ñ (â‚®)</span>
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
                <span className="mb-1 block text-[11px] font-medium text-muted">ÐÓ©Ó©Ñ†</span>
                <input
                  type="number"
                  defaultValue={r.totalStock}
                  onBlur={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    if (val !== r.totalStock)
                      persist(() => updateProductFields(r.id, { total_stock: val }));
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
                Ð¥ÑÐ¼Ð´Ñ€Ð°Ð»Ñ‚Ð°Ð¹ Ò¯Ð½Ñ: {formatMNT(finalPrice(r))}
              </p>
            )}
          </div>
        ))}
        {filtered.length === 0 && !loadError && (
          <p className="rounded-xl border bg-surface px-4 py-10 text-center text-sm text-muted">
            Ð‘Ð°Ñ€Ð°Ð° Ð°Ð»Ð³Ð°. â€œ+ Ð¨Ð¸Ð½Ñ Ð±Ð°Ñ€Ð°Ð°â€ Ð´Ð°Ñ€Ð¶ Ð½ÑÐ¼Ð½Ñ Ò¯Ò¯.
          </p>
        )}
      </div>

      {/* Table (desktop) */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border bg-surface md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b bg-background text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Ð‘Ð°Ñ€Ð°Ð°</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">ÐÐ½Ð³Ð¸Ð»Ð°Ð»</th>
              <th className="px-4 py-3">Ò®Ð½Ñ</th>
              <th className="px-4 py-3">ÐÓ©Ó©Ñ†</th>
              <th className="px-4 py-3">Ð¢Ó©Ð»Ó©Ð²</th>
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
                      â†’ {formatMNT(finalPrice(r))}
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
                    {r.isActive ? "Ð˜Ð´ÑÐ²Ñ…Ñ‚ÑÐ¹" : "Ð˜Ð´ÑÐ²Ñ…Ð³Ò¯Ð¹"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loadError && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  Ð‘Ð°Ñ€Ð°Ð° Ð°Ð»Ð³Ð°. â€œ+ Ð¨Ð¸Ð½Ñ Ð±Ð°Ñ€Ð°Ð°â€ Ð´Ð°Ñ€Ð¶ Ð½ÑÐ¼Ð½Ñ Ò¯Ò¯.
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

  // Controlled values so barcode lookup can auto-fill the form.
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

  // Product kind drives which fields are relevant (apparel vs. food/home/other).
  const [kind, setKind] = useState<"apparel" | "food" | "home" | "other">(
    "apparel"
  );
  const isApparel = kind === "apparel";

  // Barcode lookup state.
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [looking, setLooking] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );

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

  // Rehost a specific list of URLs to Cloudinary (does not read from v.images state).
  const rehostUrlList = async (urls: string[]) => {
    const external = urls.filter(
      (u) => /^https?:\/\//i.test(u) && !u.includes("res.cloudinary.com")
    );
    if (external.length === 0) return;
    setUploading(true);
    setImgMsg(null);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: external }),
      });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !data.urls?.length) {
        setImgMsg({ ok: false, text: data.error ?? "Ð—ÑƒÑ€Ð°Ð³ Ñ…ÑƒÑƒÐ»Ð¶ Ñ‡Ð°Ð´ÑÐ°Ð½Ð³Ò¯Ð¹." });
        return;
      }
      // Swap external URLs â†’ Cloudinary URLs in state.
      setV((prev) => {
        const all = prev.images.split(",").map((s) => s.trim()).filter(Boolean);
        const replaced = all.map((u) => {
          const idx = external.indexOf(u);
          return idx !== -1 ? data.urls![idx] : u;
        });
        // Append any new cloudinary urls not already present.
        data.urls!.forEach((cu) => { if (!replaced.includes(cu)) replaced.push(cu); });
        return { ...prev, images: replaced.join(", ") };
      });
      setImgMsg({ ok: true, text: `${data.urls.length} Ð·ÑƒÑ€Ð°Ð³ Cloudinary-Ð´ Ñ…Ð°Ð´Ð³Ð°Ð»Ð°Ð³Ð´Ð»Ð°Ð°.` });
    } catch {
      setImgMsg({ ok: false, text: "Ð¡Ò¯Ð»Ð¶ÑÑÐ½Ð¸Ð¹ Ð°Ð»Ð´Ð°Ð°." });
    } finally {
      setUploading(false);
    }
  };

  const lookup = async (codeRaw: string) => {
    const code = codeRaw.replace(/\D/g, "").trim();
    if (code.length < 6) {
      setLookupMsg({ ok: false, text: "Ð—Ó©Ð² ÑˆÑ‚Ñ€Ð¸Ñ… ÐºÐ¾Ð´ Ð¾Ñ€ÑƒÑƒÐ»Ð½Ð° ÑƒÑƒ." });
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
          text: data.error ?? "Ð­Ð½Ñ ÑˆÑ‚Ñ€Ð¸Ñ… ÐºÐ¾Ð´Ð¾Ð¾Ñ€ Ð±Ð°Ñ€Ð°Ð° Ð¾Ð»Ð´ÑÐ¾Ð½Ð³Ò¯Ð¹. Ð“Ð°Ñ€Ð°Ð°Ñ€ Ð±Ó©Ð³Ð»Ó©Ð½Ó© Ò¯Ò¯.",
        });
        return;
      }
      const newImages = data.images ?? [];
      setV((prev) => ({
        ...prev,
        sku: prev.sku || data.barcode || prev.sku,
        name: data.name || prev.name,
        brand: data.brand || prev.brand,
        subcategory: data.subcategory || prev.subcategory,
        material: data.material || prev.material,
        sizes: data.sizes?.length ? data.sizes.join(", ") : prev.sizes,
        images: newImages.length ? newImages.join(", ") : prev.images,
        colors: data.colors?.length
          ? data.colors.map((c) => `${c.name}|${c.hex}|0`).join("\n")
          : prev.colors,
        short_description: data.short_description || prev.short_description,
        description: data.description || prev.description,
      }));
      setLookupMsg({ ok: true, text: "ÐœÑÐ´ÑÑÐ»ÑÐ» Ñ‚Ð°Ñ‚Ð°Ð³Ð´Ð»Ð°Ð° â€” Ð·ÑƒÑ€Ð³ÑƒÑƒÐ´Ñ‹Ð³ Cloudinary-Ð´ Ñ…ÑƒÑƒÐ»Ð¶ Ð±Ð°Ð¹Ð½Ð°â€¦" });
      // Auto-upload barcode images to Cloudinary immediately.
      if (newImages.length) await rehostUrlList(newImages);
    } catch {
      setLookupMsg({ ok: false, text: "Ð¡Ò¯Ð»Ð¶ÑÑÐ½Ð¸Ð¹ Ð°Ð»Ð´Ð°Ð°. Ð”Ð°Ñ…Ð¸Ð½ Ð¾Ñ€Ð¾Ð»Ð´Ð¾Ð½Ð¾ ÑƒÑƒ." });
    } finally {
      setLooking(false);
    }
  };

  // Cloudinary image hosting.
  const [uploading, setUploading] = useState(false);
  const [imgMsg, setImgMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const appendImages = (urls: string[]) => {
    setV((prev) => {
      const existing = prev.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const merged = [...existing, ...urls.filter((u) => !existing.includes(u))];
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
        setImgMsg({ ok: false, text: data.error ?? "Ð¥ÑƒÑƒÐ»Ð¶ Ñ‡Ð°Ð´ÑÐ°Ð½Ð³Ò¯Ð¹." });
        return;
      }
      appendImages(data.urls);
      setImgMsg({ ok: true, text: `${data.urls.length} Ð·ÑƒÑ€Ð°Ð³ Ñ…Ð°Ð´Ð³Ð°Ð»Ð°Ð³Ð´Ð»Ð°Ð°.` });
    } catch {
      setImgMsg({ ok: false, text: "Ð¡Ò¯Ð»Ð¶ÑÑÐ½Ð¸Ð¹ Ð°Ð»Ð´Ð°Ð°." });
    } finally {
      setUploading(false);
    }
  };

  // Re-host any external (non-Cloudinary) URLs already in the images field.
  const rehostImages = async () => {
    const urls = v.images
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//i.test(s));
    if (urls.length === 0) {
      setImgMsg({ ok: false, text: "Cloudinary Ñ€ÑƒÑƒ Ñ…ÑƒÑƒÐ»Ð°Ñ… Ð³Ð°Ð´Ð½Ñ‹ Ð·ÑƒÑ€Ð°Ð³ Ð°Ð»Ð³Ð°." });
      return;
    }
    await rehostUrlList(urls);
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
      {/* Barcode lookup bar */}
      <div className="sm:col-span-2 lg:col-span-3">
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Ð¨Ñ‚Ñ€Ð¸Ñ… ÐºÐ¾Ð´Ð¾Ð¾Ñ€ Ð±Ð°Ñ€Ð°Ð° Ñ‚Ð°Ñ‚Ð°Ñ…
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
              placeholder="Ð¨Ñ‚Ñ€Ð¸Ñ… ÐºÐ¾Ð´ (EAN/UPC)â€¦"
              className="min-w-[180px] flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none"
            />
            <button
              type="button"
              onClick={() => lookup(barcode)}
              disabled={looking}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              {looking ? "Ð¥Ð°Ð¹Ð¶ Ð±Ð°Ð¹Ð½Ð°â€¦" : "Ð¥Ð°Ð¹Ñ…"}
            </button>
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-foreground px-4 py-2 text-sm font-semibold hover:bg-background"
            >
              <CameraIcon className="h-4 w-4" /> ÐšÐ°Ð¼ÐµÑ€Ð°Ð°Ñ€
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

      {/* Product kind */}
      <div className="sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Ð‘Ð°Ñ€Ð°Ð°Ð½Ñ‹ Ñ‚Ó©Ñ€Ó©Ð»</span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["apparel", "Ð¥ÑƒÐ²Ñ†Ð°Ñ"],
              ["food", "Ð¥Ò¯Ð½Ñ & ÐÑÐ¼ÑÐ»Ñ‚ Ñ‚ÑÐ¶ÑÑÐ»"],
              ["home", "Ð“ÑÑ€ Ð°Ñ…ÑƒÐ¹"],
              ["other", "Ð‘ÑƒÑÐ°Ð´"],
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
      </div>

      {/* â”€â”€ Row 1: Name / SKU / Brand â”€â”€ */}
      <label className="block">
        <span className={lbl}>Ð‘Ð°Ñ€Ð°Ð°Ð½Ñ‹ Ð½ÑÑ€ *</span>
        <input
          name="name"
          required
          value={v.name}
          onChange={(e) => set("name", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>SKU (Ñ…Ð¾Ð¾ÑÐ¾Ð½ Ð±Ð¾Ð» Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð°Ð°Ñ€)</span>
        <input
          name="sku"
          placeholder="CO-2025-0001"
          value={v.sku}
          onChange={(e) => set("sku", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>Ð‘Ñ€ÑÐ½Ð´</span>
        <input
          name="brand"
          placeholder="Chicago Outlet"
          value={v.brand}
          onChange={(e) => set("brand", e.target.value)}
          className={field}
        />
      </label>

      {/* â”€â”€ Images (full width) â”€â”€ */}
      <div className="sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Ð—ÑƒÑ€Ð°Ð³Ð½ÑƒÑƒÐ´</span>
        {/* Hidden input so form action receives images value */}
        <input type="hidden" name="images" value={v.images} />

        {/* Large preview grid */}
        {v.images.trim() ? (
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {v.images
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 8)
              .map((s, i) => (
                <div
                  key={`${s}-${i}`}
                  className="group relative aspect-square overflow-hidden rounded-xl border bg-background"
                >
                  <ProductImage
                    seed={s}
                    label={v.name || "Ð‘Ð°Ñ€Ð°Ð°"}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const list = v.images
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                      list.splice(i, 1);
                      set("images", list.join(", "));
                    }}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Ð£ÑÑ‚Ð³Ð°Ñ…"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="mb-3 flex aspect-video max-h-44 items-center justify-center rounded-xl border border-dashed bg-background text-sm text-muted">
            Ð—ÑƒÑ€Ð°Ð³ Ð±Ð°Ð¹Ñ…Ð³Ò¯Ð¹ â€” Ð´Ð¾Ð¾Ñ€Ð¾Ð¾Ñ Ð½ÑÐ¼Ð½Ñ Ò¯Ò¯
          </div>
        )}

        {/* URL / seed text field */}
        <input
          placeholder="URL ÑÑÐ²ÑÐ» seed Ð½ÑÑ€ â€” Ñ‚Ð°ÑÐ»Ð°Ð»Ð°Ð°Ñ€ (oxford-1, https://â€¦)"
          value={v.images}
          onChange={(e) => set("images", e.target.value)}
          className={classNames(field, "font-mono text-xs")}
        />

        {/* File upload */}
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
            {uploading ? "Ð¥ÑƒÑƒÐ»Ð¶ Ð±Ð°Ð¹Ð½Ð°â€¦" : "Ð—ÑƒÑ€Ð°Ð³ Ñ…ÑƒÑƒÐ»Ð°Ñ…"}
          </label>
          <span className="text-xs text-muted">
            Ð—ÑƒÑ€Ð³Ð¸Ð¹Ð³ Ñ…ÑƒÑƒÐ»Ð°Ñ…Ð°Ð´ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð°Ð°Ñ€ Cloudinary-Ð´ Ñ…Ð°Ð´Ð³Ð°Ð»Ð°Ð³Ð´Ð°Ð½Ð°.
          </span>
        </div>

        {imgMsg && (
          <p className={`mt-2 text-xs ${imgMsg.ok ? "text-success" : "text-danger"}`}>
            {imgMsg.text}
          </p>
        )}
      </div>

      {/* â”€â”€ Descriptions â”€â”€ */}
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Ð‘Ð¾Ð³Ð¸Ð½Ð¾ Ñ‚Ð°Ð¹Ð»Ð±Ð°Ñ€</span>
        <input
          name="short_description"
          value={v.short_description}
          onChange={(e) => set("short_description", e.target.value)}
          className={field}
        />
      </label>
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={lbl}>Ð”ÑÐ»Ð³ÑÑ€ÑÐ½Ð³Ò¯Ð¹ Ñ‚Ð°Ð¹Ð»Ð±Ð°Ñ€</span>
        <textarea
          name="description"
          rows={3}
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
          className={field}
        />
      </label>

      {/* â”€â”€ Category / Subcategory / Gender â”€â”€ */}
      <label className="block">
        <span className={lbl}>ÐÐ½Ð³Ð¸Ð»Ð°Ð»</span>
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
        <span className={lbl}>Ð”ÑÐ´ Ð°Ð½Ð³Ð¸Ð»Ð°Ð»</span>
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
          <span className={lbl}>Ð¥Ò¯Ð¹Ñ</span>
          <select
            name="gender"
            className={field}
            value={v.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="men">Ð­Ñ€ÑÐ³Ñ‚ÑÐ¹</option>
            <option value="women">Ð­Ð¼ÑÐ³Ñ‚ÑÐ¹</option>
            <option value="unisex">Ð®Ð½Ð¸ÑÐµÐºÑ</option>
            <option value="kids">Ð¥Ò¯Ò¯Ñ…ÑÐ´</option>
          </select>
        </label>
      )}

      {isApparel && (
        <label className="block">
          <span className={lbl}>Ð—Ð°Ð³Ð²Ð°Ñ€ (fit)</span>
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
        <span className={lbl}>Ò®Ð½Ñ (â‚®) *</span>
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
        <span className={lbl}>Ð¥ÑÐ¼Ð´Ñ€Ð°Ð» (%)</span>
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

      <label className="block">
        <span className={lbl}>ÐÐ¸Ð¹Ñ‚ Ð½Ó©Ó©Ñ† (Ñ…Ð¾Ð¾ÑÐ¾Ð½ Ð±Ð¾Ð» Ó©Ð½Ð³Ó©Ð½Ó©Ó©Ñ)</span>
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
          <span className={lbl}>Ð¥ÑÐ¼Ð¶ÑÑÐ½Ò¯Ò¯Ð´ (Ñ‚Ð°ÑÐ»Ð°Ð»Ð°Ð°Ñ€)</span>
          <input
            name="sizes"
            placeholder="S, M, L, XL"
            value={v.sizes}
            onChange={(e) => set("sizes", e.target.value)}
            className={field}
          />
        </label>
      )}

      {/* â”€â”€ Colors (full width, apparel only) â”€â”€ */}
      {isApparel && (
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={lbl}>Ó¨Ð½Ð³Ó©Ð½Ò¯Ò¯Ð´ â€” Ð¼Ó©Ñ€ Ð±Ò¯Ñ€Ñ‚ "ÐÑÑ€|#hex|Ð½Ó©Ó©Ñ†"</span>
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

      {/* â”€â”€ Material / Collection / Season / Tags â”€â”€ */}
      <label className="block">
        <span className={lbl}>ÐœÐ°Ñ‚ÐµÑ€Ð¸Ð°Ð»</span>
        <input
          name="material"
          placeholder="100% Cotton"
          value={v.material}
          onChange={(e) => set("material", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className={lbl}>Ð¦ÑƒÐ³Ð»ÑƒÑƒÐ»Ð³Ð°</span>
        <input
          name="collection"
          placeholder="Urban Essentials"
          value={v.collection}
          onChange={(e) => set("collection", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">        <span className={lbl}>Улирал</span>
        <input
          name="season"
          placeholder="all-season"
          value={v.season}
          onChange={(e) => set("season", e.target.value)}
          className={field}
        />
      </label>
      <label className="block">        <span className={lbl}>Таг (таслалаар)</span>
        <input
          name="tags"
          placeholder="classic, office"
          value={v.tags}
          onChange={(e) => set("tags", e.target.value)}
          className={field}
        />
      </label>

      {/* ── Care (apparel only) ── */}
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

      {/* ── Flags + Submit ── */}
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
          {pending
            ? "Хадгалж байна…"
            : uploading
            ? "Зураг хуулж байна…"
            : "Бараа хадгалах"}
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
