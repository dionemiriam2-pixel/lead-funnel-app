import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Server-seitiger Client (API-Routen): service_role Key umgeht RLS
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!URL || !key) throw new Error("Supabase-Env fehlt.");
  return createClient(URL, key);
}

// Client-seitiger Client (Landing Pages): anon Key
export function supabasePublic() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!URL || !key) throw new Error("Supabase-Env fehlt.");
  return createClient(URL, key);
}
