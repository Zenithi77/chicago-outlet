"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, status: string) {
  const profile = await getProfile();
  if (!isStaff(profile?.role)) return { error: "Эрх хүрэхгүй" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  return { ok: true };
}
