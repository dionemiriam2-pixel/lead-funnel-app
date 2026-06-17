import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const db = supabaseAdmin();

  const { data: client, error } = await db
    .from("clients")
    .select("name, industry, region, target_audience, usp, keywords, vibe, brand_color, accent_color, description")
    .eq("id", client_id)
    .single();

  if (error || !client) return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });

  const now = new Date();
  const weekLabel = `KW ${getWeek(now)} ${now.getFullYear()}`;

  const prompt = `Du bist ein Social-Media-Experte für ${client.industry || "Unternehmen"} im deutschsprachigen Raum.

KUNDENPROFIL:
- Firma: ${client.name}
- Branche: ${client.industry || "–"}
- Region: ${client.region || "–"}
- Beschreibung: ${client.description || "–"}
- Zielgruppe: ${client.target_audience || "–"}
- USP: ${client.usp || "–"}
- Keywords: ${client.keywords || "–"}
- Stil/Vibe: ${client.vibe || "professionell, nahbar"}

Erstelle 5 Social-Media-Posts für die Woche (${weekLabel}).
Verteile: 2× LinkedIn, 2× Instagram, 1× Facebook.

Tonalität je Plattform:
- LinkedIn: professionell, Mehrwert, Expertise, 150–250 Zeichen
- Instagram: visuell, emotional, Story-nah, 80–130 Zeichen + 5–8 Hashtags
- Facebook: nahbar, community-orientiert, 100–180 Zeichen

Antworte AUSSCHLIESSLICH mit rohem JSON (kein Markdown, kein Text davor/danach):
{
  "posts": [
    {
      "platform": "linkedin",
      "text": "...",
      "hashtags": ["#tag1", "#tag2"],
      "bild_idee": "Kurze Beschreibung des idealen Bildmotivs (max 1 Satz)"
    }
  ]
}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    system: "Du antwortest ausschließlich mit rohem JSON — kein Markdown, keine Erklärungen.",
    messages: [{ role: "user", content: prompt }],
  });

  let posts;
  try {
    const raw = msg.content[0].text.trim()
      .replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Kein JSON");
    posts = JSON.parse(match[0]).posts;
    if (!Array.isArray(posts)) throw new Error("posts kein Array");
  } catch {
    return NextResponse.json({ error: "KI-Antwort ungültig", raw: msg.content[0]?.text }, { status: 500 });
  }

  // Insert all posts
  const rows = posts.map(p => ({
    client_id,
    platform:     p.platform?.toLowerCase() || "linkedin",
    text:         p.text         || "",
    hashtags:     Array.isArray(p.hashtags) ? p.hashtags : [],
    image_prompt: p.bild_idee   || null,
    week_label:   weekLabel,
    status:       "entwurf",
  }));

  const { data: inserted, error: insertErr } = await db
    .from("content_posts")
    .insert(rows)
    .select();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, posts: inserted, weekLabel });
}

function getWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
