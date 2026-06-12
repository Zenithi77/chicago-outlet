import { getProfile, isStaff } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "./AuthCard";
import { AccountDashboard } from "./AccountDashboard";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const profile = await getProfile();
  const { next } = await searchParams;

  if (!profile) {
    return <AuthCard next={next?.startsWith("/") ? next : "/account"} />;
  }

  // Fetch real orders for this user
  let orders: {
    id: string;
    created_at: string;
    status: string;
    total: number;
    items: { product_name: string; qty: number }[];
  }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, created_at, status, total, order_items(product_name, qty)")
      .eq("customer_email", profile.email)
      .order("created_at", { ascending: false })
      .limit(20);
    orders = (data ?? []).map((o: any) => ({
      id: o.id,
      created_at: o.created_at,
      status: o.status,
      total: o.total,
      items: o.order_items ?? [],
    }));
  } catch {
    // ignore — show empty list
  }

  return <AccountDashboard profile={profile} staff={isStaff(profile.role)} orders={orders} />;
}
