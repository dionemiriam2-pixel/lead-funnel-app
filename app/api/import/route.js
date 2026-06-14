import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function auth(req) {
  return req.headers.get("x-pw") === process.env.DASHBOARD_PASSWORD;
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { rows, client, source } = await req.json();
  if (!rows?.length) return NextResponse.json({ error: "Keine Daten" }, { status: 400 });

  const sb = supabaseAdmin();
  const mapped = rows.map(r => ({
    company_name: r.company_name || r.firma || r.name || ("Import " + Date.now()),
    contact_name: r.contact_name || r.ansprechpartner || null,
    email: r.email || null,
    phone: r.phone || r.telefon || null,
    website: r.website || null,
    city: r.city || r.ort || null,
    category: r.category || r.branche || null,
    industry: r.industry || null,
    source: source || "csv-import",
    source_detail: r.quelle || null,
    client: client || r.client || null,
    product: r.product || null,
    score: Number(r.score) || 5,
    status: "new",
    pipeline_status: "neu",
    notes: r.notes || r.notizen || null,
  }));

  const { error, count } = await sb.from("leads").upsert(mapped, { onConflict: "company_name" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, imported: mapped.length });
}
