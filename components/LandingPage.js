"use client";
import { useState } from "react";
import LeadForm from "./LeadForm";

// ── Subkomponenten ──────────────────────────────────────────────

function StarRow({ n = 5 }) {
  return <span style={{ color: "#f59e0b", letterSpacing: 2, fontSize: 16 }}>{"★".repeat(n)}</span>;
}

function Avatar({ name }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#1a1a2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
      {name?.[0] || "?"}
    </div>
  );
}

// ── Hauptkomponente ─────────────────────────────────────────────

export default function LandingPage({ lp }) {
  const [navOpen, setNavOpen] = useState(false);

  const accent = lp.accentColor || "#e8600a";
  const dark = "#111111";

  const benefits = lp.benefits || [
    { icon: "⚡", title: "Schnelle Umsetzung", text: "Klare Abläufe und eingespieltes Team — dein Projekt bleibt im Zeitplan." },
    { icon: "💰", title: "Transparente Kosten", text: "Kein verstecktes Kleingedrucktes. Du weißt vorher, was es kostet." },
    { icon: "🏆", title: "Erfahrung aus 50+ Projekten", text: "Wir kennen die Stolpersteine — und wie man sie umgeht." },
  ];

  const testimonials = lp.testimonials || [
    { name: "Sabine K.", company: "Boutique München", text: "Professionell, pünktlich und wirklich mitdenkend. Unser Laden sieht besser aus als erträumt.", stars: 5 },
    { name: "Thomas M.", company: "Café am Markt", text: "Das Team hat alle Kosten im Griff gehalten. Keine bösen Überraschungen — das war Gold wert.", stars: 5 },
    { name: "Julia F.", company: "Mode & Mehr GmbH", text: "Innerhalb von 6 Wochen war alles fertig. Ich hätte es nie allein so schnell geschafft.", stars: 5 },
    { name: "Kevin B.", company: "Fitnessstudio Köln", text: "Von der ersten Idee bis zur Eröffnung — rundum betreut. Ich würde es sofort wieder so machen.", stars: 5 },
  ];

  const faqs = lp.faqs || [
    { q: "Wie lange dauert eine typische Beratung?", a: "Das erste Gespräch dauert etwa 30 Minuten — kostenlos und unverbindlich. Danach bekommst du ein konkretes Angebot." },
    { q: "Was kostet ein Projekt ungefähr?", a: "Das hängt von Größe und Ausstattung ab. Wir geben dir nach dem Erstgespräch eine realistische Einschätzung, bevor du irgendetwas unterschreibst." },
    { q: "Übernehmt ihr auch die Genehmigungen?", a: "Ja, wir begleiten dich durch den gesamten Prozess — inklusive Behördengängen und Terminkoordination." },
    { q: "Macht ihr auch kleinere Umbauten?", a: "Absolut. Ob komplette Neueröffnung oder einzelne Umbaumaßnahme — wir helfen bei jedem Projektumfang." },
  ];

  const stats = lp.stats || [
    { n: "+260", label: "Realisierte Projekte" },
    { n: "+60", label: "Zufriedene Kunden" },
    { n: "5★", label: "Google-Bewertung" },
    { n: "< 24h", label: "Antwortzeit" },
  ];

  const compareRows = lp.compareRows || [
    { topic: "Planungssicherheit", without: "Unklare Kosten und Zeitplan", with: "Fester Preis, fester Termin" },
    { topic: "Koordination", without: "Du organisierst alles selbst", with: "Wir übernehmen alle Gewerke" },
    { topic: "Erfahrung", without: "Viel ausprobieren, viel lernen", with: "50+ Projekte Erfahrung direkt für dich" },
    { topic: "Stress", without: "Nächte mit Angeboten und Emails", with: "Ein Ansprechpartner, alles klar" },
    { topic: "Ergebnis", without: "Kompromisse überall", with: "Genau das, was du dir vorgestellt hast" },
  ];

  const phases = lp.steps || [
    { n: "01", title: "Anfrage & Erstgespräch", text: "Du trägst dich ein — wir melden uns innerhalb von 24 Stunden für ein kostenloses Erstgespräch." },
    { n: "02", title: "Analyse & Konzept", text: "Wir schauen uns deine Situation genau an und entwickeln einen klaren Plan für dein Projekt." },
    { n: "03", title: "Angebot & Freigabe", text: "Du bekommst ein transparentes Angebot ohne Überraschungen. Erst wenn du ja sagst, geht es los." },
    { n: "04", title: "Umsetzung & Eröffnung", text: "Wir koordinieren alles — du kannst dich auf dein Kerngeschäft konzentrieren." },
  ];

  const urgency = lp.urgencyText || "Nur noch wenige freie Termine — jetzt sichern.";

  return (
    <main style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#111111" }}>

      {/* ── STICKY NAV ───────────────────────────────────────── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 20px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 20, color: dark, letterSpacing: -0.5 }}>
            {lp.brand || lp.client || "Ihre Marke"}
          </div>
          <a href="#form-cta"
            style={{ padding: "10px 22px", background: accent, color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            Kostenloses Erstgespräch →
          </a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ background: dark, color: "#fff", padding: "80px 20px 88px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 56, alignItems: "flex-start" }}>

          <div style={{ flex: "1 1 360px", minWidth: 280 }}>
            {lp.badge && (
              <span style={{ display: "inline-block", background: accent, color: "#fff", padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
                {lp.badge}
              </span>
            )}
            <h1 style={{ fontSize: "clamp(30px,4.5vw,50px)", lineHeight: 1.12, fontWeight: 900, marginBottom: 22, letterSpacing: -1 }}>
              {lp.headline}
            </h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,.72)", marginBottom: 36, lineHeight: 1.65 }}>
              {lp.subline}
            </p>
            <ul style={{ listStyle: "none", marginBottom: 44 }}>
              {(lp.bullets || []).map((b, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "9px 0", fontSize: 16, color: "rgba(255,255,255,.85)", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                  <span style={{ flexShrink: 0, color: accent, fontWeight: 900, fontSize: 18, marginTop: 1 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div>
                <StarRow n={5} />
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
                  {lp.reviewCount || "50+"} {lp.reviewText || "zufriedene Kunden"}
                </div>
              </div>
              <div style={{ width: 1, height: 36, background: "rgba(255,255,255,.15)" }} />
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", lineHeight: 1.6 }}>
                Kostenlos · Unverbindlich · Vertraulich
              </div>
            </div>
          </div>

          {/* Form */}
          <div id="form-top" style={{ flex: "0 1 380px", minWidth: 280, background: "#fff", color: "#111", borderRadius: 18, padding: "36px 30px", boxShadow: "0 24px 72px rgba(0,0,0,.4)" }}>
            <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 4, color: dark }}>
              {lp.formTitle || "Jetzt kostenloses Erstgespräch sichern"}
            </h2>
            {lp.formSub && <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>{lp.formSub}</p>}
            <LeadForm lp={lp} accent={accent} />
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 14, textAlign: "center" }}>
              🔒 Kostenlos · Unverbindlich · Vertraulich
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6", padding: "40px 20px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", justifyContent: "center", gap: "0", flexWrap: "wrap" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ flex: "1 1 160px", textAlign: "center", padding: "16px 24px", borderRight: i < stats.length - 1 ? "1px solid #e5e7eb" : "none" }}>
              <div style={{ fontSize: 34, fontWeight: 900, color: dark, letterSpacing: -1 }}>{s.n}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PHASEN (01-04) ───────────────────────────────────── */}
      <section style={{ background: "#fff", padding: "88px 20px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(24px,3.5vw,36px)", fontWeight: 900, color: dark, marginBottom: 12, letterSpacing: -0.5 }}>
              {lp.processTitle || "So läuft es ab"}
            </h2>
            <p style={{ fontSize: 17, color: "#6b7280", lineHeight: 1.6 }}>In 4 klaren Schritten vom ersten Gespräch bis zum Ergebnis.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {phases.map((p, idx) => (
              <div key={p.n} style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 72, flexShrink: 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: dark, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, letterSpacing: -0.5, flexShrink: 0 }}>
                    {p.n}
                  </div>
                  {idx < phases.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: "#e5e7eb", minHeight: 48, margin: "10px 0" }} />
                  )}
                </div>
                <div style={{ paddingBottom: idx < phases.length - 1 ? 44 : 0, paddingTop: 12, flex: 1 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: dark, marginBottom: 8 }}>{p.title}</h3>
                  <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7 }}>{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VERGLEICHSTABELLE ────────────────────────────────── */}
      <section style={{ background: "#f9fafb", padding: "88px 20px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,3.5vw,36px)", fontWeight: 900, color: dark, marginBottom: 12, letterSpacing: -0.5 }}>
              Der Unterschied auf einen Blick
            </h2>
          </div>
          <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,.08)", border: "1px solid #f3f4f6" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: dark, color: "#fff" }}>
              <div style={{ padding: "16px 20px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase" }}></div>
              <div style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, textAlign: "center", color: "rgba(255,255,255,.6)" }}>Ohne uns</div>
              <div style={{ padding: "16px 20px", fontSize: 14, fontWeight: 800, textAlign: "center", color: accent }}>Mit {lp.brand || "uns"} ✓</div>
            </div>
            {compareRows.map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: i < compareRows.length - 1 ? "1px solid #f3f4f6" : "none", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <div style={{ padding: "18px 20px", fontWeight: 700, fontSize: 14, color: dark }}>{r.topic}</div>
                <div style={{ padding: "18px 20px", fontSize: 14, color: "#9ca3af", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>✕</span> {r.without}
                </div>
                <div style={{ padding: "18px 20px", fontSize: 14, color: "#111", fontWeight: 600, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span style={{ color: accent, fontWeight: 700 }}>✓</span> {r.with}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section style={{ background: "#fff", padding: "88px 20px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(24px,3.5vw,36px)", fontWeight: 900, color: dark, marginBottom: 12, letterSpacing: -0.5 }}>
              Das sagen unsere Kunden
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: "#f9fafb", borderRadius: 16, padding: 28, border: "1px solid #f3f4f6" }}>
                <StarRow n={t.stars || 5} />
                <p style={{ fontSize: 15, color: "#374151", margin: "14px 0 22px", lineHeight: 1.7, fontStyle: "italic" }}>
                  „{t.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={t.name} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: dark }}>{t.name}</div>
                    {t.company && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>{t.company}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section style={{ background: "#f9fafb", padding: "88px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: "clamp(24px,3.5vw,36px)", fontWeight: 900, color: dark, marginBottom: 12, letterSpacing: -0.5 }}>
              Häufige Fragen
            </h2>
          </div>
          <div style={{ background: "#fff", borderRadius: 18, padding: "8px 32px", boxShadow: "0 4px 32px rgba(0,0,0,.06)" }}>
            {faqs.map((f, i) => (
              <details key={i} style={{ borderBottom: i < faqs.length - 1 ? "1px solid #f3f4f6" : "none", padding: "22px 0" }}>
                <summary style={{ fontWeight: 700, fontSize: 16, color: dark, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <span style={{ color: accent, fontWeight: 900, marginRight: 10, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {f.q}
                  <span style={{ fontSize: 22, color: "#9ca3af", flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ marginTop: 14, color: "#6b7280", fontSize: 15, lineHeight: 1.75, paddingLeft: 32 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA SECTION ────────────────────────────────── */}
      <section id="form-cta" style={{ background: dark, color: "#fff", padding: "88px 20px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 56, alignItems: "center" }}>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ display: "inline-block", background: accent, color: "#fff", padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
              ⏰ {urgency}
            </div>
            <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, marginBottom: 18, lineHeight: 1.15, letterSpacing: -0.5 }}>
              {lp.ctaTitle || "Jetzt kostenloses Erstgespräch sichern"}
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.65)", lineHeight: 1.65 }}>
              {lp.ctaSub || "Kostenlos · Unverbindlich · Antwort innerhalb von 24 Stunden"}
            </p>
            <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
              {["Persönliche Beratung ohne Druck", "Klares Angebot danach", "Über 50 erfolgreich abgeschlossene Projekte"].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 15, color: "rgba(255,255,255,.8)" }}>
                  <span style={{ color: accent, fontWeight: 900 }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: "0 1 400px", minWidth: 280, background: "#fff", color: "#111", borderRadius: 18, padding: "36px 30px", boxShadow: "0 24px 72px rgba(0,0,0,.4)" }}>
            <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 20, color: dark }}>
              {lp.formTitle || "Jetzt anfragen"}
            </h3>
            <LeadForm lp={lp} accent={accent} />
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 14, textAlign: "center" }}>
              🔒 Kostenlos · Unverbindlich · Vertraulich
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: "#0a0a0a", color: "#4b5563", padding: "32px 20px", textAlign: "center", fontSize: 13, borderTop: "1px solid #1a1a1a" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>{lp.brand || lp.client || ""}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <span>Alle Angaben ohne Gewähr</span>
            {lp.impressum_url
              ? <a href={lp.impressum_url} target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280" }}>Impressum</a>
              : lp.impressum ? <a href="#impressum" style={{ color: "#6b7280" }}>Impressum</a> : null}
            {lp.datenschutz_url
              ? <a href={lp.datenschutz_url} target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280" }}>Datenschutz</a>
              : lp.datenschutz ? <a href="#datenschutz" style={{ color: "#6b7280" }}>Datenschutz</a> : null}
          </div>
        </div>
      </footer>

      {/* ── IMPRESSUM / DATENSCHUTZ ABSCHNITTE ───────────────── */}
      {lp.impressum && (
        <section id="impressum" style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb", padding: "40px 20px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Impressum</h2>
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{lp.impressum}</div>
          </div>
        </section>
      )}
      {lp.datenschutz && (
        <section id="datenschutz" style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "40px 20px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Datenschutzerklärung</h2>
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{lp.datenschutz}</div>
          </div>
        </section>
      )}

      {/* ── WHATSAPP BUTTON ──────────────────────────────────── */}
      {lp.whatsapp && (
        <a href={"https://wa.me/" + lp.whatsapp.replace(/\D/g, "")}
          target="_blank" rel="noopener"
          style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 20px rgba(0,0,0,.25)", zIndex: 999, textDecoration: "none" }}>
          💬
        </a>
      )}

    </main>
  );
}
