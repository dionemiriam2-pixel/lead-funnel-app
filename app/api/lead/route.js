import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Empfängt das Landing-Page-Formular und schreibt den Lead in Supabase.
export async function POST(req) {
  try {
    const b = await req.json();

    // Honeypot gegen Spam-Bots
    if (b.website_hp) return NextResponse.json({ ok: true });

    const email = (b.email || "").trim();
    const name = (b.name || "").trim();
    const company = (b.company || "").trim();

    if (!email && !name && !company) {
      return NextResponse.json({ error: "Mindestens Name oder E-Mail nötig" }, { status: 400 });
    }

    // company_name muss eindeutig & nicht leer sein -> Fallback auf E-Mail/Name
    const companyName = company || name || email || ("Lead " + Date.now());

    const row = {
      company_name: companyName,
      contact_name: name || null,
      email: email || null,
      phone: (b.phone || "").trim() || null,
      client: (b.client || "eigene").trim(),
      industry: (b.industry || "").trim() || null,
      lp: (b.lp || "Landing Page").trim(),
      source: "landing-page",
      status: "new",
      score: 7, // Opt-in-Lead = warm
      notes: "Eingang über Landing Page: " + (b.lp || ""),
    };

    const sb = supabaseAdmin();
    const { error } = await sb.from("leads").insert(row);
    // 23505 = Eintrag mit gleichem company_name existiert schon -> als OK behandeln
    if (error && error.code !== "23505") throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
