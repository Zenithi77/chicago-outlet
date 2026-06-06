import type { Product } from "./types";

export function formatMNT(value: number): string {
  return `₮${value.toLocaleString("en-US")}`;
}

export function finalPrice(product: Pick<Product, "price" | "discountPercent">): number {
  return Math.round(product.price * (1 - product.discountPercent / 100));
}

export function savings(product: Pick<Product, "price" | "discountPercent">): number {
  return product.price - finalPrice(product);
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// Mongolian 8-digit phone validation (starts 6,7,8,9)
export function isValidMnPhone(phone: string): boolean {
  return /^[6789]\d{7}$/.test(phone.replace(/\s/g, ""));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateOrderId(seq: number): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `ORD-${ymd}-${String(seq).padStart(4, "0")}`;
}
