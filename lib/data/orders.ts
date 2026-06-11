import type { Coupon, Order } from "../types";

export const COUPONS: Coupon[] = [
  {
    code: "WELCOME10",
    type: "percent",
    value: 10,
    minOrder: 0,
    maxUses: null,
    usedCount: 142,
    expiresAt: null,
    isActive: true,
    appliesTo: "all",
  },
  {
    code: "CHICAGO20",
    type: "percent",
    value: 20,
    minOrder: 200000,
    maxUses: 500,
    usedCount: 89,
    expiresAt: "2025-12-31T23:59:59Z",
    isActive: true,
    appliesTo: "all",
  },
  {
    code: "FREESHIP",
    type: "fixed",
    value: 8000,
    minOrder: 0,
    maxUses: null,
    usedCount: 320,
    expiresAt: null,
    isActive: true,
    appliesTo: "all",
  },
];

export function validateCoupon(
  code: string,
  subtotal: number
): { ok: boolean; coupon?: Coupon; message: string; discount: number } {
  const coupon = COUPONS.find(
    (c) => c.code.toUpperCase() === code.trim().toUpperCase()
  );
  if (!coupon) {
    return { ok: false, message: "Купон код олдсонгүй.", discount: 0 };
  }
  if (!coupon.isActive) {
    return { ok: false, message: "Энэ купон идэвхгүй байна.", discount: 0 };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { ok: false, message: "Купоны хугацаа дууссан.", discount: 0 };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, message: "Купоны хэрэглээний хязгаар дууссан.", discount: 0 };
  }
  if (subtotal < coupon.minOrder) {
    return {
      ok: false,
      message: `Энэ купон ₮${coupon.minOrder.toLocaleString()}+ захиалгад хүчинтэй.`,
      discount: 0,
    };
  }
  const discount =
    coupon.type === "percent"
      ? Math.round(subtotal * (coupon.value / 100))
      : coupon.value;
  return {
    ok: true,
    coupon,
    message: `Купон амжилттай! -₮${discount.toLocaleString()}`,
    discount,
  };
}


// Orders are fetched from Supabase at runtime
export const ORDERS: Order[] = [];
