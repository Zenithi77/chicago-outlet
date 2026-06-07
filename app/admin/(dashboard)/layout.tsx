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
  if (!profile) redirect("/admin/login");
  if (!isStaff(profile.role)) redirect("/admin/login?error=forbidden");

  return (
    <AdminShell role={profile.role} name={profile.full_name || profile.email || "Admin"}>
      {children}
    </AdminShell>
  );
}
