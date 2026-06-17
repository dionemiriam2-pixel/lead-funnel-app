import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

// Nur lokal nutzbar — Vercel hat read-only Filesystem
export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug fehlt" }, { status: 400 });

  const sb = supabaseAdmin();

  // LP + Kundenprofil laden
  const { data: row, error } = await sb
    .from("landing_pages")
    .select(`
      slug, name, title, content, impressum, datenschutz,
      clients (
        name, industry, region, brand_color, accent_color,
        logo_url, mobile, phone, email
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !row) return NextResponse.json({ error: "LP nicht gefunden" }, { status: 404 });

  const c       = row.content   || {};
  const client  = row.clients   || {};

  // USP-Blöcke für die LandingPage-Prop-Struktur konvertieren
  const uspBlocks = (c.usp_blocks || []).map(b => ({
    icon:  b.icon  || "✓",
    title: b.titel || b.title || "",
    text:  b.text  || "",
  }));

  // JS-Objekt als formatierten String aufbauen
  const block = `
  // ── ${row.name || row.slug} ────────────────────────────
  {
    slug:        ${JSON.stringify(row.slug)},
    brand:       ${JSON.stringify(client.name   || "")},
    industry:    ${JSON.stringify(client.industry || "")},
    accentColor: ${JSON.stringify(client.accent_color || client.brand_color || "#e8600a")},
    logoUrl:     ${JSON.stringify(client.logo_url || null)},

    headline:    ${JSON.stringify(c.headline    || row.title || "")},
    subline:     ${JSON.stringify(c.subheadline || "")},
    cta:         ${JSON.stringify(c.cta_text    || "Jetzt anfragen")},
    bullets:     ${JSON.stringify(uspBlocks.map(b => b.title))},

    benefits: ${JSON.stringify(uspBlocks, null, 6).replace(/\n/g, "\n    ")},

    formTitle:   ${JSON.stringify(c.headline    || "Kostenloses Erstgespräch")},
    formSub:     ${JSON.stringify(c.subheadline || "")},
    ctaTitle:    ${JSON.stringify(c.cta_text ? "Jetzt " + c.cta_text : "Kostenloses Erstgespräch sichern")},
    ctaSub:      "Kostenlos · Unverbindlich · Antwort innerhalb von 24 Stunden",
    urgencyText: "Nur noch wenige freie Termine — jetzt sichern.",

    impressum:   ${JSON.stringify(row.impressum   || "")},
    datenschutz: ${JSON.stringify(row.datenschutz || "")},
    whatsapp:    ${JSON.stringify(client.mobile   || null)},
  },`;

  // In content/landingpages.js einfügen (vor der schließenden `];`)
  const filePath = join(process.cwd(), "content", "landingpages.js");
  let fileContent;
  try {
    fileContent = readFileSync(filePath, "utf8");
  } catch {
    return NextResponse.json({ error: "Datei nicht lesbar — läuft das lokal?" }, { status: 500 });
  }

  // Prüfen ob Slug schon vorhanden
  if (fileContent.includes(`slug:        "${row.slug}"`)) {
    // Bestehenden Block ersetzen
    const startMarker = `\n  // ── `;
    const slugLine    = `slug:        "${row.slug}"`;
    const slugIdx     = fileContent.indexOf(slugLine);
    if (slugIdx !== -1) {
      // Anfang des Blocks (nächstes `  // ──` vor dem slug)
      const blockStart = fileContent.lastIndexOf(startMarker, slugIdx);
      // Ende: nächste `,\n\n` oder `},` nach dem slug
      const blockEnd = fileContent.indexOf("\n  },", slugIdx) + "\n  },".length;
      if (blockStart !== -1 && blockEnd > slugIdx) {
        fileContent = fileContent.slice(0, blockStart) + block + fileContent.slice(blockEnd);
      }
    }
  } else {
    // Neu einfügen vor `];`
    const insertAt = fileContent.lastIndexOf("];");
    if (insertAt === -1) {
      return NextResponse.json({ error: "Dateiformat unbekannt — `];` nicht gefunden" }, { status: 500 });
    }
    fileContent = fileContent.slice(0, insertAt) + block + "\n\n" + fileContent.slice(insertAt);
  }

  try {
    writeFileSync(filePath, fileContent, "utf8");
  } catch (e) {
    return NextResponse.json({
      error: "Schreiben fehlgeschlagen — auf Vercel nicht möglich, nur lokal.",
      detail: e.message,
    }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug: row.slug, file: "content/landingpages.js" });
}
