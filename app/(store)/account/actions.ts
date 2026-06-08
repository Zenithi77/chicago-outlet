"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string } | undefined;

function safeNext(next: string | null): string {
  if (next && next.startsWith("/")) return next;
  return "/account";
}

// Email/password sign-in for any customer or staff member.
export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Имэйл болон нууц үгээ оруулна уу." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Имэйл эсвэл нууц үг буруу байна." };
  }

  redirect(next);
}

// Customer self-registration. The DB trigger creates a profile (role=customer).
export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!fullName || !email || !password) {
    return { error: "Бүх талбарыг бөглөнө үү." };
  }
  if (password.length < 8) {
    return { error: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { error: error.message || "Бүртгэл үүсгэхэд алдаа гарлаа." };
  }

  // If email confirmation is required there is no active session yet.
  if (!data.session) {
    return {
      message:
        "Бүртгэл амжилттай! И-мэйл хаягаа баталгаажуулаад нэвтэрнэ үү.",
    };
  }

  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/account");
}

// Send password reset email
export async function forgotPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "И-мэйл хаягаа оруулна уу." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.chicagooutlet.mn"}/account/reset-password`,
  });

  if (error) return { error: "И-мэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу." };

  return { message: "Нууц үг шинэчлэх холбоос и-мэйлд таны хаяг руу илгээгдлээ." };
}

// Set new password (called from /account/reset-password page)
export async function resetPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: "Нууц үг шинэчлэхэд алдаа гарлаа. Холбоос хугацаа дууссан байж магадгүй." };

  return { message: "Нууц үг амжилттай шинэчлэгдлээ! Одоо нэвтэрч болно." };
}
