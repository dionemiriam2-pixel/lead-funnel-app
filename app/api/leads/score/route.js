import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: lead, error: fetchErr } = await sb.from("leads").select("*").eq("id", id).single();
  if (fetchErr || !lead) return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });

  const qual = lead.qualifizierung || {};
  const prompt = `Du bist ein B2B-Sales-Experte. Bewerte diesen Lead auf einer Skala von 0–100 und gib exakt 1 Satz Begründung.

Lead-Daten:
- Firma: ${lead.company_name || "–"}
- Branche: ${lead.industry || lead.category || "–"}
- Quelle: ${lead.source || "–"} ${lead.source_detail ? `(${lead.source_detail})` : ""}
- Kampagne: ${lead.campaign || "–"}
- Geschätzter Auftragswert: ${lead.estimated_value ? `${lead.estimated_value} EUR` : "unbekannt"}
- Qualifizierung:
  - Budget: ${qual.budget || "–"}
  - Bedarf: ${qual.bedarf || "–"}
  - Zeitrahmen: ${qual.zeitrahmen || "–"}
  - Entscheider: ${qual.entscheider === true ? "Ja" : qual.entscheider === false ? "Nein" : "–"}
- Pipeline-Status: ${lead.pipeline_status || "–"}
- Bisheriger Score: ${lead.score ?? "–"}

Antworte NUR als JSON: { "score": <Zahl 0-100>, "reason": "<1 Satz auf Deutsch>" }`;

  let aiScore = null;
  let aiReason = null;

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const aiJson = await aiRes.json();
    const text = aiJson.content?.[0]?.text || "";
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
    aiScore  = typeof parsed.score  === "number" ? Math.min(100, Math.max(0, Math.round(parsed.score))) : null;
    aiReason = typeof parsed.reason === "string" ? parsed.reason.trim() : null;
  } catch {
    return NextResponse.json({ error: "KI-Auswertung fehlgeschlagen" }, { status: 500 });
  }

  if (aiScore === null) return NextResponse.json({ error: "Kein Score erhalten" }, { status: 500 });

  const { error: updateErr } = await sb.from("leads")
    .update({ score: aiScore, score_reason: aiReason, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ score: aiScore, reason: aiReason });
}
