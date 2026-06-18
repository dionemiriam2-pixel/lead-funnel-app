import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { client_id, message_id, subject, from: fromHeader, body } = await req.json();
  if (!client_id || !body) return NextResponse.json({ error: "client_id und body erforderlich" }, { status: 400 });

  /* ── KI: Kontaktdaten aus Mail-Body extrahieren ─────────── */
  const prompt = `Extrahiere Kontaktdaten aus dieser E-Mail und antworte NUR als JSON.

Betreff: ${subject || "–"}
Von: ${fromHeader || "–"}
Inhalt:
${body.slice(0, 2000)}

Extrahiere folgende Felder (null wenn nicht vorhanden):
{
  "contact_name": "Vor- und Nachname des Absenders",
  "company_name": "Firmenname falls genannt",
  "email": "E-Mail-Adresse des Absenders (nicht die Empfänger-Adresse)",
  "phone": "Telefonnummer falls genannt",
  "notes": "1 Satz Zusammenfassung: worum geht es in der Anfrage",
  "ist_anfrage": true
}

Falls keine sinnvollen Kontaktdaten erkennbar (z.B. Newsletter, Spam, System-Mail): { "ist_anfrage": false }`;

  let extracted;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await res.json();
    const text = json.content?.[0]?.text || "";
    extracted = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  } catch {
    return NextResponse.json({ error: "KI-Extraktion fehlgeschlagen" }, { status: 500 });
  }

  if (!extracted.ist_anfrage) {
    return NextResponse.json({ skipped: true, reason: "Keine Kontaktanfrage erkannt" });
  }

  /* ── E-Mail-Adresse aus From-Header als Fallback ─────────── */
  const emailFromHeader = fromHeader?.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)?.[0] || null;
  const nameFromHeader  = fromHeader?.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || null;

  /* ── Lead in Supabase anlegen ───────────────────────────── */
  const sb = supabaseAdmin();
  const { data: existing } = await sb
    .from("leads")
    .select("id")
    .eq("client_id", client_id)
    .eq("email", extracted.email || emailFromHeader || "")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ skipped: true, reason: "Lead mit dieser E-Mail existiert bereits", existing_id: existing.id });
  }

  const { data: lead, error } = await sb.from("leads").insert({
    client_id,
    contact_name:    extracted.contact_name || nameFromHeader || null,
    company_name:    extracted.company_name || extracted.contact_name || nameFromHeader || null,
    email:           extracted.email        || emailFromHeader || null,
    phone:           extracted.phone        || null,
    notes:           [extracted.notes, `Betreff: ${subject || "–"}`, `Gmail-ID: ${message_id || "–"}`].filter(Boolean).join("\n"),
    source:          "email",
    source_detail:   subject || null,
    pipeline_status: "kalt",
    score:           5,
    status:          "new",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: lead });
}
