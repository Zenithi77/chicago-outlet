import { redirect } from "next/navigation";
import { getProfile, isStaff } from "@/lib/supabase/auth";
import { AdminShell } from "./AdminShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  // Authoritative guard. The proxy only does an optimistic logged-in check.
  // Auth happens on the shared /account page; non-staff are sent there.
  if (!profile) redirect("/account?next=/admin");
  if (!isStaff(profile.role)) redirect("/account");

  return (
    <AdminShell role={profile.role} name={profile.full_name || profile.email || "Admin"}>
      {children}
    </AdminShell>
  );
}
