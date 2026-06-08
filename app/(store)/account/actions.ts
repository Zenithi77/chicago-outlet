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

// Send OTP code to email for password reset
export async function forgotPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "И-мэйл хаягаа оруулна уу." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    console.error("[forgotPassword] signInWithOtp error:", error);
    return { error: `Код илгээхэд алдаа гарлаа: ${error.message}` };
  }

  return { message: "ok:otp_sent" };
}

// Verify OTP code
export async function verifyOtp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  if (!token) return { error: "Кодоо оруулна уу." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

  if (error) return { error: "Код буруу байна эсвэл хугацаа дууссан. Дахин оролдоно уу." };

  return { message: "ok:verified" };
}

// Set new password after OTP verification (user is now signed in)
export async function resetPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: "Нууц үг шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу." };

  return { message: "ok:done" };
}
