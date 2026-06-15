import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

function auth(req) {
  return req.headers.get("x-pw") === process.env.DASHBOARD_PASSWORD;
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { lead_id } = await req.json();
  const sb = supabaseAdmin();

  const { data: lead } = await sb.from("leads").select("*").eq("id", lead_id).single();
  if (!lead) return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });

  // Website-Inhalt holen (best-effort)
  let websiteContent = "";
  if (lead.website) {
    try {
      const r = await fetch(lead.website, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await r.text();
      // Nur Text extrahieren, kein HTML
      websiteContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000);
    } catch {
      websiteContent = "";
    }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Du bist ein B2B-Lead-Analyst. Analysiere diesen Lead und gib eine strukturierte JSON-Antwort zurück.

Lead-Daten:
- Firmenname: ${lead.company_name}
- Stadt: ${lead.city || "unbekannt"}
- Branche: ${lead.industry || "unbekannt"}
- Website: ${lead.website || "keine"}
${websiteContent ? `\nWebsite-Inhalt (Auszug):\n${websiteContent}` : ""}

Antworte NUR mit diesem JSON (kein Text davor oder danach):
{
  "company_size": "micro|small|medium|large",
  "industry_refined": "präzise Branche auf Deutsch",
  "main_offering": "Was bietet die Firma an? (1 Satz)",
  "pain_points": "Welche Probleme hat diese Firma wahrscheinlich? (1-2 Sätze)",
  "outreach_angle": "Bester Ansatz für Kaltakquise bei dieser Firma (1 Satz)",
  "best_channel": "email|linkedin|phone|ads",
  "score_suggestion": 1-10,
  "score_reason": "Warum dieser Score? (1 Satz)"
}`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  let enriched = {};
  try {
    const text = msg.content[0].text.trim();
    enriched = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  } catch {
    return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 });
  }

  // Lead updaten
  const updates = {
    enriched_data: enriched,
    updated_at: new Date().toISOString(),
  };
  if (enriched.industry_refined && !lead.industry) updates.industry = enriched.industry_refined;
  if (enriched.score_suggestion) updates.score = enriched.score_suggestion;

  await sb.from("leads").update(updates).eq("id", lead_id);

  return NextResponse.json({ ok: true, enriched });
}
