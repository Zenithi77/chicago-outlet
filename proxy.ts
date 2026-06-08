import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: Middleware is now "Proxy" (proxy.ts). Refreshes the Supabase
// session and guards the /admin area.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Refresh the Supabase session on every page navigation so that the
  // signed-in user is not asked to log in again when they click the profile
  // icon. Static assets and image optimisation are excluded.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map)$).*)",
  ],
};
