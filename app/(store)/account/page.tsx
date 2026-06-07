import { getProfile, isStaff } from "@/lib/supabase/auth";
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

  return <AccountDashboard profile={profile} staff={isStaff(profile.role)} />;
}
