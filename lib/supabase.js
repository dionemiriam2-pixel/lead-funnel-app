import { createClient } from "@supabase/supabase-js";

// Nutzt den anon Key – RLS-Policy erlaubt INSERT für Landing-Page-Formulare.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY fehlen (in .env.local bzw. Vercel setzen).");
  }
  return createClient(url, key);
}
