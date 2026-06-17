"use client";
import LandingPage from "./LandingPage";

/**
 * Adapter: kombiniert Kundenprofil (clients.*) + LP-Inhalt (landing_pages.*).
 * Das Design/Layout liegt vollständig in LandingPage.js — hier kein JSX.
 *
 * Erwartetes data-Objekt (server-seitig zusammengebaut):
 *   data = { ...clients-row, ...landing_pages-row, content: jsonb }
 */
export default function LandingTemplate({ data = {} }) {
  const c = data.content || {};

  // usp_blocks: Claude liefert { titel, text }; LandingPage erwartet { icon, title, text }
  const uspBlocks = (c.usp_blocks || []).map(b => ({
    icon:  b.icon  || "✓",
    title: b.titel || b.title || "",
    text:  b.text  || "",
  }));

  // Kurz-Bullets für die Hero-Checkliste: Titel der USP-Blöcke
  const heroBullets = uspBlocks.map(b => b.title).filter(Boolean);

  const lp = {
    /* ── Identität ─────────────────────────────────── */
    brand:    data.name   || "Ihr Unternehmen",
    client:   data.name   || "",
    slug:     data.slug   || "",
    industry: data.industry || "",

    /* ── Design ────────────────────────────────────── */
    accentColor: data.accent_color || data.brand_color || "#e8600a",
    logoUrl:     data.logo_url     || null,

    /* ── Hero ──────────────────────────────────────── */
    badge:    c.badge      || "",
    headline: c.headline   || data.title || data.name || "Ihr Partner",
    subline:  c.subheadline || data.description || "",
    bullets:  heroBullets.length ? heroBullets : (c.bullets || []),
    cta:      c.cta_text   || "Jetzt anfragen",

    /* ── Formular ──────────────────────────────────── */
    formTitle: c.headline  || "Kostenloses Erstgespräch sichern",
    formSub:   c.subheadline || "",
    intents:   c.intents   || [c.cta_text || "Beratung anfragen", "Angebot einholen", "Mehr erfahren"],

    /* ── USP / Benefits ────────────────────────────── */
    benefits: uspBlocks.length ? uspBlocks : undefined,  // undefined = Fallbacks in LandingPage

    /* ── CTA-Sektion (unterer Block) ───────────────── */
    ctaTitle:    c.cta_text ? `Jetzt ${c.cta_text}` : "Kostenloses Erstgespräch sichern",
    ctaSub:      "Kostenlos · Unverbindlich · Antwort innerhalb von 24 Stunden",
    urgencyText: c.urgency || "Nur noch wenige freie Termine — jetzt sichern.",

    /* ── Social Proof ──────────────────────────────── */
    reviewCount: c.review_count  || null,
    reviewText:  c.review_text   || null,
    testimonials: c.testimonials || undefined,  // undefined = Fallbacks in LandingPage
    stats:        c.stats        || undefined,

    /* ── Prozess-Schritte ──────────────────────────── */
    steps:       c.steps        || undefined,
    processTitle: c.process_title || "So läuft es ab",

    /* ── Vergleichstabelle ──────────────────────────── */
    compareRows: c.compare_rows || undefined,

    /* ── FAQ ───────────────────────────────────────── */
    faqs: c.faqs || undefined,

    /* ── Rechtliches ────────────────────────────────── */
    impressum:    data.impressum   || "",
    datenschutz:  data.datenschutz || "",

    /* ── Kontakt ────────────────────────────────────── */
    whatsapp:         data.mobile           || null,
    whatsapp_number:  data.whatsapp_number  || null,

    /* ── Conversion-Elemente aus Kundenprofil ──────── */
    testimonials: (() => {
      if (Array.isArray(c.testimonials) && c.testimonials.length > 0) return c.testimonials;
      if (Array.isArray(data.testimonials) && data.testimonials.length > 0)
        return data.testimonials.map(t => ({ name: t.name, company: t.firma || "", text: t.text, stars: 5 }));
      return undefined;
    })(),
    reference_images: Array.isArray(data.reference_images) && data.reference_images.length > 0
      ? data.reference_images : null,
    lead_magnet: data.lead_magnet || null,
    garantie:    data.garantie    || null,
    brand_font:  data.brand_font  || null,
  };

  return <LandingPage lp={lp} />;
}
