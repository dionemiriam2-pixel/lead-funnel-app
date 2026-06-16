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

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const sb = supabaseAdmin();

  // 1. Client-Daten laden
  const { data: client, error: clientErr } = await sb.from("clients").select("*").eq("id", client_id).single();
  if (clientErr || !client) return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });

  // 2. Laufende LP-Nummer für diesen Kunden
  const { count } = await sb.from("landing_pages")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client_id);
  const lpNr  = (count ?? 0) + 1;
  const name  = `${client.name} – LP ${lpNr}`;

  // 3. Eindeutigen Slug erzeugen (max. 5 Versuche)
  const base = slugify(client.name || "lp");
  let slug = null;
  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    const { data: existing } = await sb.from("landing_pages").select("id").eq("slug", candidate).maybeSingle();
    if (!existing) { slug = candidate; break; }
  }
  if (!slug) return NextResponse.json({ error: "Kein freier Slug gefunden — bitte nochmal versuchen" }, { status: 500 });

  // 4. Claude Haiku: Texte generieren
  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":          process.env.ANTHROPIC_API_KEY,
      "anthropic-version":  "2023-06-01",
      "content-type":       "application/json",
    },
    body: JSON.stringify({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 900,
      system:     "Du bist Conversion-Texter. Antworte ausschließlich mit gültigem JSON, kein Fließtext.",
      messages: [
        {
          role:    "user",
          content: `Erstelle Texte für eine Landing Page im deutschsprachigen Raum.

Kunde:       ${client.name}
Angebot:     ${client.description || "–"}
USP:         ${client.usp || "–"}
Zielgruppe:  ${client.target_audience || "–"}
Keywords:    ${client.keywords || "–"}
Region:      ${client.region || "DACH"}

Liefere NUR dieses JSON (Felder auf Deutsch, kein Kommentar):
{
  "headline":    "Hauptüberschrift – max. 12 Wörter, nutzenorientiert",
  "subheadline": "2 Sätze, konkret – was bekommt der Interessent?",
  "usp_blocks":  [
    { "titel": "Vorteil 1",  "text": "1–2 Sätze" },
    { "titel": "Vorteil 2",  "text": "1–2 Sätze" },
    { "titel": "Vorteil 3",  "text": "1–2 Sätze" }
  ],
  "cta_text": "3–5 Wörter, aktiver CTA"
}
Wichtig: Genau 3 usp_blocks. Alle Werte auf Deutsch.`,
        },
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!aiRes.ok) {
    const t = await aiRes.text();
    return NextResponse.json({ error: "KI-Fehler: " + t }, { status: 500 });
  }

  const aiData   = await aiRes.json();
  const rawText  = "{" + (aiData.content?.[0]?.text || "");
  let content;
  try {
    content = JSON.parse(rawText);
  } catch {
    // Abgeschnittenes JSON reparieren
    try {
      const trimmed = rawText.slice(0, rawText.lastIndexOf(",")).trimEnd() + "}";
      content = JSON.parse(trimmed);
    } catch {
      return NextResponse.json({ error: "KI-Antwort ungültig", raw: rawText.slice(0, 200) }, { status: 500 });
    }
  }

  // usp_blocks: genau 3, Fallback wenn fehlt
  if (!Array.isArray(content.usp_blocks)) content.usp_blocks = [];
  while (content.usp_blocks.length < 3) {
    content.usp_blocks.push({ titel: `Vorteil ${content.usp_blocks.length + 1}`, text: "" });
  }
  content.usp_blocks = content.usp_blocks.slice(0, 3);

  // 5. In landing_pages speichern
  const { data: lp, error: insertErr } = await sb.from("landing_pages").insert({
    client_id,
    name,
    slug,
    title:        content.headline || name,
    content,
    status:       "draft",
    impressum:    client.impressum    || "",
    datenschutz:  client.datenschutz  || "",
    leads_count:  0,
  }).select().single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, lp });
}
