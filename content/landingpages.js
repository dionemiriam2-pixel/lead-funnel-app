// ════════════════════════════════════════════════════════════════
//  HIER liegen ALLE deine Landing Pages.
//  Neue LP = einfach einen neuen { ... }-Block einfügen.
//  Live unter /lp/<slug>  ·  Formular schreibt direkt in Supabase.
// ════════════════════════════════════════════════════════════════

export const landingPages = [

  // ── Template 1: Ladenbau München ────────────────────────────
  {
    slug: "ladenbau-muenchen",
    client: "eigene",
    industry: "Ladenbau",

    // Hero
    badge: "Kostenlose Checkliste · PDF",
    headline: "In 8 Schritten zum fertigen Ladenlokal — ohne teure Fehler",
    subline: "Du eröffnest oder renovierst ein Geschäft in München? Diese Checkliste zeigt dir, worauf es bei Ladenbau, Innenausbau und Konzept ankommt.",
    bullets: [
      "Die 8 Phasen von der Idee bis zur Eröffnung",
      "Typische Kostenfallen — und wie du sie vermeidest",
      "Checkliste für Genehmigungen & Timing",
    ],
    reviewCount: "50+",
    reviewText: "begleitete Ladenbauprojekte",

    // Formular
    formTitle: "Checkliste gratis sichern",
    formSub: "Trag dich ein — wir schicken die PDF und melden uns kurz.",
    cta: "Jetzt Checkliste anfordern",
    intents: ["Neueröffnung planen", "Bestehenden Laden umbauen", "Erstberatung anfragen"],

    // Vorteile
    benefits: [
      { icon: "📋", title: "Klare Checkliste", text: "Kein Rätselraten mehr. Du weißt Schritt für Schritt, was als Nächstes kommt." },
      { icon: "💰", title: "Kosten im Griff", text: "Wir zeigen dir, wo die häufigsten Kostenfallen lauern — und wie du sie umgehst." },
      { icon: "⏱️", title: "Zeit sparen", text: "Mit dem richtigen Plan sparst du Wochen an Planung und vermeidest teure Nacharbeiten." },
    ],

    // Wie es läuft
    steps: [
      { n: "1", title: "Checkliste anfordern", text: "Einfach eintragen — dauert 60 Sekunden. Kein Spam, keine versteckten Kosten." },
      { n: "2", title: "PDF per E-Mail erhalten", text: "Du bekommst die Checkliste sofort und wir melden uns für ein kurzes Gespräch." },
      { n: "3", title: "Projekt starten", text: "Mit klarer Roadmap startest du ohne Chaos in dein Ladenbauprojekt." },
    ],

    // Testimonials
    testimonials: [
      { name: "Sabine K.", company: "Boutique München", text: "Die Checkliste war Gold wert. Ich hätte ohne sie 3 wichtige Genehmigungen vergessen.", stars: 5 },
      { name: "Thomas M.", company: "Café am Markt", text: "Endlich mal jemand, der klar erklärt was ich wann brauche. Sehr empfehlenswert!", stars: 5 },
      { name: "Julia F.", company: "Mode & Mehr GmbH", text: "Damit haben wir unsere Eröffnung 4 Wochen früher als geplant geschafft.", stars: 5 },
    ],

    // FAQ
    faqs: [
      { q: "Ist die Checkliste wirklich kostenlos?", a: "Ja, vollständig kostenlos und ohne Haken. Wir schicken sie dir direkt per E-Mail." },
      { q: "Für welche Projektgrößen ist die Checkliste geeignet?", a: "Vom kleinen Umbau bis zur kompletten Neueröffnung — die Checkliste ist flexibel und für alle Größen hilfreich." },
      { q: "Muss ich danach etwas kaufen?", a: "Nein. Die Checkliste ist ein Geschenk. Ein Folgegespräch ist nur auf deinen Wunsch." },
      { q: "Wie schnell bekomme ich die Checkliste?", a: "In der Regel innerhalb von wenigen Minuten nach deiner Eintragung." },
    ],

    // Urgency & Final CTA
    urgencyText: "Nur noch wenige Beratungsplätze frei — jetzt Checkliste sichern.",
    ctaTitle: "Checkliste jetzt kostenlos anfordern",
    ctaSub: "Kostenlos · Sofort per E-Mail · Unverbindlich",
    footerText: "Konzept mit Kopf GmbH · Impressum · Datenschutz",
  },

  // ── Template 2: Gastronomie / Restaurant-Eröffnung ─────────
  {
    slug: "restaurant-eroeffnung",
    client: "eigene",
    industry: "Gastronomie",

    badge: "Gratis-Guide · Sofort-Download",
    headline: "Restaurant eröffnen 2024 — der komplette Leitfaden für Bayern",
    subline: "Von der Konzeptidee bis zum ersten Gast: Erfahre, welche Genehmigungen, Umbaukosten und Zeitpläne du wirklich einkalkulieren musst.",
    bullets: [
      "Behörden & Genehmigungen Schritt für Schritt erklärt",
      "Umbau-Budget realistisch planen (inkl. Beispielrechnung)",
      "Die 5 häufigsten Fehler bei Neueröffnungen — und wie du sie umgehst",
    ],
    reviewCount: "35+",
    reviewText: "Gastro-Projekte erfolgreich umgesetzt",

    formTitle: "Leitfaden kostenlos anfordern",
    formSub: "Wir schicken dir den Guide als PDF und stehen für Fragen bereit.",
    cta: "Guide jetzt anfordern",
    intents: ["Restaurant neu eröffnen", "Café oder Bistro planen", "Bestandslokal umbauen"],

    benefits: [
      { icon: "📄", title: "Alle Genehmigungen im Überblick", text: "Gaststättenerlaubnis, Hygieneschulung, Bauantrag — wir erklären was wann nötig ist." },
      { icon: "🏗️", title: "Umbau ohne böse Überraschungen", text: "Realistische Kostenplanung statt Schätzungen auf gut Glück." },
      { icon: "🚀", title: "Schneller zum ersten Gast", text: "Mit dem richtigen Zeitplan eröffnest du früher — und stressfreier." },
    ],

    steps: [
      { n: "1", title: "Guide anfordern", text: "60 Sekunden eintragen — du bekommst sofort den kompletten Leitfaden." },
      { n: "2", title: "Konzept prüfen lassen", text: "Wir schauen uns dein Vorhaben an und geben ehrliches Feedback." },
      { n: "3", title: "Eröffnung planen", text: "Mit klarer Roadmap und echten Zahlen startest du sicher in die Selbstständigkeit." },
    ],

    testimonials: [
      { name: "Marco R.", company: "Trattoria Roma, München", text: "Ohne den Guide hätte ich 2 Monate verschwendet. Alles klar und verständlich erklärt.", stars: 5 },
      { name: "Anna S.", company: "Café Sonnenschein", text: "Ich wusste gar nicht, wie viele Genehmigungen ich brauchte. Der Guide hat mir Augen geöffnet.", stars: 5 },
      { name: "Kevin B.", company: "Burger & Co.", text: "Die Kostenaufstellung war realistisch. Kein anderer hat mir das vorher so klar gesagt.", stars: 5 },
    ],

    faqs: [
      { q: "Brauche ich eine Gaststättenerlaubnis?", a: "Das hängt von Bundesland und Konzept ab. Bayern hat eigene Regelungen — wir erklären das im Guide und im Gespräch." },
      { q: "Was kostet ein Gastro-Umbau typischerweise?", a: "Das variiert stark. Wir zeigen dir im Guide Beispielrechnungen für verschiedene Größen — vom kleinen Café bis zum Restaurant mit 80 Plätzen." },
      { q: "Wie lange dauert eine typische Restauranteröffnung?", a: "Realistisch 4–9 Monate — je nach Zustand des Objekts und Genehmigungssituation." },
      { q: "Begleitet ihr uns auch durch den gesamten Prozess?", a: "Ja, wir können von der Planung bis zur Eröffnung dabei sein — komplett oder nur für einzelne Schritte." },
    ],

    urgencyText: "Saisonstart naht — jetzt frühzeitig planen und Engpässe vermeiden.",
    ctaTitle: "Guide jetzt kostenlos herunterladen",
    ctaSub: "Sofort per E-Mail · Keine Kosten · Kein Risiko",
    footerText: "Konzept mit Kopf GmbH · Impressum · Datenschutz",
  },

  // ── Template 3: Einzelhandel / Shop-Redesign ────────────────
  {
    slug: "einzelhandel-neugestaltung",
    client: "eigene",
    industry: "Einzelhandel",

    badge: "Kostenlose Erstberatung · 30 Min.",
    headline: "Mehr Kunden durch besseres Ladendesign — wir zeigen wie",
    subline: "Ein modernes Ladenlayout steigert den Umsatz nachweislich. Lass uns gemeinsam prüfen, wie dein Geschäft sein volles Potenzial ausschöpft.",
    bullets: [
      "Kostenloses 30-Minuten-Beratungsgespräch (persönlich oder per Video)",
      "Konkrete Ideen für Layout, Beleuchtung & Warenpräsentation",
      "Unverbindlich — du entscheidest danach frei",
    ],
    reviewCount: "40+",
    reviewText: "Einzelhändler erfolgreich beraten",

    formTitle: "Termin für Erstberatung sichern",
    formSub: "Kurz eintragen, wir melden uns innerhalb von 24 Stunden.",
    cta: "Beratungstermin anfragen",
    intents: ["Ladengestaltung modernisieren", "Mehr Laufkundschaft gewinnen", "Umbau konkret planen"],

    benefits: [
      { icon: "🛍️", title: "Mehr Verweildauer", text: "Ein durchdachtes Layout hält Kunden länger im Geschäft — und erhöht den Warenkorbwert." },
      { icon: "💡", title: "Beleuchtung & Atmosphäre", text: "Die richtige Lichtführung entscheidet, ob Kunden kaufen oder nur schauen." },
      { icon: "📐", title: "Professionelle Planung", text: "Wir bringen Erfahrung aus 40+ Projekten mit — du bekommst bewährte Konzepte." },
    ],

    steps: [
      { n: "1", title: "Termin anfragen", text: "Einfach eintragen — wir melden uns innerhalb von 24 Stunden für einen Termin." },
      { n: "2", title: "Kostenloses Gespräch", text: "Wir besprechen dein Geschäft, deine Ziele und mögliche Verbesserungen." },
      { n: "3", title: "Konkretes Konzept", text: "Du bekommst erste Ideen und ein unverbindliches Angebot." },
    ],

    testimonials: [
      { name: "Lisa M.", company: "Schuhhaus Müller", text: "Nach dem Umbau ist unser Umsatz um 23% gestiegen. Das hätte ich nie erwartet.", stars: 5 },
      { name: "Stefan W.", company: "Spielzeug & Mehr", text: "Endlich weiß ich, wie ich meine Waren richtig präsentiere. Die Beratung hat sich sofort bezahlt gemacht.", stars: 5 },
      { name: "Claudia N.", company: "Blumen Natur", text: "Das Team hat verstanden, was mein Laden ausstrahlen soll. Wunderbar umgesetzt.", stars: 5 },
    ],

    faqs: [
      { q: "Ist die Erstberatung wirklich kostenlos?", a: "Ja, das 30-Minuten-Gespräch ist vollständig kostenlos und ohne Verpflichtung." },
      { q: "Muss ich vor Ort sein oder geht das auch per Video?", a: "Beides ist möglich. Viele unserer Erstgespräche finden per Videocall statt." },
      { q: "Was passiert nach der Beratung?", a: "Du bekommst eine kurze Zusammenfassung mit ersten Ideen. Ob du danach ein Angebot möchtest, entscheidest du vollkommen frei." },
      { q: "Für wie große Flächen ist das sinnvoll?", a: "Von der 40 qm Boutique bis zum 300 qm Fachgeschäft — wir haben Erfahrung mit allen Größen." },
    ],

    urgencyText: "Begrenzte Termine im Juni — jetzt kostenlosen Platz sichern.",
    ctaTitle: "Kostenlosen Beratungstermin sichern",
    ctaSub: "30 Minuten · Kostenlos · Per Video oder vor Ort",
    footerText: "Konzept mit Kopf GmbH · Impressum · Datenschutz",
  },

];

export function getLp(slug) {
  return landingPages.find((l) => l.slug === slug);
}
