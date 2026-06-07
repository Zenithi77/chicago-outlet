import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "manager" | "staff" | "customer";

export const STAFF_ROLES: Role[] = ["admin", "manager", "staff"];

export type Profile = {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: Role;
};

// Returns the signed-in user's profile (with role), or null when not logged in.
// Cached per request so multiple callers (proxy/layout/pages) share one lookup.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
});

export function isStaff(role: Role | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
