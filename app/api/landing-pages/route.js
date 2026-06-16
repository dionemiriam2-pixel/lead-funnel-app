import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function auth(req) {
  return req.headers.get("x-pw") === process.env.DASHBOARD_PASSWORD;
}

function slugify(text) {
  return text.toLowerCase().replace(/[äöü]/g, c => ({ ä: "ae", ö: "oe", ü: "ue" }[c]))
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* ─── GET: alle LPs eines Clients ───────────────────────── */
export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const client_id = searchParams.get("client_id");
  const sb = supabaseAdmin();
  let q = sb.from("landing_pages").select("id,slug,title,status,impressum,datenschutz,content,created_at,updated_at").order("created_at", { ascending: false });
  if (client_id) q = q.eq("client_id", client_id);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/* ─── POST: neue LP generieren ───────────────────────────── */
export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { client_id } = await req.json();
  const sb = supabaseAdmin();

  const { data: client } = await sb.from("clients").select("*").eq("id", client_id).single();
  if (!client) return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });

  // Slug: clientname + timestamp-suffix
  const baseSlug = slugify(client.name || "landing-page");
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  // KI-Prompt
  const prompt = `Du bist Conversion-Texter für Landing Pages im deutschsprachigen Raum.

Erstelle Texte für eine Landing Page für diesen Kunden:
Name: ${client.name}
Angebot/Beschreibung: ${client.description || ""}
USP: ${client.usp || ""}
Zielgruppe: ${client.target_audience || ""}
Keywords: ${client.keywords || ""}
Region: ${client.region || "DACH"}

Antworte NUR mit diesem JSON (kein Fließtext drumherum):
{
  "hero": {
    "badge": "Kurzer Badge-Text (z.B. 'Kostenlos · Unverbindlich')",
    "headline": "Hauptüberschrift (prägnant, nutzenorientiert, max. 12 Wörter)",
    "subline": "Unterzeile (2 Sätze, erklärt den Nutzen konkreter)",
    "bullets": ["Vorteil 1", "Vorteil 2", "Vorteil 3"],
    "cta_text": "CTA-Button-Text (3-5 Wörter, aktiv)"
  },
  "usp_blocks": [
    { "icon": "emoji", "title": "USP-Titel 1", "text": "Kurze Erklärung (1-2 Sätze)" },
    { "icon": "emoji", "title": "USP-Titel 2", "text": "Kurze Erklärung (1-2 Sätze)" },
    { "icon": "emoji", "title": "USP-Titel 3", "text": "Kurze Erklärung (1-2 Sätze)" }
  ],
  "cta": {
    "title": "Abschluss-CTA-Überschrift",
    "sub": "Kurzer Beruhigungstext (Kostenlos, Unverbindlich etc.)",
    "button": "Button-Text"
  }
}`;

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: "Du bist Conversion-Texter. Antworte ausschließlich mit gültigem JSON.",
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!aiRes.ok) {
    const t = await aiRes.text();
    return NextResponse.json({ error: "KI-Fehler: " + t }, { status: 500 });
  }

  const aiData = await aiRes.json();
  let content;
  try {
    content = JSON.parse("{" + aiData.content[0].text);
  } catch {
    return NextResponse.json({ error: "KI-Antwort ungültig" }, { status: 500 });
  }

  const { data: lp, error: insertErr } = await sb.from("landing_pages").insert({
    client_id,
    slug,
    title: content.hero?.headline || client.name,
    content,
    status: "draft",
    impressum: client.impressum || "",
    datenschutz: client.datenschutz || "",
  }).select().single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, lp });
}

/* ─── PATCH: LP aktualisieren (Texte, Impressum etc.) ─────── */
export async function PATCH(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { id, ...fields } = await req.json();
  const sb = supabaseAdmin();
  const { error } = await sb.from("landing_pages").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/* ─── DELETE ─────────────────────────────────────────────── */
export async function DELETE(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const sb = supabaseAdmin();
  const { error } = await sb.from("landing_pages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
