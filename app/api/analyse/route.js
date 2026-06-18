import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

/* ─── SEO-Parsing (kein externer Parser, nur Regex) ──────── */
function attr(html, pattern) {
  const m = html.match(pattern);
  return m ? (m[1] || m[2] || "").trim() : null;
}

function parseSEO(html, url) {
  const title    = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i);

  // Meta Description — beide Attribut-Reihenfolgen
  const metaDesc = attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)
                || attr(html, /<meta[^>]+content=["']([^"']*?)["'][^>]+name=["']description["']/i);

  // Canonical — robusteres Matching: beliebig viele Attribute dazwischen
  const canonicalRaw = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0]
                    || html.match(/<link[^>]*href=["'][^"']*["'][^>]*rel=["']canonical["'][^>]*>/i)?.[0];
  const canonical = canonicalRaw ? (canonicalRaw.match(/href=["']([^"']+)["']/i)?.[1] || null) : null;

  // Schema.org: JSON-LD mit echtem @type-Extrakt
  const jsonLdMatch  = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  let schemaTypes    = null;
  if (jsonLdMatch) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1].trim());
      const items  = Array.isArray(parsed) ? parsed : [parsed];
      const types  = items.map(p => p["@type"]).filter(Boolean);
      if (types.length) schemaTypes = types.join(", ");
    } catch { schemaTypes = "JSON-LD (nicht parsebar)"; }
  }
  const schemaMicro  = /itemscope/i.test(html) && /itemtype=["']https?:\/\/schema\.org/i.test(html);
  const schemaOrg    = !!schemaTypes || schemaMicro;
  const schemaWert   = schemaTypes || (schemaMicro ? "Microdata (itemscope)" : null);

  // Open Graph
  const ogTags = /<meta[^>]+property=["']og:/i.test(html);

  // H1
  const h1Raw = attr(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1    = h1Raw ? h1Raw.replace(/<[^>]+>/g, "").trim() : null;

  // Robots Meta Tag
  const robots = attr(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)/i)
              || attr(html, /<meta[^>]+content=["']([^"']*?)["'][^>]+name=["']robots["']/i);

  const isHttps = url.startsWith("https://");

  return {
    title:            { vorhanden: !!title,     wert: title || null },
    meta_description: { vorhanden: !!metaDesc,  wert: metaDesc || null },
    canonical:        { vorhanden: !!canonical,  wert: canonical || null },
    schema_org:       { vorhanden: schemaOrg,   wert: schemaWert },
    og_tags:          { vorhanden: ogTags,      wert: ogTags ? "vorhanden" : null },
    h1:               { vorhanden: !!h1,        wert: h1 || null },
    robots:           { vorhanden: !!robots,    wert: robots || null },
    https:            { vorhanden: isHttps,     wert: isHttps ? "HTTPS" : "HTTP (unsicher)" },
    sitemap:          { vorhanden: false,       wert: null },
  };
}

function detectTechStack(html) {
  const h = html.toLowerCase();
  const tech = [];

  // CMS / Page-Builder
  if (/wp-content\/|wp-includes\/|wp-json\//.test(h))             tech.push("WordPress");
  if (/elementor/.test(h))                                        tech.push("Elementor");
  if (/data-et-|\/et-pb-/.test(h))                               tech.push("Divi");
  if (/\/typo3temp\/|typo3conf/.test(h))                         tech.push("TYPO3");
  if (/\/components\/com_|joomla/.test(h))                       tech.push("Joomla");
  if (/drupal\.settings|\/sites\/default\/files\//.test(h))      tech.push("Drupal");
  if (/cdn\.shopify\.com/.test(h))                               tech.push("Shopify");
  if (/static1\.squarespace\.com/.test(h))                       tech.push("Squarespace");
  if (/cdn\.wix\.com|wixstatic\.com|x-wix/.test(h))             tech.push("Wix");
  if (/cdn\.jimdo\.com/.test(h))                                 tech.push("Jimdo");
  if (/ghost\.io|content="ghost/.test(h))                        tech.push("Ghost");
  if (/webflow\.js|data-wf-domain/.test(h))                      tech.push("Webflow");
  if (/\.myshopify\.com/.test(h))                                tech.push("Shopify");

  // JS-Frameworks
  if (/__next_data__|"\/_next\/static\//.test(h))                tech.push("Next.js");
  if (/__nuxt__|"\/_nuxt\//.test(h))                             tech.push("Nuxt.js");
  if (/gatsby-|__gatsby/.test(h))                                tech.push("Gatsby");
  if (/data-reactroot|react\.development|react\.production/.test(h)) tech.push("React");
  if (/ng-version=|angular\.min\.js/.test(h))                   tech.push("Angular");
  if (/data-v-[a-z0-9]+|vue\.min\.js/.test(h))                  tech.push("Vue.js");
  if (/svelte-/.test(h))                                         tech.push("Svelte");

  // Generator-Meta
  const gen = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i)?.[1]
           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']generator["']/i)?.[1];
  if (gen && !tech.some(t => gen.toLowerCase().includes(t.toLowerCase()))) {
    tech.push(gen.split(" ")[0]); // z.B. "Hugo 0.117"
  }

  if (tech.length === 0) tech.push("Vanilla HTML / Unbekannt");

  // Duplikate entfernen (WordPress + Elementor beides drin = ok)
  return [...new Set(tech)];
}

async function checkSitemap(baseUrl) {
  const base = baseUrl.replace(/\/$/, "");
  const paths = [
    "/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml",
    "/wp-sitemap.xml", "/page-sitemap.xml", "/post-sitemap.xml",
    "/xmlsitemap.xml", "/sitemaps.xml", "/sitemap.php", "/sitemap/",
    "/sitemap/sitemap.xml", "/sitemap/index.xml",
  ];
  for (const path of paths) {
    try {
      const r = await fetch(base + path, { method: "HEAD", signal: AbortSignal.timeout(3000) });
      if (r.ok && r.status < 400) return base + path;
    } catch { /* weiter */ }
  }
  return null;
}

async function checkRobotsTxt(baseUrl) {
  try {
    const base = baseUrl.replace(/\/$/, "");
    const r = await fetch(base + "/robots.txt", { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return { exists: false, sitemapUrl: null };
    const text = await r.text();
    const sitemapMatch = text.match(/^Sitemap:\s*(.+)$/im);
    return { exists: true, sitemapUrl: sitemapMatch ? sitemapMatch[1].trim() : null };
  } catch {
    return { exists: false, sitemapUrl: null };
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

/* ─── Kontaktdaten per Regex aus Text extrahieren ───────── */
function isMobile(num) {
  const clean = num.replace(/[\s\-()]/g, "");
  return /^(\+4915\d|015\d|016\d|017\d|\+4916\d|\+4917\d)/.test(clean);
}

function extractContact(text) {
  const result = {};

  // Alle Telefonnummern aus dem Text sammeln
  const allNums = [...text.matchAll(/(?:(?:Tel\.?|Telefon|Mobil|Handy|Fon|Phone|Fax)[\s:]*)?([+0][\d\s\-/()+]{6,20}\d)/gi)]
    .map(m => m[1].replace(/\s+/g, " ").trim())
    .filter(n => n.replace(/\D/g, "").length >= 7);

  for (const num of allNums) {
    if (isMobile(num)) {
      if (!result.mobile) result.mobile = num;
    } else {
      if (!result.phone) result.phone = num;
    }
  }

  // E-Mail
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.email = emailMatch[0];

  return result;
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

/* ─── Farben aus HTML extrahieren ───────────────────────── */
function extractColors(html) {
  const result = {};

  // 1. <meta name="theme-color"> → Hauptfarbe
  const theme = (
    html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i)?.[1]
  )?.trim();
  if (theme && /^#[0-9a-f]{3,8}$/i.test(theme)) result.brand_color = theme.toLowerCase();

  // 2. CSS-Variablen aus <style>-Blöcken
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join("\n");
  if (css) {
    // Hauptfarbe
    const primaryRe = /--(?:primary|brand|main|color-primary|primary-color|brand-color|color-brand)\s*:\s*(#[0-9a-f]{3,8})/gi;
    if (!result.brand_color) {
      const m = primaryRe.exec(css);
      if (m) result.brand_color = m[1].toLowerCase();
    }
    // Akzentfarbe
    const accentRe = /--(?:accent|secondary|highlight|color-accent|accent-color|secondary-color)\s*:\s*(#[0-9a-f]{3,8})/gi;
    const a = accentRe.exec(css);
    if (a) result.accent_color = a[1].toLowerCase();
  }

  return result;
}

/* ─── Kontaktseiten mitscrapen (Impressum, Kontakt) ─────── */
async function fetchContactPages(baseUrl) {
  const paths = ["/impressum", "/kontakt", "/contact", "/ueber-uns", "/about",
                 "/impressum.html", "/kontakt.html", "/kontakt/", "/impressum/"];
  const texts = [];
  for (const path of paths) {
    try {
      const r = await fetch(baseUrl + path, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadBot/1.0)" },
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) continue;
      const html = await r.text();
      const t = extractText(html);
      if (t.length > 100) texts.push(t.slice(0, 3000));
      if (texts.length >= 2) break; // max 2 Unterseiten
    } catch { /* weiter */ }
  }
  return texts.join("\n\n");
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

  // 2. SEO-Check (kein KI) + Tech-Stack
  const seoCheck  = parseSEO(html, url);
  seoCheck.tech_stack = { vorhanden: true, wert: detectTechStack(html).join(", ") };
  const baseUrl   = new URL(url).origin;

  // Sitemap: mehrere Pfade probieren + robots.txt auslesen
  const [sitemapUrl, robotsResult] = await Promise.all([
    checkSitemap(baseUrl),
    checkRobotsTxt(baseUrl),
  ]);

  const finalSitemapUrl = sitemapUrl || robotsResult.sitemapUrl || null;
  seoCheck.sitemap.vorhanden = !!finalSitemapUrl;
  seoCheck.sitemap.wert      = finalSitemapUrl;

  // Robots: Meta-Tag im HTML ODER robots.txt vorhanden
  if (!seoCheck.robots.vorhanden && robotsResult.exists) {
    seoCheck.robots.vorhanden = true;
    seoCheck.robots.wert      = "robots.txt vorhanden";
  }

  // 3. Sichtbaren Text + Links + Kontaktdaten + Farben extrahieren
  const homeText      = extractText(html);
  const contactPages  = await fetchContactPages(baseUrl);           // Impressum / Kontakt
  const text          = homeText + (contactPages ? "\n\n" + contactPages : "");
  const socialLinks   = extractSocialLinks(html);
  const regexContact  = extractContact(text);                       // regex über Gesamttext
  const colors        = extractColors(html);

  // 4. KI-Analyse: Profil + CI parallel
  const profilePrompt = `Analysiere diesen Website-Text und gib JSON zurück:
- industry (String, 1–3 Wörter): Branche
- description (String, 2–3 Sätze): Was macht das Unternehmen?
- target_audience (String, 1–2 Sätze): Wer ist die Zielgruppe?
- usp (String, 1 Satz): Alleinstellungsmerkmal
- keywords (Array 8–12 Strings): SEO-Keywords
- region (String|null): Stadt/Region, nur wenn eindeutig erkennbar
- contact (String|null): Name des Inhabers/Ansprechpartners, falls genannt
- phone (String|null): Festnetznummer falls sichtbar
- mobile (String|null): Mobilnummer falls sichtbar
- email (String|null): E-Mail-Adresse falls sichtbar
- lead_magnet (String, 1 Satz): Passendes kostenloses Angebot das Leads generiert (z.B. "Kostenlose Erstberatung 30 Min.", "Gratis-Checkliste herunterladen")
- garantie (String, 1 Satz): Überzeugendes Versprechen/Garantie für potenzielle Kunden (z.B. "30 Tage Geld-zurück-Garantie", "Kostenlose Nachbesserung")
- strategy_notes (String, 3–5 Sätze): Kurze Marketingstrategie: Welche Kanäle, welche Botschaft, welche Zielgruppe ansprechen?
- products (Array max. 5): Leistungen mit {name, description, target_groups, keywords, offer}

Nur belegte Werte, null wenn nicht vorhanden.

Text:
${text.slice(0, 8000)}`;

  const ciPrompt = `Du bist Marken-Stratege. Analysiere diese Unternehmens-Website und erstelle ein Marken-Briefing.

Firmenname: ${client.name}
Branche: ${client.industry || "unbekannt"}
Website-Text (Auszug):
${text.slice(0, 4000)}

Antworte NUR mit rohem JSON:
{
  "tonalitaet": "professionell|persoenlich|freundlich|direkt|inspirierend",
  "anrede": "Sie|du",
  "claim": "kurzer Claim/Slogan",
  "sprache_dos": "3–5 Punkte was die Marke kommunikativ ausmacht, zeilengetrennt",
  "sprache_donts": "3–5 Punkte was die Marke vermeiden sollte, zeilengetrennt",
  "mission": "1–2 Sätze warum das Unternehmen existiert",
  "werte": "3–5 Kernwerte, kommagetrennt",
  "kernbotschaften": ["Botschaft 1", "Botschaft 2", "Botschaft 3"],
  "persona": "Typische Zielgruppe: Alter, Situation, Bedürfnisse",
  "wettbewerb": "Typische Wettbewerber und was dieses Unternehmen anders macht",
  "bildstil": "Wie sollten Bilder/Fotos aussehen?",
  "ueber_uns": "2–4 Sätze Über-uns-Text im Stil der Marke",
  "brand_font": "Empfohlene Headline-Schrift (z.B. Playfair Display, Inter, Sora)",
  "body_font": "Empfohlene Fließtext-Schrift (z.B. Inter, Lato, Georgia)"
}`;

  const aiHeaders = {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };

  const [aiRes, ciRes] = await Promise.all([
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2500,
        system: "Antworte ausschließlich mit gültigem JSON, kein Fließtext.",
        messages: [{ role: "user", content: profilePrompt }, { role: "assistant", content: "{" }],
      }),
    }),
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: "Antworte ausschließlich mit rohem JSON ohne Erklärungen.",
        messages: [{ role: "user", content: ciPrompt }],
      }),
    }),
  ]);

  if (!aiRes.ok) {
    const t = await aiRes.text();
    return NextResponse.json({ error: "KI-Fehler: " + t }, { status: 500 });
  }

  const aiData = await aiRes.json();
  let aiResult;
  const rawText = "{" + (aiData.content?.[0]?.text || "");
  try {
    aiResult = JSON.parse(rawText);
  } catch {
    try {
      const trimmed = rawText.slice(0, rawText.lastIndexOf(",")).trimEnd() + "}";
      aiResult = JSON.parse(trimmed);
    } catch {
      return NextResponse.json({ error: "KI-Antwort konnte nicht gelesen werden", raw: rawText.slice(0, 300) }, { status: 500 });
    }
  }

  // CI-Ergebnis parsen (Fehler hier sind nicht kritisch)
  let ciResult = {};
  if (ciRes.ok) {
    try {
      const ciData = await ciRes.json();
      let ciRaw = (ciData.content?.[0]?.text || "").replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const a = ciRaw.indexOf("{"), b = ciRaw.lastIndexOf("}");
      if (a !== -1 && b !== -1) ciResult = JSON.parse(ciRaw.slice(a, b + 1));
    } catch { /* CI-Fehler nicht kritisch */ }
  }

  // 5. In Supabase speichern
  const update = {
    seo_check:       seoCheck,
    raw_html:        html.slice(0, 50000),
    analyzed_at:     new Date().toISOString(),
    // Profil
    industry:        aiResult.industry        || client.industry        || null,
    description:     aiResult.description     || client.description,
    target_audience: aiResult.target_audience || client.target_audience,
    usp:             aiResult.usp             || client.usp,
    keywords:        Array.isArray(aiResult.keywords) ? aiResult.keywords.join(", ") : aiResult.keywords || client.keywords,
    phone:           regexContact.phone  || aiResult.phone  || null,
    mobile:          regexContact.mobile || aiResult.mobile || null,
    email:           regexContact.email  || aiResult.email  || null,
    contact:         aiResult.contact || null,
    region:          aiResult.region  || client.region || null,
    // Conversion-Elemente
    ...(aiResult.lead_magnet    ? { lead_magnet:     aiResult.lead_magnet    } : {}),
    ...(aiResult.garantie       ? { garantie:        aiResult.garantie       } : {}),
    ...(aiResult.strategy_notes ? { strategy_notes:  aiResult.strategy_notes } : {}),
    // Farben
    ...(colors.brand_color  ? { brand_color:  colors.brand_color  } : {}),
    ...(colors.accent_color ? { accent_color: colors.accent_color } : {}),
    // Social-Links
    ...(socialLinks.instagram && !client.instagram ? { instagram: socialLinks.instagram } : {}),
    ...(socialLinks.facebook  && !client.facebook  ? { facebook:  socialLinks.facebook  } : {}),
    ...(socialLinks.linkedin  && !client.linkedin  ? { linkedin:  socialLinks.linkedin  } : {}),
    ...(socialLinks.tiktok    && !client.tiktok    ? { tiktok:    socialLinks.tiktok    } : {}),
    ...(socialLinks.youtube   && !client.youtube   ? { youtube:   socialLinks.youtube   } : {}),
    // Marke & CI — in die ci JSONB-Spalte schreiben (wie MarkeCITab es erwartet)
    ...(Object.keys(ciResult).length > 0 ? {
      ci: {
        ...(client.ci || {}),
        ...(ciResult.tonalitaet    ? { tonalitaet:     ciResult.tonalitaet    } : {}),
        ...(ciResult.anrede        ? { anrede:         ciResult.anrede        } : {}),
        ...(ciResult.claim         ? { claim:          ciResult.claim         } : {}),
        ...(ciResult.sprache_dos   ? { sprache_dos:    ciResult.sprache_dos   } : {}),
        ...(ciResult.sprache_donts ? { sprache_donts:  ciResult.sprache_donts } : {}),
        ...(ciResult.mission       ? { mission:        ciResult.mission       } : {}),
        ...(ciResult.werte         ? { werte:          ciResult.werte         } : {}),
        ...(ciResult.kernbotschaften && Array.isArray(ciResult.kernbotschaften) ? { kernbotschaften: ciResult.kernbotschaften } : {}),
        ...(ciResult.persona       ? { persona:        ciResult.persona       } : {}),
        ...(ciResult.wettbewerb    ? { wettbewerb:     ciResult.wettbewerb    } : {}),
        ...(ciResult.bildstil      ? { bildstil:       ciResult.bildstil      } : {}),
        ...(ciResult.ueber_uns     ? { ueber_uns:      ciResult.ueber_uns     } : {}),
      },
      ...(ciResult.brand_font ? { brand_font: ciResult.brand_font } : {}),
      ...(ciResult.body_font  ? { body_font:  ciResult.body_font  } : {}),
    } : {}),
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
      .map(p => ({ client_id, name: p.name, description: p.description || "", target_groups: p.target_groups || "", keywords: p.keywords || "", offer: p.offer || "", region: client.region || "" }));
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
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const body = await req.json();
  const sb   = supabaseAdmin();

  if (body.product_id) {
    return analyseProduct(body.client_id, body.product_id, sb);
  }
  return analyseWebsite(body.client_id, sb);
}
