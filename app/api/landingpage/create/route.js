import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

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

function buildPrompt(client) {
  const lines = [];

  // Stammdaten
  lines.push(`Kunde:        ${client.name}`);
  if (client.industry)       lines.push(`Branche:      ${client.industry}`);
  if (client.region)         lines.push(`Region:       ${client.region}`);
  if (client.description)    lines.push(`Angebot:      ${client.description}`);
  if (client.usp)            lines.push(`USP:          ${client.usp}`);
  if (client.target_audience) lines.push(`Zielgruppe:   ${client.target_audience}`);

  // Keywords: eigene + aus Website-Analyse kombinieren
  const manualKeywords   = (client.keywords || "").split(",").map(k => k.trim()).filter(Boolean);
  const websiteKeywords  = (client.meta_description || "").split(/[,.|·]/).map(k => k.trim()).filter(k => k.length > 3 && k.length < 40);
  const allKeywords      = [...new Set([...manualKeywords, ...websiteKeywords])].slice(0, 20);
  if (allKeywords.length) lines.push(`Keywords:     ${allKeywords.join(", ")}`);

  // Website-Meta-Daten aus Analyse
  if (client.meta_title)       lines.push(`Website-Titel: ${client.meta_title}`);
  if (client.meta_description) lines.push(`Meta-Beschr.:  ${client.meta_description}`);

  // SEO-Check: vorhandene Stärken als Kontext
  const seo = client.seo_check || {};
  const seoHints = [];
  if (seo.og_title)       seoHints.push(`OG-Titel: ${seo.og_title}`);
  if (seo.og_description) seoHints.push(`OG-Text: ${seo.og_description}`);
  if (seoHints.length)    lines.push(`SEO-Hinweise: ${seoHints.join(" | ")}`);

  return lines.join("\n");
}

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const sb = supabaseAdmin();

  // 1. Komplettes Kundenprofil laden
  const { data: client, error: clientErr } = await sb
    .from("clients")
    .select("id, name, description, usp, target_audience, keywords, region, industry, meta_title, meta_description, seo_check, impressum, datenschutz")
    .eq("id", client_id)
    .single();
  if (clientErr || !client) return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });

  // 2. LP-Nummer
  const { count } = await sb.from("landing_pages")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client_id);
  const lpNr = (count ?? 0) + 1;
  const name = `${client.name} – LP ${lpNr}`;

  // 3. Eindeutiger Slug
  const base = slugify(client.name || "lp");
  let slug = null;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    const { data: existing } = await sb.from("landing_pages").select("id").eq("slug", candidate).maybeSingle();
    if (!existing) { slug = candidate; break; }
  }
  if (!slug) return NextResponse.json({ error: "Kein freier Slug — nochmal versuchen" }, { status: 500 });

  // 4. Claude: Texte aus vollem Kundenprofil + Website-Analyse generieren
  const profileContext = buildPrompt(client);

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system:     `Du bist ein erfahrener Conversion-Texter für den deutschsprachigen Markt.
Du erhältst das vollständige Profil eines Kunden inkl. Website-Analyse-Daten.
Nutze alle verfügbaren Infos für präzise, branchenspezifische Texte.
Antworte ausschließlich mit gültigem JSON, kein Fließtext.`,
      messages: [
        {
          role:    "user",
          content: `Erstelle hochwertige Landing-Page-Texte für diesen Kunden.

=== KUNDENPROFIL ===
${profileContext}

=== AUFGABE ===
Schreibe conversion-optimierte Texte auf Basis aller obigen Daten.
Nutze branchenspezifische Sprache und echte USPs aus dem Profil.
Erfinde keine Fakten — nutze nur was im Profil steht.

Liefere NUR dieses JSON:
{
  "headline":    "Hauptüberschrift – max. 12 Wörter, nutzenorientiert, spezifisch für diese Branche",
  "subheadline": "2 Sätze – konkreter Nutzen, Zielgruppe ansprechen",
  "usp_blocks":  [
    { "titel": "Vorteil aus dem Profil",  "text": "1–2 Sätze mit konkretem Nutzen" },
    { "titel": "Zweiter echter Vorteil",  "text": "1–2 Sätze" },
    { "titel": "Dritter echter Vorteil",  "text": "1–2 Sätze" }
  ],
  "cta_text": "3–5 Wörter, aktiver CTA passend zur Branche"
}
Genau 3 usp_blocks. Alle Werte auf Deutsch.`,
        },
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!aiRes.ok) {
    const t = await aiRes.text();
    return NextResponse.json({ error: "KI-Fehler: " + t }, { status: 500 });
  }

  const aiData  = await aiRes.json();
  const rawText = "{" + (aiData.content?.[0]?.text || "");
  let content;
  try {
    content = JSON.parse(rawText);
  } catch {
    try {
      const trimmed = rawText.slice(0, rawText.lastIndexOf(",")).trimEnd() + "}";
      content = JSON.parse(trimmed);
    } catch {
      return NextResponse.json({ error: "KI-Antwort ungültig", raw: rawText.slice(0, 200) }, { status: 500 });
    }
  }

  // Sicherheitsnetz: genau 3 usp_blocks
  if (!Array.isArray(content.usp_blocks)) content.usp_blocks = [];
  while (content.usp_blocks.length < 3) {
    content.usp_blocks.push({ titel: `Vorteil ${content.usp_blocks.length + 1}`, text: "" });
  }
  content.usp_blocks = content.usp_blocks.slice(0, 3);

  // 5. Speichern
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
