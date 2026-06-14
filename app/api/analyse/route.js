import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function auth(req) {
  return req.headers.get("x-pw") === process.env.DASHBOARD_PASSWORD;
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { product_id, client_id } = await req.json();
  const sb = supabaseAdmin();

  const [{ data: client }, { data: product }] = await Promise.all([
    sb.from("clients").select("*").eq("id", client_id).single(),
    sb.from("products").select("*").eq("id", product_id).single(),
  ]);

  if (!client || !product) return NextResponse.json({ error: "Client oder Produkt nicht gefunden" }, { status: 404 });

  const prompt = `Du bist Lead-Gen-Stratege für eine Ladenbau-Agentur.

Kunde: ${client.name}
Beschreibung: ${client.description || ""}
USP: ${client.usp || ""}
Region: ${client.region || "DACH"}

Produkt/Leistung: ${product.name}
Beschreibung: ${product.description || ""}
Zielgruppen: ${product.target_groups || ""}
Keywords: ${product.keywords || ""}
Region: ${product.region || client.region || "DACH"}

Aufgabe: Analysiere diese Kombination und erstelle:
1. Die 8 besten Google-Maps-Suchanfragen (Kaltakquise) um passende Firmen zu finden
2. 3 Landing-Page-Ideen (Headline + Zielgruppe + Lead-Magnet)

Gib NUR gültiges JSON zurück in diesem Format:
{
  "searches": [{"term": "Suchbegriff", "location": "Stadt", "industry": "Zielgruppe"}],
  "lp_ideas": [{"headline": "Headline", "target": "Zielgruppe", "magnet": "Lead-Magnet"}]
}`;

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!aiRes.ok) {
    const t = await aiRes.text();
    return NextResponse.json({ error: "KI-Fehler: " + t }, { status: 500 });
  }

  const aiData = await aiRes.json();
  const raw = aiData.content?.[0]?.text || "";
  let parsed;
  try {
    const a = raw.indexOf("{"), b = raw.lastIndexOf("}");
    parsed = JSON.parse(raw.slice(a, b + 1));
  } catch {
    return NextResponse.json({ error: "KI-Antwort konnte nicht gelesen werden", raw }, { status: 500 });
  }

  // Suchbegriffe in Supabase speichern
  if (parsed.searches?.length) {
    const rows = parsed.searches.slice(0, 12).map(s => ({
      term: s.term,
      location: s.location || null,
      client: client.name,
      industry: s.industry || product.target_groups || "",
      product: product.name,
      max_results: 20,
    }));
    await sb.from("search_terms").insert(rows);
  }

  return NextResponse.json({ ok: true, ...parsed });
}
