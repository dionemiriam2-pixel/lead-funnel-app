import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Öffentlicher Endpunkt — kein verifyAuth (Landing Page ist anon zugänglich)
export async function POST(req) {
  try {
    const b = await req.json();

    // Honeypot gegen Spam-Bots
    if (b.website_hp) return NextResponse.json({ ok: true });

    const slug  = (b.lp    || "").trim();
    const email = (b.email || "").trim();
    const name  = (b.name  || "").trim();

    if (!email && !name) {
      return NextResponse.json({ error: "Name oder E-Mail erforderlich." }, { status: 400 });
    }

    const sb = supabaseAdmin();

    // 1. Landingpage-Zeile laden → client_id + LP-Name
    let client_id = null;
    let lpName    = slug;
    if (slug) {
      const { data: lpRow } = await sb
        .from("landing_pages")
        .select("client_id, name")
        .eq("slug", slug)
        .single();
      if (lpRow) {
        client_id = lpRow.client_id || null;
        lpName    = lpRow.name      || slug;
      }
    }

    // 2. Lead einfügen
    const row = {
      contact_name:    name                         || null,
      company_name:    (b.company || "").trim()     || name || email,
      email:           email                        || null,
      phone:           (b.phone  || "").trim()      || null,
      client_id,
      client:          (b.client || "").trim()      || null,
      industry:        (b.industry || "").trim()    || null,
      lp:              lpName,
      source:          "landingpage",
      source_detail:   slug                         || null,
      notes:           b.notes ? String(b.notes).trim() : null,
      score:           7,
      status:          "new",
      pipeline_status: "neu",
    };

    const { error: insertErr } = await sb.from("leads").insert(row);
    // 23505 = unique-Konflikt → trotzdem Erfolg zurückgeben
    if (insertErr && insertErr.code !== "23505") throw insertErr;

    // 3. leads_count atomar hochzählen (Postgres-Funktion)
    if (slug && !insertErr) {
      await sb.rpc("increment_lp_leads_count", { p_slug: slug });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/lead]", e);
    return NextResponse.json({ error: e.message || "Serverfehler" }, { status: 500 });
  }
}
