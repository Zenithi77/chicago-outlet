/**
 * Seed Supabase with the demo data from lib/data.
 *
 *   1. Apply supabase/schema.sql first (SQL Editor or `supabase db push`).
 *   2. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   3. Run:  npm run seed
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { CATEGORIES } from "../lib/data/categories";
import { PRODUCTS } from "../lib/data/products";
import { COUPONS, ORDERS } from "../lib/data/orders";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function seedCategories() {
  const rows = CATEGORIES.flatMap((c, i) => [
    {
      name: c.name,
      name_mn: c.nameMn,
      slug: c.slug,
      parent_slug: null,
      sort_order: i,
    },
    ...(c.children ?? []).map((child, j) => ({
      name: child.name,
      name_mn: child.nameMn,
      slug: child.slug,
      parent_slug: c.slug,
      sort_order: j,
    })),
  ]);

  const { error } = await db.from("categories").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✓ categories: ${rows.length}`);
}

async function seedProducts() {
  const rows = PRODUCTS.map((p) => ({
    sku: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    gender: p.gender,
    description: p.description,
    short_description: p.shortDescription,
    price: p.price,
    currency: p.currency,
    discount_percent: p.discountPercent,
    images: p.images,
    sizes: p.sizes,
    colors: p.colors,
    tags: p.tags,
    is_featured: p.isFeatured,
    is_new_arrival: p.isNewArrival,
    is_on_sale: p.isOnSale,
    is_active: p.isActive,
    care_instructions: p.careInstructions,
    material: p.material,
    fit: p.fit,
    season: p.season,
    collection: p.collection,
    rating: p.rating,
    review_count: p.reviewCount,
    total_stock: p.totalStock,
    created_at: p.createdAt,
  }));

  const { error } = await db.from("products").upsert(rows, { onConflict: "sku" });
  if (error) throw error;
  console.log(`✓ products: ${rows.length}`);
}

async function seedCoupons() {
  const rows = COUPONS.map((c) => ({
    code: c.code,
    type: c.type,
    value: c.value,
    min_order: c.minOrder,
    max_uses: c.maxUses,
    used_count: c.usedCount,
    expires_at: c.expiresAt,
    is_active: c.isActive,
    applies_to: c.appliesTo,
  }));

  const { error } = await db.from("coupons").upsert(rows, { onConflict: "code" });
  if (error) throw error;
  console.log(`✓ coupons: ${rows.length}`);
}

async function seedOrders() {
  const orderRows = ORDERS.map((o) => ({
    id: o.id,
    customer_name: o.customer.name,
    customer_email: o.customer.email,
    customer_phone: o.customer.phone,
    customer_address: o.customer.address,
    subtotal: o.subtotal,
    shipping_fee: o.shippingFee,
    discount_amount: o.discountAmount,
    coupon_code: o.couponCode,
    total: o.total,
    currency: o.currency,
    status: o.status,
    payment_status: o.paymentStatus,
    payment_method: o.paymentMethod,
    shipping_method: o.shippingMethod,
    tracking_number: o.trackingNumber,
    notes: o.notes,
    created_at: o.createdAt,
  }));

  const { error: orderErr } = await db
    .from("orders")
    .upsert(orderRows, { onConflict: "id" });
  if (orderErr) throw orderErr;

  const itemRows = ORDERS.flatMap((o) =>
    o.items.map((it) => ({
      order_id: o.id,
      product_name: it.productName,
      sku: it.sku,
      size: it.size,
      color: it.color,
      qty: it.qty,
      unit_price: it.unitPrice,
      subtotal: it.subtotal,
      image: it.image ?? null,
    }))
  );

  // Replace items for these orders to keep the seed idempotent.
  await db.from("order_items").delete().in(
    "order_id",
    ORDERS.map((o) => o.id)
  );
  const { error: itemErr } = await db.from("order_items").insert(itemRows);
  if (itemErr) throw itemErr;

  console.log(`✓ orders: ${orderRows.length} (items: ${itemRows.length})`);
}

async function main() {
  console.log("Seeding Supabase…");
  await seedCategories();
  await seedProducts();
  await seedCoupons();
  await seedOrders();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
