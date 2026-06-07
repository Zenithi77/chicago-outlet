/**
 * Create (or promote) an admin account in Supabase Auth.
 *
 *   1. Apply supabase/schema.sql first (creates profiles + roles + trigger).
 *   2. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   3. Optionally set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME to override defaults.
 *   4. Run:  npm run create-admin
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const email = process.env.ADMIN_EMAIL || "admin@chicagooutlet.mn";
const password = process.env.ADMIN_PASSWORD || "Chicago2025!";
const fullName = process.env.ADMIN_NAME || "Store Admin";

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function findUserIdByEmail(target: string): Promise<string | null> {
  // Paginate through users to find an existing account with this email.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === target.toLowerCase()
    );
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  let userId: string | null = null;

  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    // Likely already registered — look it up and reset the password.
    console.log(`User may already exist (${error.message}); looking it up…`);
    userId = await findUserIdByEmail(email);
    if (!userId) throw error;
    await db.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
  } else {
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    throw new Error("Could not resolve the admin user id.");
  }

  // Promote to admin (the signup trigger creates the profile as 'customer').
  const { error: profileErr } = await db
    .from("profiles")
    .upsert(
      { id: userId, email, full_name: fullName, role: "admin" },
      { onConflict: "id" }
    );
  if (profileErr) throw profileErr;

  console.log("✓ Admin account ready");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("  Role:     admin");
  console.log("Sign in at /admin/login");
}

main().catch((err) => {
  console.error("✗ Failed:", err.message ?? err);
  process.exit(1);
});
