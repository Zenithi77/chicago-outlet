import Link from "next/link";
import { PRODUCTS } from "@/lib/data/products";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { HeroVideo } from "@/components/HeroVideo";
import { ArrowRightIcon } from "@/components/Icons";

export default function HomePage() {
  const newArrivals = PRODUCTS.filter((p) => p.isNewArrival && p.isActive).slice(0, 8);
  const featured = PRODUCTS.filter((p) => p.collection === "Urban Essentials").slice(0, 4);
  const bestSellers = PRODUCTS.filter((p) => p.collection === "Best Sellers" || p.reviewCount > 150).slice(0, 4);
  const onSale = PRODUCTS.filter((p) => p.isOnSale).slice(0, 4);

  return (
    <div className="animate-fade-up">
      {/* Hero — cinematic intro reel */}
      <HeroVideo />

      {/* Category grid */}
      <section className="container-page py-14">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Эрэгтэй", href: "/shop?gender=men", seed: "cat-men" },
            { label: "Эмэгтэй", href: "/shop?gender=women", seed: "cat-women" },
            { label: "Юнисекс", href: "/shop?gender=unisex", seed: "cat-unisex" },
            { label: "Хямдрал", href: "/shop?gender=sale", seed: "cat-sale" },
          ].map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg"
            >
              <ProductImage seed={c.seed} label={c.label} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/40" />
              <span className="absolute bottom-4 left-4 font-serif text-xl font-semibold text-white">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <Section title="Шинэ бараа" subtitle="New Arrivals" href="/shop?gender=unisex">
        <Grid products={newArrivals} />
      </Section>

      {/* Featured collection banner */}
      <section className="container-page py-6">
        <div className="relative overflow-hidden rounded-2xl">
          <ProductImage seed="urban-essentials-banner" label="Urban Essentials" className="h-64 w-full md:h-80" />
          <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-black/65 to-transparent px-8 md:px-14">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              Цуглуулга
            </p>
            <h3 className="mt-2 font-serif text-3xl font-bold text-white md:text-4xl">
              Urban Essentials
            </h3>
            <p className="mt-2 max-w-sm text-sm text-white/75">
              Өдөр тутмын төгс суурь — өмссөн бүрдээ илүү сайхан.
            </p>
            <Link
              href="/shop?collection=Urban%20Essentials"
              className="mt-5 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Худалдан авах
            </Link>
          </div>
        </div>
      </section>

      <Section title="Онцлох цуглуулга" subtitle="Urban Essentials">
        <Grid products={featured} />
      </Section>

      {/* Sale banner */}
      <section className="container-page py-8">
        <div className="rounded-2xl bg-foreground px-8 py-10 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Хязгаарлагдмал хугацаа
          </p>
          <h3 className="mt-3 font-serif text-3xl font-bold md:text-4xl">
            Sale & Outlet — 30% хүртэл
          </h3>
          <p className="mt-2 text-white/70">CHICAGO20 кодоор ₮200,000+ захиалгад 20% хямдрал.</p>
          <Link
            href="/shop?gender=sale"
            className="mt-6 inline-block rounded-md bg-accent px-7 py-3 text-sm font-semibold text-foreground hover:bg-white"
          >
            Хямдрал үзэх
          </Link>
        </div>
      </section>

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
