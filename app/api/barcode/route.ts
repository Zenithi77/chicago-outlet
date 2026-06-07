import { NextResponse } from "next/server";

// Maps common English colour names to a hex swatch so scanned items render nicely.
const COLOR_HEX: Record<string, string> = {
  black: "#1A1A1A",
  white: "#F7F7F4",
  red: "#E03131",
  blue: "#1971C2",
  navy: "#1F2A44",
  green: "#2F9E44",
  olive: "#5C6B2F",
  yellow: "#F1C40F",
  gold: "#C9A227",
  orange: "#E8590C",
  purple: "#7048E8",
  pink: "#E64980",
  brown: "#8B5E3C",
  beige: "#E8DCC4",
  cream: "#F3EAD3",
  grey: "#868E96",
  gray: "#868E96",
  silver: "#C0C0C0",
  charcoal: "#36393E",
  burgundy: "#7B2233",
  khaki: "#B6A271",
  tan: "#C8A06B",
};

function colorToHex(name: string): string {
  const key = name.trim().toLowerCase();
  if (COLOR_HEX[key]) return COLOR_HEX[key];
  const hit = Object.keys(COLOR_HEX).find((k) => key.includes(k));
  return hit ? COLOR_HEX[hit] : "#3A3A3A";
}

// Pull recognisable apparel sizes out of a free-text size string.
function parseSizes(raw: string): string[] {
  if (!raw) return [];
  const tokens = raw
    .split(/[,/|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const canon = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const out = new Set<string>();
  for (const t of tokens) {
    const up = t.toUpperCase().replace(/\s+/g, "");
    if (canon.includes(up)) out.add(up);
    else if (/^\d{2,3}$/.test(up)) out.add(up); // numeric (waist/EU) sizes
    else if (up.length <= 4) out.add(up);
  }
  return [...out];
}

function splitColors(raw: string): { name: string; hex: string; stock: number }[] {
  if (!raw) return [];
  return raw
    .split(/[,/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((name) => ({ name, hex: colorToHex(name), stock: 0 }));
}

// A single product shape all providers normalise into.
type RawItem = {
  title?: string;
  brand?: string;
  description?: string;
  category?: string;
  color?: string;
  size?: string;
  images?: string[];
  // barcodelookup.com extra fields
  gender?: string;
  material?: string;
  features?: string[];
  age_group?: string;
};

type Normalised = {
  found: true;
  barcode: string;
  name: string;
  brand: string;
  subcategory: string;
  description: string;
  short_description: string;
  material: string;
  gender: string;
  sizes: string[];
  colors: { name: string; hex: string; stock: number }[];
  images: string[];
  source: string;
};

// Map barcodelookup gender values → our select values.
function normaliseGender(raw?: string): string {
  if (!raw) return "";
  const g = raw.toLowerCase().trim();
  if (g.includes("female") || g.includes("women") || g.includes("girl")) return "women";
  if (g.includes("male") || g.includes("men") || g.includes("boy")) return "men";
  if (g.includes("kid") || g.includes("child") || g.includes("infant") || g.includes("baby")) return "kids";
  if (g.includes("unisex")) return "unisex";
  return "";
}

function normalise(code: string, item: RawItem, source: string): Normalised {
  const images = (item.images ?? []).filter(
    (u) => typeof u === "string" && u.startsWith("http")
  );

  // Build description: base + features list.
  let description = item.description ?? "";
  if (item.features?.length) {
    const feat = item.features.map((f) => `• ${f}`).join("\n");
    description = description ? `${description}\n\n${feat}` : feat;
  }

  // age_group can override gender (e.g. "newborn" → kids).
  const gender = normaliseGender(item.gender) || normaliseGender(item.age_group);

  return {
    found: true,
    barcode: code,
    name: item.title ?? "",
    brand: item.brand ?? "",
    subcategory: item.category?.split(">").pop()?.trim() ?? "",
    description,
    short_description: (item.description ?? "").slice(0, 140),
    material: item.material ?? "",
    gender,
    sizes: parseSizes(item.size ?? ""),
    colors: splitColors(item.color ?? ""),
    images: images.slice(0, 8),
    source,
  };
}

// 1) Primary provider: Barcodelookup.com (needs BARCODELOOKUP_KEY).
async function lookupBarcodeLookup(code: string): Promise<RawItem | null> {
  const key = process.env.BARCODELOOKUP_KEY;
  if (!key) return null; // skip silently if no key configured
  const url = `https://api.barcodelookup.com/v3/products?barcode=${code}&formatted=y&key=${key}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
  if (!res.ok) {
    console.error(
      "[barcode] barcodelookup.com non-OK",
      res.status,
      await res.text().catch(() => "")
    );
    return null;
  }
  const data: {
    products?: {
      barcode_number?: string;
      title?: string;
      brand?: string;
      manufacturer?: string;
      description?: string;
      category?: string;
      color?: string;
      size?: string;
      gender?: string;
      material?: string;
      age_group?: string;
      features?: string[];
      images?: string[];
    }[];
  } = await res.json();
  const p = data.products?.[0];
  if (!p) return null;
  return {
    title: p.title,
    brand: p.brand || p.manufacturer,
    description: p.description,
    category: p.category,
    color: p.color,
    size: p.size,
    gender: p.gender,
    material: p.material,
    age_group: p.age_group,
    features: p.features,
    images: p.images,
  };
}

// 2) Fallback provider: UPCitemdb (free trial works without a key).
async function lookupUpcItemDb(code: string): Promise<RawItem | null> {
  const key = process.env.UPCITEMDB_KEY;
  const endpoint = key
    ? `https://api.upcitemdb.com/prod/v1/lookup?upc=${code}`
    : `https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4500);
  const res = await fetch(endpoint, {
    headers: key ? { user_key: key, key_type: "3scale" } : {},
    next: { revalidate: 86400 },
    signal: ctrl.signal,
  }).finally(() => clearTimeout(t));
  if (!res.ok) return null;
  const data: { items?: RawItem[] } = await res.json();
  return data.items?.[0] ?? null;
}

// 3) Fallback provider: go-upc.com (public, no key needed for occasional use).
async function lookupGoUpc(code: string): Promise<RawItem | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4500);
  const res = await fetch(`https://go-upc.com/api/v1/code/${code}`, {
    next: { revalidate: 86400 },
    signal: ctrl.signal,
    headers: { "user-agent": "ChicagoOutlet/1.0" },
  }).finally(() => clearTimeout(t));
  if (!res.ok) return null;
  const data: {
    product?: {
      name?: string;
      brand?: string;
      description?: string;
      category?: string;
      imageUrl?: string;
      specs?: [string, string][];
    };
  } = await res.json();
  const p = data.product;
  if (!p) return null;
  const specs = p.specs ?? [];
  const findSpec = (re: RegExp) =>
    specs.find(([k]) => re.test(k))?.[1] ?? "";
  return {
    title: p.name,
    brand: p.brand,
    description: p.description,
    category: p.category,
    color: findSpec(/colou?r/i),
    size: findSpec(/size/i),
    images: p.imageUrl ? [p.imageUrl] : [],
  };
}

// GET /api/barcode?code=<ean/upc>
// Tries barcodelookup.com → UPCitemdb → go-upc.com in order. Returns
// normalised, price-free product fields ready to drop into the add-product form.
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";

  if (!/^\d{6,14}$/.test(code)) {
    return NextResponse.json(
      { found: false, error: "Зөв Barcode  оруулна уу." },
      { status: 400 }
    );
  }

  try {
    let item: RawItem | null = null;
    let source = "barcodelookup";
    try {
      item = await lookupBarcodeLookup(code);
    } catch (e) {
      console.error("[barcode] barcodelookup threw", e);
      item = null;
    }

    if (!item) {
      source = "upcitemdb";
      try {
        item = await lookupUpcItemDb(code);
      } catch (e) {
        console.error("[barcode] upcitemdb threw", e);
        item = null;
      }
    }

    if (!item) {
      source = "go-upc";
      try {
        item = await lookupGoUpc(code);
      } catch (e) {
        console.error("[barcode] go-upc threw", e);
        item = null;
      }
    }

    if (!item || (!item.title && !item.brand)) {
      console.warn("[barcode] not found in any provider", code);
      return NextResponse.json({ found: false, barcode: code });
    }

    console.log("[barcode] found via", source, "→", item.title);
    return NextResponse.json(normalise(code, item, source));
  } catch (e) {
    console.error("[barcode] fatal", e);
    return NextResponse.json(
      { found: false, error: "Сүлжээний алдаа. Дахин оролдоно уу." },
      { status: 502 }
    );
  }
}
