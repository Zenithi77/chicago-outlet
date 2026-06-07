import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Admin Supabase client — uses the SERVICE ROLE key, which bypasses RLS.
// NEVER import this in a Client Component. Server-only (admin mutations,
// order creation, inventory updates, seeding).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
