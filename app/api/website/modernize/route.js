import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req) {
  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: client, error } = await db
    .from("clients")
    .select("name, website, description, usp, target_audience, keywords, industry, region, seo_check, raw_html")
    .eq("id", client_id)
    .single();

  if (error || !client) return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });

  if (!client.website) return NextResponse.json({ error: "Keine Website eingetragen." }, { status: 400 });

  /* raw_html kürzen — Claude braucht nur die wichtigsten ~6000 Zeichen */
  const htmlSnippet = client.raw_html
    ? client.raw_html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 6000)
    : "(kein HTML gespeichert — bitte zuerst Website analysieren)";

  const seoSummary = client.seo_check
    ? Object.entries(client.seo_check)
        .filter(([, v]) => v && typeof v === "object" && "vorhanden" in v)
        .map(([k, v]) => `${k}: ${v.vorhanden ? "ja" : "nein"}${v.wert ? ` (${v.wert})` : ""}`)
        .join("\n")
    : "keine SEO-Daten";

  const prompt = `Du bist ein erfahrener Webdesign- und Conversion-Experte für den deutschsprachigen Mittelstand.

KUNDENINFO:
- Firma: ${client.name}
- Branche: ${client.industry || "unbekannt"}
- Region: ${client.region || ""}
- Beschreibung: ${client.description || ""}
- USP: ${client.usp || ""}
- Zielgruppe: ${client.target_audience || ""}
- Keywords: ${client.keywords || ""}
- Website: ${client.website}

SEO-CHECK:
${seoSummary}

WEBSITE-TEXT (extrahiert):
${htmlSnippet}

Analysiere die Website und erstelle eine strukturierte Bewertung. Antworte AUSSCHLIESSLICH mit diesem JSON (kein Markdown, kein Text davor/danach):

{
  "staerken": [
    "konkrete Stärke 1",
    "konkrete Stärke 2"
  ],
  "schwaechen": [
    { "problem": "Kurze Beschreibung des Problems", "prioritaet": "hoch|mittel|niedrig", "begruendung": "Warum das ein Problem ist" }
  ],
  "empfehlungen": [
    { "massnahme": "Konkrete Handlung", "prioritaet": "hoch|mittel|niedrig", "aufwand": "gering|mittel|hoch", "wirkung": "Erwarteter Effekt" }
  ],
  "moderne_neufassung": {
    "hero_headline": "Starke, klare Hauptüberschrift (max 8 Wörter)",
    "hero_subheadline": "Erklärung in 1-2 Sätzen, die Zielgruppe und Nutzen nennt",
    "cta_text": "Button-Text (max 5 Wörter)",
    "sektionen": [
      { "name": "Sektionsname", "inhalt": "Textentwurf oder Beschreibung was hier stehen soll" }
    ]
  }
}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    system: "Du antwortest ausschließlich mit rohem JSON — kein Markdown, keine Erklärungen, kein Text vor oder nach dem JSON-Objekt.",
    messages: [{ role: "user", content: prompt }],
  });

  let audit;
  try {
    const raw = msg.content[0].text.trim();
    // strip optional markdown code fences
    const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Kein JSON in Antwort");
    audit = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: "KI hat kein gültiges JSON geliefert", raw: msg.content[0]?.text }, { status: 500 });
  }

  /* Ergebnis am Kunden speichern */
  await db.from("clients")
    .update({ website_audit: audit })
    .eq("id", client_id);

  return NextResponse.json({ ok: true, audit });
}
