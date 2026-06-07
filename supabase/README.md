# Supabase холболтын заавар

Энэ хавтас нь Chicago Outlet төслийн Supabase өгөгдлийн санг агуулна.

## 1. Supabase төсөл үүсгэх

1. https://supabase.com → **New project** үүсгэнэ.
2. Project үүсэхэд **Project Settings → API** хэсгээс дараах 3 утгыг ав:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (нууц! browser-т гаргахгүй)

## 2. Env тохируулах

`.env.local` файлыг нээж бодит утгуудаа бичнэ (template нь `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

> `.env.local` нь `.gitignore`-д орсон тул git-д commit хийгдэхгүй.

## 3. Schema (хүснэгтүүд) үүсгэх

Supabase Dashboard → **SQL Editor** → `New query` → `supabase/schema.sql`-ийн
агуулгыг хуулж тавиад **Run** дар.

Үүсэх хүснэгтүүд:

| Хүснэгт | Зориулалт |
| --- | --- |
| `categories` | Ангилал (parent/child) |
| `products` | Бараа (SKU, өнгө, размер, нөөц) |
| `coupons` | Купон код |
| `customers` | Үйлчлүүлэгч |
| `orders` | Захиалга |
| `order_items` | Захиалгын мөр бүр |

RLS (Row Level Security) идэвхтэй: storefront нь идэвхтэй бараа/ангилал/купоныг
уншиж чадна; захиалга бичих нь server (service-role key) дээгүүр явна.

## 4. Demo дата оруулах (seed)

```powershell
npm run seed
```

Энэ нь `lib/data/`-д байгаа demo бараа, ангилал, купон, захиалгыг
Supabase руу хуулна. Дахин ажиллуулахад давхцахгүй (upsert).

## 5. Код дотроос ашиглах

```ts
// Client Component дотор
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server Component / Route Handler дотор
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Admin mutation (server-only, RLS алгасна)
import { createAdminClient } from "@/lib/supabase/admin";
const admin = createAdminClient();
```

Жишээ бараа татах:

```ts
const supabase = await createClient();
const { data: products } = await supabase
  .from("products")
  .select("*")
  .eq("is_active", true);
```
