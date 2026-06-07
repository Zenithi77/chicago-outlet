import { redirect } from "next/navigation";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Already signed in as staff? Skip the login form.
  const profile = await getProfile();
  if (profile && isStaff(profile.role)) redirect("/admin");

  const { next } = await searchParams;

  return <LoginForm next={next?.startsWith("/admin") ? next : "/admin"} />;
}
