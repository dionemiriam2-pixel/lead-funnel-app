import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// TEMP: Debug-Route — nach Fehlersuche löschen
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "baeumlermarketing-okod";

  let keyOk = false;
  let clientResult = null;
  let lpResult = null;
  let joinResult = null;

  try {
    keyOk = !!process.env.SUPABASE_SERVICE_KEY;
    const sb = supabaseAdmin();

    // Test 1: LP ohne Join
    const { data: lp, error: lpErr } = await sb
      .from("landing_pages")
      .select("id, slug, status, title")
      .eq("slug", slug)
      .single();
    lpResult = { data: lp, error: lpErr?.message ?? null };

    // Test 2: LP mit clients-Join
    const { data: joined, error: joinErr } = await sb
      .from("landing_pages")
      .select("id, slug, status, clients(id, name)")
      .eq("slug", slug)
      .single();
    joinResult = { data: joined, error: joinErr?.message ?? null };

  } catch (e) {
    clientResult = "supabaseAdmin() throw: " + e.message;
  }

  return NextResponse.json({ keyOk, clientResult, lpResult, joinResult });
}
