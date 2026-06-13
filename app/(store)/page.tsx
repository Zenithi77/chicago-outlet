import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductSlider } from "@/components/ProductSlider";
import { ProductImage } from "@/components/ProductImage";
import { HeroVideo } from "@/components/HeroVideo";
import { ArrowRightIcon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function fetchActiveProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row): Product => {
      const expiresAt = row.discount_expires_at as string | null | undefined;
      const expired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
      const rawDiscount = row.discount_percent ?? 0;
      return {
        id: row.sku ?? row.id,
        name: row.name,
        slug: row.slug,
        brand: row.brand ?? "Chicago Outlet",
        category: row.category,
        subcategory: row.subcategory ?? "",
        gender: row.gender,
        description: row.description ?? "",
        shortDescription: row.short_description ?? "",
        price: row.price,
        currency: row.currency ?? "MNT",
        discountPercent: expired ? 0 : rawDiscount,
        images: row.images ?? [],
        sizes: row.sizes ?? [],
        sizeStocks: row.size_stocks ?? [],
        colors: row.colors ?? [],
        tags: row.tags ?? [],
        isFeatured: row.is_featured ?? false,
        isNewArrival: row.is_new_arrival ?? false,
        isOnSale: expired ? false : Boolean(row.is_on_sale),
        isActive: row.is_active ?? true,
        careInstructions: row.care_instructions ?? "",
        material: row.material ?? "",
        fit: row.fit ?? "regular",
        season: row.season ?? "all-season",
        collection: row.collection ?? "",
        rating: Number(row.rating ?? 0),
        reviewCount: row.review_count ?? 0,
        totalStock: row.total_stock ?? 0,
        branch: row.branch ?? undefined,
        branchStock: row.branch_stock ?? {},
        isOnline: row.is_online ?? false,
        createdAt: row.created_at,
      };
    });
  } catch {
    return [];
  }
}

async function getHeroSettings(): Promise<Record<string, string>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "hero_park_od",
        "hero_riveria",
        "hero_online",
        "promo1_image",
        "promo1_eyebrow",
        "promo1_eyebrow_color",
        "promo1_title",
        "promo1_subtitle",
        "promo1_cta_label",
        "promo1_cta_href",
        "promo2_image",
        "promo2_eyebrow",
        "promo2_eyebrow_color",
        "promo2_title",
        "promo2_subtitle",
        "promo2_cta_label",
        "promo2_cta_href",
      ]);
    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return map;
  } catch {
    return {};
  }
}

type PromoBanner = {
  image: string;
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

function readPromo(settings: Record<string, string>, prefix: "promo1_" | "promo2_"): PromoBanner | null {
  const b: PromoBanner = {
    image: (settings[`${prefix}image`] ?? "").trim(),
    eyebrow: (settings[`${prefix}eyebrow`] ?? "").trim(),
    eyebrowColor: (settings[`${prefix}eyebrow_color`] ?? "#ffffff").trim(),
    title: (settings[`${prefix}title`] ?? "").trim(),
    subtitle: (settings[`${prefix}subtitle`] ?? "").trim(),
    ctaLabel: (settings[`${prefix}cta_label`] ?? "").trim(),
    ctaHref: (settings[`${prefix}cta_href`] ?? "").trim(),
  };
  // Hide the banner entirely when admin has cleared every field.
  if (!b.image && !b.title && !b.subtitle && !b.eyebrow && !b.ctaLabel) return null;
  return b;
}

export default async function HomePage() {
  const products = await fetchActiveProducts();
  const byCategory = (name: string) =>
    products.filter((p) => p.category === name).slice(0, 12);
  const huvtsas = byCategory("Хувцас");
  const gutal = byCategory("Гутал");
  const gerAhui = byCategory("Гэр ахуй");

  const heroSettings = await getHeroSettings();
  const promo1 = readPromo(heroSettings, "promo1_");
  const promo2 = readPromo(heroSettings, "promo2_");

  const branches = [
    {
      label: "Park-Od Mall",
      href: "/shop?branch=park_od",
      seed: heroSettings["hero_park_od"] || "cat-park-od",
      sub: "Ulaanbaatar, Bayanzurkh, 25 khoroo",
    },
    {
      label: "Parko Riveria",
      href: "/shop?branch=riveria",
      seed: heroSettings["hero_riveria"] || "cat-riveria",
      sub: "Ulaanbaatar, Bayangol, 26 khoroo",
    },
    {
      label: "Захиалга",
      href: "/shop?branch=online",
      seed: heroSettings["hero_online"] || "cat-online",
      sub: "Америкаас щууд ",
    },
  ];

  return (
    <div className="animate-fade-up">
      {/* Hero — cinematic intro reel */}
      <HeroVideo />

      {/* Category grid */}
      <section className="container-page py-14">
        <div className="grid grid-cols-3 gap-3">
          {branches.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group overflow-hidden rounded-lg"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <ProductImage seed={c.seed} label={c.label} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/25" />
              </div>
              <div className="px-1 pt-2 pb-1">
                <span className="block font-serif text-sm font-semibold text-foreground leading-tight">
                  {c.label}
                </span>
                <span className="block text-[11px] text-muted mt-0.5 leading-tight">{c.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Хувцас */}
      <Section title="Хувцас" subtitle="Clothing" href="/shop?category=%D0%A5%D1%83%D0%B2%D1%86%D0%B0%D1%81">
        <ProductSlider products={huvtsas} />
      </Section>

      {/* Featured collection banner */}
      {promo1 && <PromoBanner banner={promo1} variant="image" />}

      <Section title="Гутал" subtitle="Footwear" href="/shop?category=%D0%93%D1%83%D1%82%D0%B0%D0%BB">
        <ProductSlider products={gutal} />
      </Section>

      {/* Sale banner */}
      {promo2 && <PromoBanner banner={promo2} variant="image" />}

      <Section title="Гэр ахуй" subtitle="Home" href="/shop?category=%D0%93%D1%8D%D1%80%20%D0%B0%D1%85%D1%83%D0%B9">
        <ProductSlider products={gerAhui} />
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  href,
  children,
}: {
  title: string;
  subtitle: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container-page py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
            {subtitle}
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold md:text-3xl">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
            Бүгдийг үзэх <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function PromoBanner({ banner, variant }: { banner: PromoBanner; variant: "image" }) {
  void variant;
  return (
    <section className="container-page py-6">
      <div className="relative overflow-hidden rounded-2xl">
        {banner.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.image}
            alt={banner.title}
            className="h-64 w-full object-cover md:h-80"
          />
        ) : (
          <div className="h-64 w-full bg-gradient-to-br from-stone-700 to-stone-500 md:h-80" />
        )}
        <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-black/65 to-transparent px-8 md:px-14">
          {banner.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: banner.eyebrowColor || "#ffffff" }}>
              {banner.eyebrow}
            </p>
          )}
          {banner.title && (
            <h3 className="mt-2 font-serif text-3xl font-bold text-white md:text-4xl">
              {banner.title}
            </h3>
          )}
          {banner.subtitle && (
            <p className="mt-2 max-w-sm text-sm text-white/75">{banner.subtitle}</p>
          )}
          {banner.ctaLabel && banner.ctaHref && (
            <Link
              href={banner.ctaHref}
              className="mt-5 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              {banner.ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
