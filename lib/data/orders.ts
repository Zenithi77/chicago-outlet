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

// Demo orders for the admin dashboard
export const ORDERS: Order[] = [
  {
    id: "ORD-20250605-0007",
    customer: {
      name: "Болормаа Б.",
      email: "bolormaa@example.mn",
      phone: "88112233",
      address: "Улаанбаатар, СБД, 1-р хороо, Энхтайван 12",
    },
    items: [
      {
        productId: "CO-2025-0008",
        productName: "Chunky Sneakers",
        sku: "CO-2025-0008",
        size: "40",
        color: "White",
        qty: 1,
        unitPrice: 175000,
        subtotal: 175000,
        image: "sneaker-1",
      },
    ],
    subtotal: 175000,
    shippingFee: 0,
    discountAmount: 17500,
    couponCode: "WELCOME10",
    total: 157500,
    currency: "MNT",
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    shippingMethod: "standard",
    trackingNumber: null,
    notes: null,
    createdAt: "2025-06-05T08:30:00Z",
  },
  {
    id: "ORD-20250605-0006",
    customer: {
      name: "Тэмүүлэн Г.",
      email: "temuulen@example.mn",
      phone: "99887766",
      address: "Улаанбаатар, ХУД, 11-р хороо, Чингис өргөн чөлөө 5",
    },
    items: [
      {
        productId: "CO-2025-0004",
        productName: "Heritage Denim Jacket",
        sku: "CO-2025-0004",
        size: "L",
        color: "Indigo",
        qty: 1,
        unitPrice: 148200,
        subtotal: 148200,
        image: "denim-1",
      },
      {
        productId: "CO-2025-0003",
        productName: "Essential Tee",
        sku: "CO-2025-0003",
        size: "L",
        color: "Black",
        qty: 2,
        unitPrice: 35000,
        subtotal: 70000,
        image: "tee-1",
      },
    ],
    subtotal: 218200,
    shippingFee: 8000,
    discountAmount: 0,
    couponCode: null,
    total: 226200,
    currency: "MNT",
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "cash_on_delivery",
    shippingMethod: "express",
    trackingNumber: "CO-TRK-44821",
    notes: "Оройн цагаар хүргүүлэх.",
    createdAt: "2025-06-04T14:10:00Z",
  },
  {
    id: "ORD-20250604-0005",
    customer: {
      name: "Сараа Д.",
      email: "saraa@example.mn",
      phone: "95001122",
      address: "Улаанбаатар, БЗД, 5-р хороо, Их тойруу 30",
    },
    items: [
      {
        productId: "CO-2025-0005",
        productName: "Wrap Midi Dress",
        sku: "CO-2025-0005",
        size: "S",
        color: "Solid Black",
        qty: 1,
        unitPrice: 145000,
        subtotal: 145000,
        image: "dress-1",
      },
    ],
    subtotal: 145000,
    shippingFee: 0,
    discountAmount: 0,
    couponCode: null,
    total: 145000,
    currency: "MNT",
    status: "pending",
    paymentStatus: "awaiting_confirmation",
    paymentMethod: "bank_transfer",
    shippingMethod: "standard",
    trackingNumber: null,
    notes: null,
    createdAt: "2025-06-04T09:45:00Z",
  },
  {
    id: "ORD-20250603-0004",
    customer: {
      name: "Анар М.",
      email: "anar@example.mn",
      phone: "80445566",
      address: "Улаанбаатар, СХД, 20-р хороо, Гандан 8",
    },
    items: [
      {
        productId: "CO-2025-0014",
        productName: "Chelsea Leather Boots",
        sku: "CO-2025-0014",
        size: "42",
        color: "Tan",
        qty: 1,
        unitPrice: 245000,
        subtotal: 245000,
        image: "boot-1",
      },
    ],
    subtotal: 245000,
    shippingFee: 0,
    discountAmount: 49000,
    couponCode: "CHICAGO20",
    total: 196000,
    currency: "MNT",
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    shippingMethod: "standard",
    trackingNumber: "CO-TRK-44719",
    notes: null,
    createdAt: "2025-06-03T11:20:00Z",
  },
  {
    id: "ORD-20250602-0003",
    customer: {
      name: "Жавхлан Т.",
      email: "javhlan@example.mn",
      phone: "94223344",
      address: "Улаанбаатар, ЧД, 3-р хороо, Бага тойруу 14",
    },
    items: [
      {
        productId: "CO-2025-0001",
        productName: "Classic Oxford Shirt",
        sku: "CO-2025-0001",
        size: "M",
        color: "White",
        qty: 1,
        unitPrice: 89000,
        subtotal: 89000,
        image: "oxford-1",
      },
    ],
    subtotal: 89000,
    shippingFee: 0,
    discountAmount: 0,
    couponCode: null,
    total: 89000,
    currency: "MNT",
    status: "cancelled",
    paymentStatus: "refunded",
    paymentMethod: "cash_on_delivery",
    shippingMethod: "standard",
    trackingNumber: null,
    notes: "Хэрэглэгч цуцалсан.",
    createdAt: "2025-06-02T16:05:00Z",
  },
];
