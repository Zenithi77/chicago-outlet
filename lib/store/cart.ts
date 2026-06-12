"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  coupon: string | null;
  discount: number;
  shippingMethod: "standard" | "express" | "pickup";
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQty: (
    productId: string,
    size: string,
    color: string,
    qty: number
  ) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setShipping: (method: "standard" | "express" | "pickup") => void;
  subtotal: () => number;
  count: () => number;
}

const MAX_QTY = 10;
const key = (p: string, s: string, c: string) => `${p}__${s}__${c}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      coupon: null,
      discount: 0,
      shippingMethod: "standard",

      addItem: (item) =>
        set((state) => {
          const safeMax = Math.max(1, Number(item.maxStock) || MAX_QTY);
          const safeQty = Math.max(1, Math.min(MAX_QTY, safeMax, item.qty || 1));
          const idx = state.items.findIndex(
            (i) =>
              key(i.productId, i.size, i.color) ===
              key(item.productId, item.size, item.color)
          );
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = {
              ...next[idx],
              qty: Math.min(MAX_QTY, safeMax, next[idx].qty + safeQty),
            };
            return { items: next, isOpen: true };
          }
          return {
            items: [
              ...state.items,
              { ...item, maxStock: safeMax, qty: safeQty },
            ],
            isOpen: true,
          };
        }),

      removeItem: (productId, size, color) =>
        set((state) => ({
          items: state.items.filter(
            (i) => key(i.productId, i.size, i.color) !== key(productId, size, color)
          ),
        })),

      updateQty: (productId, size, color, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            key(i.productId, i.size, i.color) === key(productId, size, color)
              ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, i.maxStock, qty)) }
              : i
          ),
        })),

      clear: () => set({ items: [], coupon: null, discount: 0 }),
      setOpen: (open) => set({ isOpen: open }),
      applyCoupon: (code, discount) => set({ coupon: code, discount }),
      removeCoupon: () => set({ coupon: null, discount: 0 }),
      setShipping: (method) => set({ shippingMethod: method }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "chicago-outlet-cart" }
  )
);
