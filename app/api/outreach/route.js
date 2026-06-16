import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { lead_id, client_id } = await req.json();
  const sb = supabaseAdmin();

  const [{ data: lead }, { data: client }] = await Promise.all([
    sb.from("leads").select("*").eq("id", lead_id).single(),
    sb.from("clients").select("*").eq("id", client_id).single(),
  ]);

  if (!lead || !client) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const prompt = `Schreibe eine kurze, professionelle Kaltakquise-E-Mail auf Deutsch.

Absender (Anbieter): ${client.name}
Angebot: ${client.description || ""} — USP: ${client.usp || ""}

Empfänger (Zielfirma): ${lead.company_name}
Branche: ${lead.industry || lead.category || ""}
Ort: ${lead.city || ""}
Produkt-Anlass: ${lead.product || ""}

Regeln:
- Maximal 5 Sätze
- Persönlich und relevant (Bezug auf die Branche)
- Klar was wir anbieten und warum es für sie passt
- Call-to-Action: kurzes Gespräch anfragen
- Kein Spam-Ton, kein Druck
- Unterschrift mit [Dein Name] als Platzhalter

Gib NUR den E-Mail-Text zurück, keine Erklärungen.`;

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const aiData = await aiRes.json();
  const text = aiData.content?.[0]?.text || "";

  await sb.from("leads").update({ outreach_text: text, updated_at: new Date().toISOString() }).eq("id", lead_id);

  return NextResponse.json({ ok: true, text });
}
