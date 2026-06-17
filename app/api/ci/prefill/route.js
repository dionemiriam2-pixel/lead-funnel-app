import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: client, error } = await sb
    .from("clients")
    .select("name, website, industry, description, usp, target_audience, keywords, meta_title, meta_description, brand_color, accent_color, logo_url, brand_font, raw_html, seo_check, testimonials, lead_magnet, garantie")
    .eq("id", client_id)
    .single();

  if (error || !client) return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });

  /* ── Kontext für Claude zusammenbauen ──────────────────────── */
  const ctx = [];
  if (client.name)             ctx.push(`Firmenname: ${client.name}`);
  if (client.website)          ctx.push(`Website: ${client.website}`);
  if (client.industry)         ctx.push(`Branche: ${client.industry}`);
  if (client.description)      ctx.push(`Beschreibung: ${client.description}`);
  if (client.usp)              ctx.push(`USP: ${client.usp}`);
  if (client.target_audience)  ctx.push(`Zielgruppe: ${client.target_audience}`);
  if (client.keywords)         ctx.push(`Keywords: ${client.keywords}`);
  if (client.meta_title)       ctx.push(`Meta-Title: ${client.meta_title}`);
  if (client.meta_description) ctx.push(`Meta-Description: ${client.meta_description}`);
  if (client.brand_color)      ctx.push(`Aktuelle Hauptfarbe: ${client.brand_color}`);
  if (client.accent_color)     ctx.push(`Aktuelle Akzentfarbe: ${client.accent_color}`);
  if (client.logo_url)         ctx.push(`Logo-URL vorhanden: ja`);
  if (client.lead_magnet)      ctx.push(`Lead-Magnet: ${client.lead_magnet}`);
  if (client.garantie)         ctx.push(`Garantie: ${client.garantie}`);

  const testimonials = Array.isArray(client.testimonials) ? client.testimonials : [];
  if (testimonials.length > 0) {
    ctx.push(`Testimonials: ${testimonials.map(t => `"${t.text}" – ${t.name}`).join(" | ")}`);
  }

  /* Rohes HTML: nur erste 3000 Zeichen damit Prompt nicht explodiert */
  const rawSnippet = (client.raw_html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
  if (rawSnippet) ctx.push(`Website-Text (Auszug): ${rawSnippet}`);

  if (ctx.length === 0) {
    return NextResponse.json({ error: "Zu wenig Daten — bitte zuerst die Website analysieren (Profil-Tab → Analysieren)." }, { status: 400 });
  }

  /* ── Claude-Prompt ─────────────────────────────────────────── */
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Du bist ein erfahrener Marken-Stratege. Analysiere die folgenden Daten eines Unternehmens und erstelle ein vollständiges Marken-Briefing.

UNTERNEHMENSDATEN:
${ctx.join("\n")}

Antworte AUSSCHLIESSLICH mit rohem JSON (kein Markdown, keine Code-Fences) in dieser exakten Struktur:
{
  "tonalitaet": "professionell|persoenlich|freundlich|direkt|inspirierend|humorvoll",
  "anrede": "Sie|du",
  "claim": "kurzer Claim/Slogan des Unternehmens",
  "sprache_dos": "3-5 Punkte was die Marke kommunikativ ausmacht, zeilengetrennt",
  "sprache_donts": "3-5 Punkte was die Marke vermeiden sollte, zeilengetrennt",
  "mission": "1-2 Sätze: Warum existiert das Unternehmen?",
  "werte": "3-5 Kernwerte, kommagetrennt",
  "kernbotschaften": ["Botschaft 1", "Botschaft 2", "Botschaft 3"],
  "persona": "Beschreibung der typischen Zielgruppe: Alter, Situation, Bedürfnisse",
  "wettbewerb": "Wer sind typische Wettbewerber und was macht dieses Unternehmen anders?",
  "bildstil": "Wie sollten Bilder/Fotos des Unternehmens aussehen?",
  "ueber_uns": "2-4 Sätze Über-uns-Text im Stil der Marke",
  "brand_color": "${client.brand_color || "#111111"}",
  "accent_color": "${client.accent_color || "#e8600a"}"
}

Wichtig: Leite alles aus den gegebenen Daten ab. Erfinde keine Fakten. Schreibe auf Deutsch.`;

  let raw = "";
  try {
    const msg = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system:     "Du antwortest ausschließlich mit rohem JSON ohne jegliche Erklärungen oder Formatierung.",
      messages:   [{ role: "user", content: prompt }],
    });
    raw = msg.content[0]?.text || "";
    raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const result = JSON.parse(raw);
    return NextResponse.json({ ok: true, suggestions: result });
  } catch (e) {
    console.error("[/api/ci/prefill] Parse-Fehler:", raw.slice(0, 200), e.message);
    return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden. Bitte nochmal versuchen." }, { status: 500 });
  }
}
