import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function auth(req) {
  return req.headers.get("x-pw") === process.env.DASHBOARD_PASSWORD;
}

/* ─── SEO-Parsing (kein externer Parser, nur Regex) ──────── */
function attr(html, pattern) {
  const m = html.match(pattern);
  return m ? (m[1] || m[2] || "").trim() : null;
}

function parseSEO(html, url) {
  const title       = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDesc    = attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)
                   || attr(html, /<meta[^>]+content=["']([^"']*?)["'][^>]+name=["']description["']/i);
  const canonical   = attr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i)
                   || attr(html, /<link[^>]+href=["']([^"']*?)["'][^>]+rel=["']canonical["']/i);
  const schemaOrg   = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const ogTags      = /<meta[^>]+property=["']og:/i.test(html);
  const h1Raw       = attr(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1          = h1Raw ? h1Raw.replace(/<[^>]+>/g, "").trim() : null;
  const robots      = attr(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)/i)
                   || attr(html, /<meta[^>]+content=["']([^"']*?)["'][^>]+name=["']robots["']/i);
  const isHttps     = url.startsWith("https://");

  return {
    title:            { vorhanden: !!title,    wert: title || null },
    meta_description: { vorhanden: !!metaDesc, wert: metaDesc || null },
    canonical:        { vorhanden: !!canonical, wert: canonical || null },
    schema_org:       { vorhanden: schemaOrg,  wert: schemaOrg ? "JSON-LD gefunden" : null },
    og_tags:          { vorhanden: ogTags,     wert: ogTags ? "vorhanden" : null },
    h1:               { vorhanden: !!h1,       wert: h1 || null },
    robots:           { vorhanden: !!robots,   wert: robots || null },
    https:            { vorhanden: isHttps,    wert: isHttps ? "HTTPS" : "HTTP (unsicher)" },
    sitemap:          { vorhanden: false,      wert: null }, // wird separat geprüft
  };
}

async function checkSitemap(baseUrl) {
  try {
    const url = baseUrl.replace(/\/$/, "") + "/sitemap.xml";
    const r = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch {
    return false;
  }
}

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10000);
}

/* ─── Social-Media-Links aus HTML extrahieren ────────────── */
function extractSocialLinks(html) {
  const links = {};
  const hrefs = [...html.matchAll(/href=["']([^"']{10,}?)["']/gi)].map(m => m[1]);

  for (const url of hrefs) {
    const u = url.toLowerCase();
    try {
      if (!links.instagram && u.includes("instagram.com/")) {
        const m = url.match(/instagram\.com\/([A-Za-z0-9_.]{2,})/);
        const skip = ["p","reel","explore","stories","tv","s","accounts"];
        if (m && !skip.includes(m[1])) links.instagram = "https://www.instagram.com/" + m[1];
      }
      if (!links.facebook && u.includes("facebook.com/")) {
        const m = url.match(/facebook\.com\/([A-Za-z0-9_.%-]{3,})/);
        const skip = ["sharer","share","dialog","plugins","login","groups"];
        if (m && !skip.includes(m[1])) links.facebook = "https://www.facebook.com/" + m[1];
      }
      if (!links.linkedin && u.includes("linkedin.com/")) {
        const m = url.match(/(linkedin\.com\/(?:company|in)\/[A-Za-z0-9_-]+)/);
        if (m) links.linkedin = "https://www." + m[1];
      }
      if (!links.tiktok && u.includes("tiktok.com/")) {
        const m = url.match(/tiktok\.com\/@([A-Za-z0-9_.]{2,})/);
        if (m) links.tiktok = "https://www.tiktok.com/@" + m[1];
      }
      if (!links.youtube && u.includes("youtube.com/")) {
        const m = url.match(/(youtube\.com\/(?:channel|c|@)[A-Za-z0-9_-]+)/);
        if (m) links.youtube = "https://www." + m[1];
      }
    } catch { /* ungültige URL überspringen */ }
  }

  return links;
}

/* ─── Website-Analyse ────────────────────────────────────── */
async function analyseWebsite(client_id, sb) {
  const { data: client } = await sb.from("clients").select("*").eq("id", client_id).single();
  if (!client) return NextResponse.json({ error: "Kunde nicht gefunden" }, { status: 404 });

  const url = client.website;
  if (!url) return NextResponse.json({ error: "Keine Website-URL beim Kunden hinterlegt." }, { status: 400 });

  // 1. HTML laden
  let html;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return NextResponse.json({ error: `Website nicht erreichbar (${res.status}).` }, { status: 422 });
    html = await res.text();
  } catch (e) {
    return NextResponse.json({ error: "Website-Fetch fehlgeschlagen: " + e.message }, { status: 422 });
  }

  // 2. SEO-Check (kein KI)
  const seoCheck = parseSEO(html, url);
  const baseUrl  = new URL(url).origin;
  seoCheck.sitemap.vorhanden = await checkSitemap(baseUrl);
  seoCheck.sitemap.wert      = seoCheck.sitemap.vorhanden ? baseUrl + "/sitemap.xml" : null;

  // 3. Sichtbaren Text + Social-Links extrahieren
  const text        = extractText(html);
  const socialLinks = extractSocialLinks(html);

  // 4. KI-Analyse via Anthropic Haiku
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
      system: "Du bist SEO- und Marketing-Analyst. Antworte ausschließlich mit gültigem JSON, kein Fließtext.",
      messages: [
        {
          role: "user",
          content: `Analysiere diesen Website-Text und gib JSON zurück mit den Feldern:
- description (String, 2–3 Sätze): Was macht das Unternehmen? Was bietet es an?
- target_audience (String, 1–2 Sätze): Wer ist die Zielgruppe?
- usp (String, 1 Satz): Was ist das Alleinstellungsmerkmal?
- keywords (Array von 8–12 Strings): Relevante SEO-Keywords
- phone (String oder null): Telefonnummer falls im Text vorhanden, sonst null
- email (String oder null): E-Mail-Adresse falls im Text vorhanden, sonst null
- contact (String oder null): Name des Ansprechpartners / Inhabers falls im Text vorhanden, sonst null
- products (Array von max. 5 Objekten): Erkannte Produkte/Leistungen, jedes mit:
  - name (String): Produktname oder Leistungsbezeichnung
  - description (String, 1 Satz): Kurze Beschreibung
  - target_groups (String): Für wen ist das gedacht?

Wichtig: Gib nur Werte zurück die wirklich im Text stehen. Keine Erfindungen.

Text: ${text}`,
        },
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!aiRes.ok) {
    const t = await aiRes.text();
    return NextResponse.json({ error: "KI-Fehler: " + t }, { status: 500 });
  }

  const aiData = await aiRes.json();
  let aiResult;
  try {
    aiResult = JSON.parse("{" + aiData.content[0].text);
  } catch {
    return NextResponse.json({ error: "KI-Antwort ungültig" }, { status: 500 });
  }

  // 5. In Supabase speichern
  const update = {
    seo_check:       seoCheck,
    raw_html:        html.slice(0, 50000),
    analyzed_at:     new Date().toISOString(),
    description:     aiResult.description     || client.description,
    target_audience: aiResult.target_audience || client.target_audience,
    usp:             aiResult.usp             || client.usp,
    keywords:        Array.isArray(aiResult.keywords)
                       ? aiResult.keywords.join(", ")
                       : aiResult.keywords || client.keywords,
    // Kontaktdaten nur eintragen wenn noch leer
    ...(aiResult.phone   && !client.phone   ? { phone:   aiResult.phone   } : {}),
    ...(aiResult.email   && !client.email   ? { email:   aiResult.email   } : {}),
    ...(aiResult.contact && !client.contact ? { contact: aiResult.contact } : {}),
    // Social-Links nur überschreiben wenn neu gefunden
    ...(socialLinks.instagram && !client.instagram ? { instagram: socialLinks.instagram } : {}),
    ...(socialLinks.facebook  && !client.facebook  ? { facebook:  socialLinks.facebook  } : {}),
    ...(socialLinks.linkedin  && !client.linkedin  ? { linkedin:  socialLinks.linkedin  } : {}),
    ...(socialLinks.tiktok    && !client.tiktok    ? { tiktok:    socialLinks.tiktok    } : {}),
    ...(socialLinks.youtube   && !client.youtube   ? { youtube:   socialLinks.youtube   } : {}),
  };

  const { error: saveErr } = await sb.from("clients").update(update).eq("id", client_id);
  if (saveErr) return NextResponse.json({ error: "Speichern fehlgeschlagen: " + saveErr.message }, { status: 500 });

  // Erkannte Produkte/Leistungen eintragen (nur neue, keine Duplikate)
  let savedProducts = 0;
  if (Array.isArray(aiResult.products) && aiResult.products.length > 0) {
    const { data: existing } = await sb.from("products").select("name").eq("client_id", client_id);
    const existingNames = new Set((existing || []).map(p => p.name.toLowerCase().trim()));
    const newProds = aiResult.products
      .filter(p => p.name && !existingNames.has(p.name.toLowerCase().trim()))
      .slice(0, 5)
      .map(p => ({ client_id, name: p.name, description: p.description || "", target_groups: p.target_groups || "", region: client.region || "" }));
    if (newProds.length > 0) {
      await sb.from("products").insert(newProds);
      savedProducts = newProds.length;
    }
  }

  return NextResponse.json({ ok: true, ...update, savedProducts });
}

/* ─── Produkt-Analyse (bestehend, unverändert) ───────────── */
async function analyseProduct(client_id, product_id, sb) {
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

/* ─── Router ─────────────────────────────────────────────── */
export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const body = await req.json();
  const sb   = supabaseAdmin();

  if (body.product_id) {
    return analyseProduct(body.client_id, body.product_id, sb);
  }
  return analyseWebsite(body.client_id, sb);
}
