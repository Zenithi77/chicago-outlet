"use client";

import { useRef, useState, useTransition } from "react";
import { saveHeroUrl, saveSetting, saveSettings, type HeroKey } from "./actions";
import { UploadIcon, CloseIcon } from "@/components/Icons";
import { classNames } from "@/lib/utils";
import { CATEGORIES, BRANDS } from "@/lib/data/categories";

const SLOTS: { key: HeroKey; label: string; sub: string }[] = [
  { key: "hero_park_od", label: "Park-Od Mall", sub: "Дэлгүүрийн зураг" },
  { key: "hero_riveria", label: "Parko Riveria", sub: "Дэлгүүрийн зураг" },
  { key: "hero_online",  label: "Захиалга / Онлайн", sub: "Захиалгын баннер зураг" },
];

function HeroSlot({
  slot,
  initialUrl,
}: {
  slot: (typeof SLOTS)[number];
  initialUrl: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const notify = (ok: boolean, msg?: string) => {
    setError(ok ? null : (msg ?? "Алдаа гарлаа."));
    setSuccess(ok);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleFile = (file: File) => {
    startTransition(async () => {
      // Upload via the existing /api/upload route (handles Cloudinary)
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return notify(false, data.error ?? "Upload амжилтгүй болсон.");
      }
      const { urls } = await res.json();
      const uploadedUrl: string = urls?.[0];
      if (!uploadedUrl) return notify(false, "URL хүлээж авсангүй.");

      const saveRes = await saveHeroUrl(slot.key, uploadedUrl);
      if (saveRes.error) return notify(false, saveRes.error);
      setUrl(uploadedUrl);
      notify(true);
    });
  };

  const handleUrlSave = () => {
    if (!urlInput.trim()) return;
    startTransition(async () => {
      const res = await saveHeroUrl(slot.key, urlInput.trim());
      if (res.error) return notify(false, res.error);
      setUrl(urlInput.trim());
      setUrlInput("");
      notify(true);
    });
  };

  return (
    <div className="rounded-xl border bg-surface p-5 space-y-4">
      <div>
        <p className="font-semibold text-sm">{slot.label}</p>
        <p className="text-xs text-muted">{slot.sub}</p>
      </div>

      {/* Preview */}
      <div className="relative aspect-[3/4] w-40 overflow-hidden rounded-lg border bg-background">
        {url ? (
          <>
            <img src={url} alt={slot.label} className="h-full w-full object-cover" />
            <button
              onClick={() => {
                startTransition(async () => {
                  const res = await saveHeroUrl(slot.key, "");
                  if (!res.error) setUrl("");
                });
              }}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
              title="Зураг устгах"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
            <UploadIcon className="h-8 w-8 opacity-40" />
            <span className="text-xs">Зураг байхгүй</span>
          </div>
        )}
      </div>

      {/* File upload */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={classNames(
            "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition",
            pending ? "opacity-50 cursor-not-allowed" : "hover:bg-background"
          )}
        >
          <UploadIcon className="h-4 w-4" />
          {pending ? "Ачааллаж байна…" : "Файл сонгох"}
        </button>
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://... URL оруулах"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={handleUrlSave}
          disabled={pending || !urlInput.trim()}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:opacity-80"
        >
          Хадгалах
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">✓ Амжилттай хадгалагдлаа.</p>}
    </div>
  );
}

export function HeroSettingsClient({
  settings,
}: {
  settings: Record<string, string>;
}) {
  return (
    <div className="space-y-12">
      {/* === Section 1: Branch hero images === */}
      <section>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Нүүр хуудасны баннер</h1>
          <p className="mt-1 text-sm text-muted">
            3 салбарын баннер зургийг доороос удирдана. Файл upload хийх эсвэл гадаад URL ашиглана.
            <br />
            Санал болгох хэмжээ: <span className="font-medium">1200×1600 px (3:4)</span>.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SLOTS.map((slot) => (
            <HeroSlot
              key={slot.key}
              slot={slot}
              initialUrl={settings[slot.key] ?? ""}
            />
          ))}
        </div>
      </section>

      {/* === Section 3: Two promotional banners === */}
      <PromoBannerSection
        index={1}
        initial={{
          image: settings.promo1_image ?? "",
          eyebrow: settings.promo1_eyebrow ?? "",
          eyebrow_color: settings.promo1_eyebrow_color ?? "#ffffff",
          title: settings.promo1_title ?? "",
          subtitle: settings.promo1_subtitle ?? "",
          cta_label: settings.promo1_cta_label ?? "",
          cta_href: settings.promo1_cta_href ?? "",
        }}
      />
      <PromoBannerSection
        index={2}
        initial={{
          image: settings.promo2_image ?? "",
          eyebrow: settings.promo2_eyebrow ?? "",
          eyebrow_color: settings.promo2_eyebrow_color ?? "#ffffff",
          title: settings.promo2_title ?? "",
          subtitle: settings.promo2_subtitle ?? "",
          cta_label: settings.promo2_cta_label ?? "",
          cta_href: settings.promo2_cta_href ?? "",
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Announcement bar                                                       */
/* --------------------------------------------------------------------- */
function AnnouncementSection({
  initial,
}: {
  initial: { announcement_1: string; announcement_2: string; announcement_3: string };
}) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const lines = [values.announcement_1, values.announcement_2, values.announcement_3].filter(
    (s) => s.trim()
  );

  const save = () => {
    startTransition(async () => {
      const res = await saveSettings(values);
      if (res.error) {
        setError(res.error);
        setSuccess(false);
      } else {
        setError(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    });
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Дээд зар (announcement bar)</h2>
        <p className="mt-1 text-sm text-muted">
          Header-ийн дээд талд эргэлдэн харагдах богино зарууд. Хоосон үлдээсэн мөр харагдахгүй.
        </p>
      </div>

      {/* Live preview */}
      <div className="mb-4 rounded-md bg-foreground px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/90">
        {lines.length > 0 ? lines[0] : "— урьдчилсан харагдац —"}
      </div>

      <div className="space-y-3 rounded-xl border bg-surface p-5">
        {([1, 2, 3] as const).map((i) => {
          const key = `announcement_${i}` as keyof typeof values;
          return (
            <div key={i}>
              <label className="mb-1 block text-xs font-medium text-muted">Мөр {i}</label>
              <input
                type="text"
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                placeholder="Жишээ: ₮200,000+ захиалгад үнэгүй хүргэлт"
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                maxLength={120}
              />
            </div>
          );
        })}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={save}
            disabled={pending}
            className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-white disabled:opacity-40 hover:opacity-80"
          >
            {pending ? "Хадгалж байна…" : "Хадгалах"}
          </button>
          {success && <span className="text-xs text-green-600">✓ Амжилттай</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- */
/* Promo banner                                                           */
/* --------------------------------------------------------------------- */
type PromoFields = {
  image: string;
  eyebrow: string;
  eyebrow_color: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
};

function PromoBannerSection({
  index,
  initial,
}: {
  index: 1 | 2;
  initial: PromoFields;
}) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const prefix = `promo${index}_`;
  const set = (k: keyof PromoFields, v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  const notify = (ok: boolean, msg?: string) => {
    setError(ok ? null : (msg ?? "Алдаа гарлаа."));
    setSuccess(ok);
    if (ok) setTimeout(() => setSuccess(false), 2500);
  };

  const uploadFile = (file: File) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return notify(false, data.error ?? "Upload амжилтгүй.");
      }
      const { urls } = await res.json();
      const uploadedUrl: string = urls?.[0];
      if (!uploadedUrl) return notify(false, "URL хүлээж авсангүй.");
      set("image", uploadedUrl);
      const saved = await saveSetting(`${prefix}image`, uploadedUrl);
      if (saved.error) return notify(false, saved.error);
      notify(true);
    });
  };

  const saveAll = () => {
    startTransition(async () => {
      const entries: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) entries[`${prefix}${k}`] = v;
      const res = await saveSettings(entries);
      if (res.error) return notify(false, res.error);
      notify(true);
    });
  };

  const removeImage = () => {
    startTransition(async () => {
      set("image", "");
      const res = await saveSetting(`${prefix}image`, "");
      if (res.error) return notify(false, res.error);
      notify(true);
    });
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Promo баннер #{index}</h2>
        <p className="mt-1 text-sm text-muted">
          Нүүр хуудсанд харагдах өргөн баннер. Санал болгох зургийн хэмжээ:{" "}
          <span className="font-medium">1920×640 px (3:1)</span>, JPG/PNG, ≤10MB.
          <br />
          Бүх талбарыг хоосон үлдээвэл энэ баннер харагдахгүй (устгасантай адил).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: image + fields */}
        <div className="space-y-4 rounded-xl border bg-surface p-5">
          {/* Image preview */}
          <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border bg-background">
            {values.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={values.image}
                  alt={values.title}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={removeImage}
                  disabled={pending}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
                  title="Зураг устгах"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
                <UploadIcon className="h-8 w-8 opacity-40" />
                <span className="text-xs">Зураг байхгүй</span>
              </div>
            )}
          </div>

          {/* Upload + URL */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              className={classNames(
                "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition",
                pending ? "opacity-50 cursor-not-allowed" : "hover:bg-background"
              )}
            >
              <UploadIcon className="h-4 w-4" />
              {pending ? "Ачааллаж байна…" : "Зураг сонгох"}
            </button>
            <input
              type="url"
              value={values.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder="эсвэл https://... URL"
              className="min-w-[200px] flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <FieldRow label="Дээд жижиг бичиг (eyebrow)">
            <div className="flex gap-2">
              <input
                type="text"
                value={values.eyebrow}
                onChange={(e) => set("eyebrow", e.target.value)}
                maxLength={60}
                className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
              />
              <input
                type="color"
                value={values.eyebrow_color || "#ffffff"}
                onChange={(e) => set("eyebrow_color", e.target.value)}
                title="Eyebrow өнгө"
                className="h-10 w-12 cursor-pointer rounded-md border p-1"
              />
            </div>
          </FieldRow>

          <FieldRow label="Гарчиг">
            <input
              type="text"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={80}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
            />
          </FieldRow>

          <FieldRow label="Тайлбар">
            <textarea
              rows={2}
              value={values.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              maxLength={160}
              className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
            />
          </FieldRow>

          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Товчны бичиг">
              <input
                type="text"
                value={values.cta_label}
                onChange={(e) => set("cta_label", e.target.value)}
                maxLength={40}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
              />
            </FieldRow>
            <FieldRow label="Товчны линк">
              <LinkPicker value={values.cta_href} onChange={(v) => set("cta_href", v)} />
            </FieldRow>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={saveAll}
              disabled={pending}
              className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-white disabled:opacity-40 hover:opacity-80"
            >
              {pending ? "Хадгалж байна…" : "Хадгалах"}
            </button>
            {success && <span className="text-xs text-green-600">✓ Амжилттай</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        </div>

        {/* Right: live preview */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Урьдчилсан харагдац</p>
          <div className="relative aspect-[3/1] overflow-hidden rounded-2xl border bg-foreground">
            {values.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-700 to-stone-500" />
            )}
            <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-black/65 to-transparent px-6 md:px-10">
              {values.eyebrow && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: values.eyebrow_color || "#ffffff" }}>
                  {values.eyebrow}
                </p>
              )}
              {values.title && (
                <h3 className="mt-1 font-serif text-2xl font-bold text-white md:text-3xl">
                  {values.title}
                </h3>
              )}
              {values.subtitle && (
                <p className="mt-1 max-w-sm text-xs text-white/75 md:text-sm">
                  {values.subtitle}
                </p>
              )}
              {values.cta_label && (
                <span className="mt-4 rounded-md bg-white px-5 py-2 text-xs font-semibold text-foreground">
                  {values.cta_label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Smart link picker for promo banner CTA                                 */
/* --------------------------------------------------------------------- */
type LinkMode = "custom" | "shop" | "sale" | "category" | "subcategory" | "gender" | "brand";

function buildHref(mode: LinkMode, cat: string, sub: string, gender: string, brand: string): string {
  if (mode === "shop") return "/shop";
  if (mode === "sale") return "/shop?gender=sale";
  if (mode === "category") return cat ? `/shop?category=${cat}` : "/shop";
  if (mode === "subcategory") return cat && sub ? `/shop?category=${cat}&subcategory=${sub}` : "/shop";
  if (mode === "gender") return cat && gender ? `/shop?category=${cat}&gender=${gender}` : "/shop";
  if (mode === "brand") return brand ? `/shop?brand=${encodeURIComponent(brand)}` : "/shop";
  return "";
}

function detectMode(href: string): { mode: LinkMode; cat: string; sub: string; gender: string; brand: string } {
  try {
    const u = new URL(href, "http://x");
    const cat = u.searchParams.get("category") ?? "";
    const sub = u.searchParams.get("subcategory") ?? "";
    const gender = u.searchParams.get("gender") ?? "";
    const brand = u.searchParams.get("brand") ?? "";
    if (gender === "sale") return { mode: "sale", cat, sub, gender: "", brand };
    if (brand) return { mode: "brand", cat, sub, gender, brand };
    if (gender && cat) return { mode: "gender", cat, sub, gender, brand };
    if (sub && cat) return { mode: "subcategory", cat, sub, gender, brand };
    if (cat) return { mode: "category", cat, sub, gender, brand };
    if (u.pathname === "/shop") return { mode: "shop", cat, sub, gender, brand };
  } catch { /* ignore */ }
  return { mode: "custom", cat: "", sub: "", gender: "", brand: "" };
}

function LinkPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = detectMode(value);
  const [mode, setMode] = useState<LinkMode>(parsed.mode);
  const [cat, setCat] = useState(parsed.cat);
  const [sub, setSub] = useState(parsed.sub);
  const [gender, setGender] = useState(parsed.gender);
  const [brand, setBrand] = useState(parsed.brand);

  const emit = (m: LinkMode, c = cat, s = sub, g = gender, b = brand) => {
    if (m === "custom") return; // user edits directly
    onChange(buildHref(m, c, s, g, b));
  };

  const changeMode = (m: LinkMode) => {
    setMode(m);
    emit(m, cat, sub, gender, brand);
  };

  const selectedCat = CATEGORIES.find((c) => c.slug === cat);
  const subOptions = selectedCat?.children ?? [];
  const genderOptions = selectedCat?.byGender ?? [];
  const hasGender = genderOptions.length > 0;
  const hasChildren = subOptions.length > 0;

  return (
    <div className="space-y-2">
      <select
        value={mode}
        onChange={(e) => changeMode(e.target.value as LinkMode)}
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="shop">Дэлгүүр (/shop)</option>
        <option value="sale">Хямдрал (/shop?sale=true)</option>
        <option value="category">Категори</option>
        <option value="subcategory">Дэд категори</option>
        <option value="gender">Хүйсийн ангилал (Хувцас)</option>
        <option value="brand">Брэнд</option>
        <option value="custom">Захиалгат URL</option>
      </select>

      {mode === "category" && (
        <select
          value={cat}
          onChange={(e) => { setCat(e.target.value); setSub(""); setGender(""); emit("category", e.target.value, "", ""); }}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">— категори сонгох —</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.nameMn}</option>
          ))}
        </select>
      )}

      {mode === "subcategory" && (
        <>
          <select
            value={cat}
            onChange={(e) => { setCat(e.target.value); setSub(""); emit("subcategory", e.target.value, ""); }}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">— категори сонгох —</option>
            {CATEGORIES.filter((c) => c.children && c.children.length > 0).map((c) => (
              <option key={c.slug} value={c.slug}>{c.nameMn}</option>
            ))}
          </select>
          {subOptions.length > 0 && (
            <select
              value={sub}
              onChange={(e) => { setSub(e.target.value); emit("subcategory", cat, e.target.value); }}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">— дэд категори сонгох —</option>
              {subOptions.map((s) => (
                <option key={s.slug} value={s.slug}>{s.nameMn}</option>
              ))}
            </select>
          )}
        </>
      )}

      {mode === "gender" && (
        <>
          <select
            value={cat}
            onChange={(e) => { setCat(e.target.value); setGender(""); emit("gender", e.target.value, "", ""); }}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">— категори сонгох —</option>
            {CATEGORIES.filter((c) => c.byGender && c.byGender.length > 0).map((c) => (
              <option key={c.slug} value={c.slug}>{c.nameMn}</option>
            ))}
          </select>
          {genderOptions.length > 0 && (
            <select
              value={gender}
              onChange={(e) => { setGender(e.target.value); emit("gender", cat, sub, e.target.value); }}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">— хүйс сонгох —</option>
              {genderOptions.map((g) => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>
          )}
        </>
      )}

      {mode === "brand" && (
        <select
          value={brand}
          onChange={(e) => { setBrand(e.target.value); emit("brand", cat, sub, gender, e.target.value); }}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">— брэнд сонгох —</option>
          {BRANDS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      )}

      {mode === "custom" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/shop?gender=women"
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
        />
      )}

      <p className="text-[11px] text-muted">
        URL: <span className="font-mono">{value || "—"}</span>
      </p>
    </div>
  );
}
