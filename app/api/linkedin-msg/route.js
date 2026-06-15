import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

function auth(req) {
  return req.headers.get("x-pw") === process.env.DASHBOARD_PASSWORD;
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { lead_id, client_id } = await req.json();
  const sb = supabaseAdmin();

  const [{ data: lead }, { data: clients }] = await Promise.all([
    sb.from("leads").select("*").eq("id", lead_id).single(),
    sb.from("clients").select("*"),
  ]);

  const client = clients?.find(c => c.id === client_id) || clients?.[0];
  if (!lead) return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Du bist Experte für B2B LinkedIn-Kaltakquise im deutschsprachigen Raum.

Schreibe ZWEI LinkedIn-Nachrichten für diesen Kontakt:

Lead:
- Firma: ${lead.company_name}
- Stadt: ${lead.city || ""}
- Branche: ${lead.industry || ""}
- Website: ${lead.website || ""}
${lead.enriched_data?.main_offering ? `- Was die Firma macht: ${lead.enriched_data.main_offering}` : ""}
${lead.enriched_data?.pain_points ? `- Mögliche Probleme: ${lead.enriched_data.pain_points}` : ""}

Mein Angebot (${client?.name || ""}):
${client?.description || ""}
USP: ${client?.usp || ""}

Antworte NUR mit diesem JSON:
{
  "connection_request": "Kurze Vernetzungsanfrage (max 250 Zeichen, kein Pitch, persönlich, neugierig)",
  "followup_message": "Follow-up Nachricht nach Vernetzung (max 500 Zeichen, konkreter Nutzen, eine Frage am Ende, kein Druck)",
  "search_tip": "Wie findet man den richtigen Ansprechpartner bei dieser Firma auf LinkedIn? (1 Satz)"
}`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 700,
    messages: [{ role: "user", content: prompt }],
  });

  let result = {};
  try {
    result = JSON.parse(msg.content[0].text.trim().match(/\{[\s\S]*\}/)[0]);
  } catch {
    return NextResponse.json({ error: "KI-Fehler" }, { status: 500 });
  }

  // In lead speichern
  await sb.from("leads").update({
    linkedin_msg: result,
    updated_at: new Date().toISOString(),
  }).eq("id", lead_id);

  return NextResponse.json({ ok: true, ...result });
}
