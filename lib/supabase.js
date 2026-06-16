import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Server-seitiger Client (API-Routen): service_role Key umgeht RLS
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPA_URL || !key) throw new Error("SUPABASE_SERVICE_KEY fehlt.");
  return createClient(SUPA_URL, key, { auth: { persistSession: false } });
}

// Browser-Client (Login / Auth / Landing Pages): anon Key, Singleton
let _browser = null;
export function supabaseBrowser() {
  if (typeof window === "undefined") throw new Error("supabaseBrowser nur im Browser.");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPA_URL || !key) throw new Error("Supabase-Env fehlt.");
  if (!_browser) _browser = createClient(SUPA_URL, key);
  return _browser;
}

// API-Routen: JWT aus Authorization-Header prüfen
export async function verifyAuth(req) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const { data: { user }, error } = await supabaseAdmin().auth.getUser(token);
  return !error && !!user;
}
