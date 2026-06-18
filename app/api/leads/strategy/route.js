import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const sb = supabaseAdmin();

  /* ── 1. Kundenprofil laden ─────────────────────────────── */
  const { data: client, error: cErr } = await sb
    .from("clients")
    .select("name, industry, region, usp, keywords, target_audience, strategy, strategy_notes, channels, ci, lead_magnet, garantie, description")
    .eq("id", client_id)
    .single();
  if (cErr || !client) return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });

  /* ── 2. Lead-Daten aggregieren ─────────────────────────── */
  const { data: leadRows } = await sb
    .from("leads")
    .select("source, pipeline_status, estimated_value")
    .eq("client_id", client_id);

  const leads = leadRows || [];
  const sourceStats = {};
  for (const l of leads) {
    const src = l.source || "manuell";
    if (!sourceStats[src]) sourceStats[src] = { total: 0, gewonnen: 0, values: [] };
    sourceStats[src].total++;
    if (l.pipeline_status === "gewonnen") sourceStats[src].gewonnen++;
    if (l.estimated_value) sourceStats[src].values.push(Number(l.estimated_value));
  }
  const leadSummary = Object.entries(sourceStats).map(([src, s]) => ({
    quelle: src,
    gesamt: s.total,
    gewonnen: s.gewonnen,
    conversion_pct: s.total > 0 ? Math.round(s.gewonnen / s.total * 100) : 0,
    avg_wert_eur: s.values.length > 0 ? Math.round(s.values.reduce((a, b) => a + b, 0) / s.values.length) : null,
  })).sort((a, b) => b.gesamt - a.gesamt);

  /* ── 3. CI / Persona ───────────────────────────────────── */
  const ci = client.ci || {};
  const personaHint = [ci.persona, ci.tonalitaet, ci.mission].filter(Boolean).join(" | ") || null;

  /* ── 4. Prompt bauen ───────────────────────────────────── */
  const activeChannels = Object.entries(client.channels || {})
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ") || "noch keine";

  const leadDataText = leadSummary.length > 0
    ? leadSummary.map(s =>
        `  - ${s.quelle}: ${s.gesamt} Leads, ${s.conversion_pct}% Conversion${s.avg_wert_eur ? `, ∅ ${s.avg_wert_eur}€` : ""}`
      ).join("\n")
    : "  (noch keine Lead-Daten vorhanden)";

  const prompt = `Du bist ein erfahrener B2B-Marketingberater. Analysiere das folgende Kundenprofil und erstelle eine strukturierte Lead-Strategie.

KUNDENPROFIL:
- Name: ${client.name}
- Branche: ${client.industry || "unbekannt"}
- Region: ${client.region || "unbekannt"}
- USP: ${client.usp || "nicht definiert"}
- Keywords: ${client.keywords || "–"}
- Zielgruppe: ${client.target_audience || "nicht definiert"}
- Angebot/Lead-Magnet: ${client.lead_magnet || "–"}
- Garantie: ${client.garantie || "–"}
- Beschreibung: ${client.description || "–"}
- Persona-Hinweis aus CI: ${personaHint || "–"}
- Strategie-Notizen: ${client.strategy_notes || "–"}
- Aktive Kanäle: ${activeChannels}

VORHANDENE LEAD-DATEN (echte Zahlen):
${leadDataText}
Gesamt-Leads: ${leads.length}

AUFGABE: Erstelle eine realistische, branchenspezifische Lead-Strategie.
Beachte:
- Outbound (Cold-Mail/Cold-Call) ist im B2C ohne Einwilligung nach UWG §7 unzulässig. Im B2B nur bei mutmaßlichem Interesse erlaubt.
- Empfehle Kanäle, die wirklich zur Branche und Persona passen.
- Bei lokalem B2B (Handwerk, Dienstleistung): Google Business, Empfehlungen, Google Maps-Outreach mit Hinweis auf rechtskonforme Einwilligung.
- Bei LinkedIn: nur bei Branchen, wo Entscheider dort aktiv sind.
- Bei hoher Kaufabsicht: Google Ads sinnvoll.
- Meta/Lead-Magnet: bei breiteren Zielgruppen mit erklärbarem Angebot.

Antworte NUR als JSON mit dieser exakten Struktur:
{
  "buyer_persona": "1-2 Sätze: Wer genau, welche Rolle/Entscheider, was triggert die Kaufentscheidung",
  "empfohlene_kanaele": [
    {
      "kanal": "Kanalname",
      "warum_passt": "Kurze Begründung warum dieser Kanal zur Branche/Persona passt",
      "aufwand": "niedrig|mittel|hoch",
      "kosten": "kostenlos|unter 200€/Mo|200-500€/Mo|500-1000€/Mo|über 1000€/Mo",
      "erwartete_qualitaet": "niedrig|mittel|hoch",
      "uwg_hinweis": null
    }
  ],
  "start_strategie": "Konkrete Schritte für die ersten 30 Tage mit wenig/kein Budget (3-5 Sätze)",
  "ausbau_strategie": {
    "200eur": "Was bringt 200€/Mo Zusatzbudget konkret",
    "500eur": "Was bringt 500€/Mo Zusatzbudget konkret",
    "1000eur": "Was bringt 1000€/Mo Zusatzbudget konkret"
  },
  "naechste_schritte": [
    "Konkretes To-do 1",
    "Konkretes To-do 2",
    "Konkretes To-do 3"
  ],
  "datenbasierte_erkenntnisse": "Null oder 1-2 Sätze zu den echten Lead-Zahlen falls vorhanden, sonst null"
}`;

  /* ── 5. Claude Haiku aufrufen ──────────────────────────── */
  let ki;
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
        max_tokens: 1800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = await res.json();
    const text = json.content?.[0]?.text || "";
    ki = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
  } catch {
    return NextResponse.json({ error: "KI-Auswertung fehlgeschlagen" }, { status: 500 });
  }

  if (!ki.buyer_persona) return NextResponse.json({ error: "Ungültige KI-Antwort" }, { status: 500 });

  /* ── 6. In clients.strategy speichern ─────────────────── */
  const existingStrategy = client.strategy || {};
  const updatedStrategy = {
    ...existingStrategy,
    ki_analyse: {
      ...ki,
      analysiert_am: new Date().toISOString(),
      lead_count: leads.length,
    },
  };

  const { error: saveErr } = await sb
    .from("clients")
    .update({ strategy: updatedStrategy })
    .eq("id", client_id);
  if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });

  return NextResponse.json({ data: updatedStrategy.ki_analyse });
}
