// Core domain types for Chicago Outlet

export type Gender = "men" | "women" | "unisex" | "kids";
export type Fit = "slim" | "regular" | "relaxed" | "oversized";
export type Currency = "MNT" | "USD";
export type Branch = "park_od" | "riveria" | "online";

export const BRANCH_LABELS: Record<Branch, string> = {
  park_od: "Park-Od",
  riveria: "Riveria",
  online: "Захиалга",
};

export interface ProductColor {
  name: string;
  hex: string;
  stock: number;
}

export interface ProductSizeStock {
  size: string;
  stock: number;
}

export interface Product {
  id: string; // SKU CO-YYYY-NNNN
  name: string;
  slug: string;
  brand: string;
  category: string;
  subcategory: string;
  gender: Gender;
  description: string;
  shortDescription: string;
  price: number;
  currency: Currency;
  discountPercent: number;
  images: string[];
  sizes: string[];
  sizeStocks: ProductSizeStock[]; // per-size stock; empty = use totalStock for all
  colors: ProductColor[];
  tags: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  isActive: boolean;
  careInstructions: string;
  material: string;
  fit: Fit;
  season: string;
  collection: string;
  rating: number;
  reviewCount: number;
  totalStock: number;
  branch?: Branch;  // which store location carries this product
  branchStock?: Record<string, number>; // per-branch stock map
  isOnline?: boolean; // available for online order
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "awaiting_confirmation"
  | "paid"
  | "refunded";

export type PaymentMethod = "qpay";

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  image?: string;
}

export interface Order {
  id: string; // ORD-YYYYMMDD-NNNN
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  currency: Currency;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  shippingMethod: "standard" | "express" | "pickup";
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  appliesTo: "all" | "category" | "product";
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  branch?: Branch;
  isOnline?: boolean;
  size: string;
  color: string;
  colorHex: string;
  qty: number;
  unitPrice: number;
  image: string;
  maxStock: number;
}
