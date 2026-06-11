import type { Product } from "../types";

// All products are stored in Supabase — this array is intentionally empty.
export const PRODUCTS: Product[] = [];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 6): Product[] {
  return PRODUCTS.filter(
    (p) => p.id !== product.id && p.isActive && p.category === product.category
  )
    .concat(
      PRODUCTS.filter(
        (p) =>
          p.id !== product.id && p.isActive && p.category !== product.category
      )
    )
    .slice(0, limit);
}
