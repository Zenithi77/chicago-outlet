"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STAFF_ROLES } from "@/lib/supabase/auth";

export type LoginState = { error: string } | undefined;

// Email/password sign-in for the admin area. Only staff roles
// (admin / manager / staff) are allowed through.
export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Имэйл болон нууц үгээ оруулна уу." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Имэйл эсвэл нууц үг буруу байна." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (!role || !STAFF_ROLES.includes(role as never)) {
    await supabase.auth.signOut();
    return { error: "Танд админ хэсэгт нэвтрэх эрх алга." };
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
