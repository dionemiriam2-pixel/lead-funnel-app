import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

function slugify(text) {
  return text.toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[äöü]/g, c => ({ ä: "ae", ö: "oe", ü: "ue" }[c]))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function randomSuffix(len = 4) {
  return Math.random().toString(36).slice(2, 2 + len);
}

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const sb = supabaseAdmin();

  const { data: client, error: clientErr } = await sb
    .from("clients")
    .select("id, name, description, usp, target_audience, keywords, region, industry, meta_title, meta_description, seo_check, impressum, datenschutz, lead_magnet, garantie, testimonials, reference_images, brand_font, accent_color, brand_color, logo_url")
    .eq("id", client_id)
    .single();
  if (clientErr || !client) return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });

  // LP-Nummer + eindeutiger Slug
  const { count } = await sb.from("landing_pages")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client_id);
  const lpNr   = (count ?? 0) + 1;
  const name   = `${client.name} – LP ${lpNr}`;
  const base   = slugify(client.name || "lp");
  let slug = null;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    const { data: ex } = await sb.from("landing_pages").select("id").eq("slug", candidate).maybeSingle();
    if (!ex) { slug = candidate; break; }
  }
  if (!slug) return NextResponse.json({ error: "Kein freier Slug" }, { status: 500 });

  // ── Kontext für Claude ────────────────────────────────────
  const hasTestimonials   = Array.isArray(client.testimonials) && client.testimonials.length > 0;
  const hasLeadMagnet     = !!client.lead_magnet;
  const hasGarantie       = !!client.garantie;

  const contextLines = [
    `Kunde: ${client.name}`,
    client.industry        && `Branche: ${client.industry}`,
    client.region          && `Region: ${client.region}`,
    client.description     && `Angebot: ${client.description}`,
    client.usp             && `USP: ${client.usp}`,
    client.target_audience && `Zielgruppe: ${client.target_audience}`,
    client.keywords        && `Keywords: ${client.keywords}`,
    client.lead_magnet     && `Lead-Magnet/Angebot: ${client.lead_magnet}`,
    client.garantie        && `Garantie: ${client.garantie}`,
    hasTestimonials        && `Echte Kundenstimmen: ${client.testimonials.map(t => `"${t.text}" – ${t.name}`).join(" | ")}`,
  ].filter(Boolean).join("\n");

  const prompt = `Du bist ein Top-Conversion-Texter für den deutschsprachigen Mittelstand.

KUNDENPROFIL:
${contextLines}

Erstelle einen kompletten, conversion-optimierten Landing-Page-Inhalt auf Basis aller obigen echten Daten.
Erfinde KEINE Fakten — nutze nur was im Profil steht.

Antworte AUSSCHLIESSLICH mit rohem JSON (kein Markdown):
{
  "headline":       "Hauptüberschrift ≤ 10 Wörter, nutzenorientiert, spezifisch",
  "subheadline":    "2 Sätze: konkreter Nutzen + Zielgruppe",
  "badge":          "Kurzes Trust-Label, max 6 Wörter (z.B. '★ 50+ zufriedene Kunden' oder 'Nr. 1 in [Region]')",
  "cta_text":       "3–5 Wörter, aktiver CTA",
  "urgency":        "Dringlichkeits-Text, max 10 Wörter",
  "process_title":  "Überschrift für den Prozess-Block (z.B. 'In 4 Schritten zum Ergebnis')",
  "usp_blocks": [
    { "titel": "Konkreter Vorteil", "text": "1–2 Sätze", "icon": "passende Emoji" },
    { "titel": "Zweiter Vorteil",   "text": "1–2 Sätze", "icon": "passende Emoji" },
    { "titel": "Dritter Vorteil",   "text": "1–2 Sätze", "icon": "passende Emoji" }
  ],
  "steps": [
    { "n": "01", "title": "Schritt", "text": "1–2 Sätze" },
    { "n": "02", "title": "Schritt", "text": "1–2 Sätze" },
    { "n": "03", "title": "Schritt", "text": "1–2 Sätze" },
    { "n": "04", "title": "Schritt", "text": "1–2 Sätze" }
  ],
  "compare_rows": [
    { "topic": "Aspekt", "without": "Ohne uns", "with": "Mit uns" },
    { "topic": "Aspekt", "without": "Ohne uns", "with": "Mit uns" },
    { "topic": "Aspekt", "without": "Ohne uns", "with": "Mit uns" }
  ],
  "faqs": [
    { "q": "Frage 1?", "a": "Antwort 1." },
    { "q": "Frage 2?", "a": "Antwort 2." },
    { "q": "Frage 3?", "a": "Antwort 3." },
    { "q": "Frage 4?", "a": "Antwort 4." }
  ],
  "stats": [
    { "n": "Zahl", "label": "Bezeichnung" },
    { "n": "Zahl", "label": "Bezeichnung" },
    { "n": "Zahl", "label": "Bezeichnung" },
    { "n": "Zahl", "label": "Bezeichnung" }
  ],
  "review_count": "Zahl als Text",
  "review_text":  "kurzer Erfahrungstext"
}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 3500,
    system:     "Du antwortest ausschließlich mit rohem JSON — kein Markdown, keine Erklärungen.",
    messages:   [{ role: "user", content: prompt }],
  });

  let content;
  try {
    const raw = msg.content[0].text.trim()
      .replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Kein JSON");
    content = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ error: "KI-Antwort ungültig", raw: msg.content[0]?.text?.slice(0, 300) }, { status: 500 });
  }

  // Sicherheitsnetz
  if (!Array.isArray(content.usp_blocks) || content.usp_blocks.length < 3) {
    content.usp_blocks = (content.usp_blocks || []).concat(
      Array(Math.max(0, 3 - (content.usp_blocks?.length || 0))).fill({ titel: "Vorteil", text: "", icon: "✓" })
    );
  }

  // ── Landingpage speichern ────────────────────────────────
  const { data: lp, error: insertErr } = await sb.from("landing_pages").insert({
    client_id,
    name,
    slug,
    title:       content.headline || name,
    content,
    status:      "draft",
    impressum:   client.impressum   || "",
    datenschutz: client.datenschutz || "",
    leads_count: 0,
  }).select().single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, lp });
}
