import Link from "next/link";
import { PRODUCTS } from "@/lib/data/products";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { HeroVideo } from "@/components/HeroVideo";
import { ArrowRightIcon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  const newArrivals = PRODUCTS.filter((p) => p.isNewArrival && p.isActive).slice(0, 8);
  const featured = PRODUCTS.filter((p) => p.collection === "Urban Essentials").slice(0, 4);
  const bestSellers = PRODUCTS.filter((p) => p.collection === "Best Sellers" || p.reviewCount > 150).slice(0, 4);
  const onSale = PRODUCTS.filter((p) => p.isOnSale).slice(0, 4);

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

      {/* New Arrivals */}
      <Section title="Шинэ бараа" subtitle="New Arrivals" href="/shop?gender=unisex">
        <Grid products={newArrivals} />
      </Section>

      {/* Featured collection banner */}
      {promo1 && <PromoBanner banner={promo1} variant="image" />}

      <Section title="Онцлох цуглуулга" subtitle="Urban Essentials">
        <Grid products={featured} />
      </Section>

      {/* Sale banner */}
      {promo2 && <PromoBanner banner={promo2} variant="image" />}

      <Section title="Шилдэг борлуулалт" subtitle="Best Sellers">
        <Grid products={bestSellers} />
      </Section>

      {onSale.length > 0 && (
        <Section title="Хямдралтай" subtitle="On Sale" href="/shop?gender=sale">
          <Grid products={onSale} />
        </Section>
      )}
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

function Grid({ products }: { products: typeof PRODUCTS }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
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
