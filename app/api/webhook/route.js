import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Webhook-Endpoint für n8n, Make, Zapier etc.
// POST /api/webhook?key=DEIN_WEBHOOK_KEY
export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key !== process.env.WEBHOOK_KEY && key !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const sb = supabaseAdmin();

  const companyName = body.company_name || body.company || body.firma || body.name || ("Lead " + Date.now());

  const row = {
    company_name: companyName,
    contact_name: body.contact_name || body.contact || body.ansprechpartner || null,
    email: body.email || null,
    phone: body.phone || body.telefon || null,
    website: body.website || null,
    city: body.city || body.ort || body.location || null,
    category: body.category || body.branche || null,
    industry: body.industry || body.zielgruppe || null,
    source: body.source || "webhook",
    source_detail: body.source_detail || body.platform || null,
    client: body.client || null,
    product: body.product || null,
    score: Number(body.score) || 6,
    status: "new",
    pipeline_status: "neu",
    notes: body.notes || body.notiz || null,
  };

  const { error } = await sb.from("leads").upsert(row, { onConflict: "company_name" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, received: companyName });
}
