// ════════════════════════════════════════════════════════════════
//  HIER liegen ALLE deine Landing Pages.
//  Neue LP = einfach einen neuen { ... }-Block in die Liste einfügen.
//  Sie ist danach sofort live unter /lp/<slug> und das Formular
//  schreibt automatisch in Supabase mit lp + client + industry.
// ════════════════════════════════════════════════════════════════

export const landingPages = [
  // ── Template 1: Ladenbau München ────────────────────────────
  {
    slug: "ladenbau-muenchen",
    client: "eigene",
    industry: "Ladenbau",
    badge: "Kostenlose Checkliste · PDF",
    headline: "In 8 Schritten zum fertigen Ladenlokal — ohne teure Fehler",
    subline:
      "Du eröffnest oder renovierst ein Geschäft in München? Diese Checkliste zeigt dir, worauf es bei Ladenbau, Innenausbau und Konzept ankommt.",
    bullets: [
      "Die 8 Phasen von der Idee bis zur Eröffnung",
      "Typische Kostenfallen — und wie du sie vermeidest",
      "Checkliste für Genehmigungen & Timing",
    ],
    formTitle: "Checkliste gratis sichern",
    formSub: "Trag dich ein — wir schicken dir die PDF und melden uns kurz.",
    cta: "Jetzt Checkliste anfordern",
  },

  // ── Template 2: Gastronomie / Restaurant-Eröffnung ─────────
  {
    slug: "restaurant-eroeffnung",
    client: "eigene",
    industry: "Gastronomie",
    badge: "Gratis-Guide · Sofort-Download",
    headline: "Restaurant eröffnen 2024 — der komplette Leitfaden für Bayern",
    subline:
      "Von der Konzeptidee bis zum ersten Gast: Erfahre, welche Genehmigungen, Umbaukosten und Zeitpläne du wirklich einkalkulieren musst.",
    bullets: [
      "Behörden & Genehmigungen Schritt für Schritt erklärt",
      "Umbau-Budget realistisch planen (inkl. Beispielrechnung)",
      "Die 5 häufigsten Fehler bei Neueröffnungen — und wie du sie umgehst",
    ],
    formTitle: "Leitfaden kostenlos anfordern",
    formSub: "Wir schicken dir den Guide als PDF und stehen für Fragen bereit.",
    cta: "Guide jetzt anfordern",
  },

  // ── Template 3: Einzelhandel / Shop-Redesign ────────────────
  {
    slug: "einzelhandel-neugestaltung",
    client: "eigene",
    industry: "Einzelhandel",
    badge: "Kostenlose Erstberatung",
    headline: "Mehr Kunden durch besseres Ladendesign — wir zeigen wie",
    subline:
      "Ein modernes Ladenlayout steigert den Umsatz nachweislich. Lass uns gemeinsam prüfen, wie dein Geschäft sein volles Potenzial ausschöpft.",
    bullets: [
      "Kostenloses 30-Minuten-Beratungsgespräch (persönlich oder per Video)",
      "Konkrete Ideen für Layout, Beleuchtung & Warenpräsentation",
      "Unverbindlich — du entscheidest danach frei",
    ],
    formTitle: "Termin für Erstberatung sichern",
    formSub: "Kurz eintragen, wir melden uns innerhalb von 24 Stunden.",
    cta: "Beratungstermin anfragen",
  },
];

export function getLp(slug) {
  return landingPages.find((l) => l.slug === slug);
}
