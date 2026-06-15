import LeadForm from "./LeadForm";

function StarRow({ n = 5 }) {
  return <span style={{ color: "#f59e0b", letterSpacing: 2, fontSize: 17 }}>{"★".repeat(n)}</span>;
}

function CheckItem({ text, dark }) {
  return (
    <li style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", fontSize: 16 }}>
      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#fff", marginTop: 1 }}>✓</span>
      <span style={{ color: dark ? "rgba(255,255,255,.9)" : "#374151", lineHeight: 1.5 }}>{text}</span>
    </li>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 52 }}>
      <h2 style={{ fontSize: "clamp(24px,3.5vw,34px)", fontWeight: 800, color: "#111827", marginBottom: 12, lineHeight: 1.25 }}>{children}</h2>
      {sub && <p style={{ fontSize: 17, color: "#6b7280", maxWidth: 540, margin: "0 auto", lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

function BenefitCard({ icon, title, text }) {
  return (
    <div style={{ flex: "1 1 220px", background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 20px rgba(0,0,0,.06)", border: "1px solid #f3f4f6" }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#111827" }}>{title}</h3>
      <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

function TestimonialCard({ name, company, text, stars = 5 }) {
  return (
    <div style={{ flex: "1 1 260px", background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 20px rgba(0,0,0,.06)", border: "1px solid #f3f4f6" }}>
      <StarRow n={stars} />
      <p style={{ fontSize: 15, color: "#374151", margin: "14px 0 20px", lineHeight: 1.7, fontStyle: "italic" }}>„{text}"</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>
          {name[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{name}</div>
          {company && <div style={{ fontSize: 12, color: "#9ca3af" }}>{company}</div>}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  return (
    <details style={{ borderBottom: "1px solid #f3f4f6", padding: "20px 0" }}>
      <summary style={{ fontWeight: 700, fontSize: 16, color: "#111827", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {q}
        <span style={{ fontSize: 20, color: "#10b981", userSelect: "none", marginLeft: 16, flexShrink: 0, fontWeight: 900 }}>+</span>
      </summary>
      <p style={{ marginTop: 14, color: "#6b7280", fontSize: 15, lineHeight: 1.75 }}>{a}</p>
    </details>
  );
}

export default function LandingPage({ lp }) {

  const benefits = lp.benefits || [
    { icon: "⚡", title: "Schnelle Umsetzung", text: "Klare Abläufe und eingespieltes Team — dein Projekt bleibt im Zeitplan." },
    { icon: "💰", title: "Transparente Kosten", text: "Kein verstecktes Kleingedrucktes. Du weißt vorher, was es kostet." },
    { icon: "🏆", title: "Erfahrung aus 50+ Projekten", text: "Wir kennen die Stolpersteine — und wie man sie umgeht." },
  ];

  const testimonials = lp.testimonials || [
    { name: "Sabine K.", company: "Boutique München", text: "Professionell, pünktlich und wirklich mitdenkend. Unser Laden sieht besser aus als erträumt.", stars: 5 },
    { name: "Thomas M.", company: "Café am Markt", text: "Das Team hat alle Kosten im Griff gehalten. Keine bösen Überraschungen — das war Gold wert.", stars: 5 },
    { name: "Julia F.", company: "Mode & Mehr GmbH", text: "Innerhalb von 6 Wochen war alles fertig. Ich hätte es nie allein so schnell geschafft.", stars: 5 },
  ];

  const faqs = lp.faqs || [
    { q: "Wie lange dauert eine typische Beratung?", a: "Das erste Gespräch dauert etwa 30 Minuten — kostenlos und unverbindlich. Danach bekommst du ein konkretes Angebot." },
    { q: "Was kostet ein Ladenbau-Projekt ungefähr?", a: "Das hängt von Größe und Ausstattung ab. Wir geben dir nach dem Erstgespräch eine realistische Einschätzung, bevor du irgendetwas unterschreibst." },
    { q: "Übernehmt ihr auch die Genehmigungen?", a: "Ja, wir begleiten dich durch den gesamten Prozess — inklusive Behördengängen und Terminkoordination." },
    { q: "Macht ihr auch kleinere Umbauten?", a: "Absolut. Ob komplette Neueröffnung oder einzelne Umbaumaßnahme — wir helfen bei jedem Projektumfang." },
  ];

  const urgency = lp.urgencyText || "Nur noch wenige freie Beratungstermine — jetzt Platz sichern.";
  const reviewCount = lp.reviewCount || "50+";
  const reviewText = lp.reviewText || "zufriedene Kunden";

  return (
    <main style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: "#111827" }}>

      {/* ── 1. HERO ─────────────────────────────────────────── */}
      <section style={{ background: "#111827", color: "#fff", padding: "72px 20px 80px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 52, alignItems: "flex-start" }}>

          {/* Left: Copy */}
          <div style={{ flex: "1 1 340px", minWidth: 280 }}>
            {lp.badge && (
              <span style={{ display: "inline-block", background: "#10b981", color: "#fff", padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 24, letterSpacing: .3 }}>
                {lp.badge}
              </span>
            )}
            <h1 style={{ fontSize: "clamp(28px,4vw,44px)", lineHeight: 1.15, fontWeight: 900, marginBottom: 20, letterSpacing: -.5 }}>{lp.headline}</h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,.75)", marginBottom: 32, lineHeight: 1.65 }}>{lp.subline}</p>
            <ul style={{ listStyle: "none", marginBottom: 40 }}>
              {(lp.bullets || []).map((b, i) => <CheckItem key={i} text={b} dark />)}
            </ul>

            {/* Social proof bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", background: "rgba(255,255,255,.07)", borderRadius: 14, padding: "16px 20px", border: "1px solid rgba(255,255,255,.1)" }}>
              <div>
                <StarRow n={5} />
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginTop: 3 }}>{reviewCount} {reviewText}</div>
              </div>
              <div style={{ width: 1, height: 38, background: "rgba(255,255,255,.15)" }} />
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", lineHeight: 1.6 }}>
                ✓ Kostenlos &nbsp;·&nbsp; ✓ Unverbindlich &nbsp;·&nbsp; ✓ Antwort in 24h
              </div>
            </div>
          </div>

          {/* Right: Form card */}
          <div style={{ flex: "0 1 370px", minWidth: 280, background: "#fff", color: "#111827", borderRadius: 20, padding: "36px 30px", boxShadow: "0 24px 64px rgba(0,0,0,.35)" }}>
            <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 4, color: "#111827" }}>{lp.formTitle || "Jetzt anfragen"}</h2>
            {lp.formSub && <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 22 }}>{lp.formSub}</p>}
            <LeadForm lp={lp} />
          </div>
        </div>
      </section>

      {/* ── 2. VERTRAUENSLEISTE ─────────────────────────────── */}
      <section style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6", padding: "22px 20px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", justifyContent: "center", gap: "14px 44px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { icon: "🔒", text: "SSL-verschlüsselt" },
            { icon: "🚫", text: "Kein Spam" },
            { icon: "📞", text: "Antwort in 24h" },
            { icon: "🤝", text: "100% unverbindlich" },
          ].map(t => (
            <span key={t.text} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "#6b7280", fontWeight: 600 }}>
              {t.icon} {t.text}
            </span>
          ))}
        </div>
      </section>

      {/* ── 3. VORTEILE ─────────────────────────────────────── */}
      <section style={{ padding: "80px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <SectionTitle sub="Was du von der Zusammenarbeit mit uns bekommst.">
            Dein Vorteil auf einen Blick
          </SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {benefits.map((b, i) => <BenefitCard key={i} {...b} />)}
          </div>
        </div>
      </section>

      {/* ── 4. SO LÄUFT ES AB ───────────────────────────────── */}
      <section style={{ background: "#f9fafb", padding: "80px 20px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <SectionTitle sub="In 3 einfachen Schritten zum Ergebnis.">So funktioniert es</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {(lp.steps || [
              { n: "01", title: "Anfrage stellen", text: "Trag dich in das Formular ein — dauert unter 2 Minuten." },
              { n: "02", title: "Kostenloses Erstgespräch", text: "Wir melden uns innerhalb von 24h und klären dein Vorhaben." },
              { n: "03", title: "Maßgeschneidertes Angebot", text: "Du bekommst ein klares Angebot — ohne Überraschungen." },
            ]).map((s, idx, arr) => (
              <div key={s.n} style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 24 }}>
                  <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: "50%", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, letterSpacing: -1 }}>{s.n}</div>
                  {idx < arr.length - 1 && <div style={{ width: 2, flex: 1, background: "#e5e7eb", minHeight: 40, margin: "8px 0" }} />}
                </div>
                <div style={{ paddingTop: 12, paddingBottom: idx < arr.length - 1 ? 36 : 0 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#111827" }}>{s.title}</h3>
                  <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.65 }}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. TESTIMONIALS ─────────────────────────────────── */}
      <section style={{ padding: "80px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <SectionTitle sub="Das sagen unsere Kunden über die Zusammenarbeit.">
            Echte Erfahrungen, echte Ergebnisse
          </SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {testimonials.map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ──────────────────────────────────────────── */}
      <section style={{ background: "#f9fafb", padding: "80px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <SectionTitle sub="Häufig gestellte Fragen — ehrlich beantwortet.">
            Deine Fragen, unsere Antworten
          </SectionTitle>
          <div style={{ background: "#fff", borderRadius: 16, padding: "8px 32px", boxShadow: "0 2px 20px rgba(0,0,0,.06)" }}>
            {faqs.map((f, i) => <FaqItem key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── 7. FINAL CTA ────────────────────────────────────── */}
      <section style={{ background: "#111827", color: "#fff", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "#10b981", color: "#fff", padding: "8px 20px", borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 28, letterSpacing: .3 }}>
            ⏰ {urgency}
          </div>
          <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 900, marginBottom: 16, letterSpacing: -.5 }}>
            {lp.ctaTitle || "Jetzt kostenlosen Termin sichern"}
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.7)", marginBottom: 40, lineHeight: 1.6 }}>
            {lp.ctaSub || "Kostenlos · Unverbindlich · Antwort innerhalb von 24 Stunden"}
          </p>
          <div style={{ background: "#fff", color: "#111827", borderRadius: 20, padding: "36px 32px", maxWidth: 420, margin: "0 auto", boxShadow: "0 24px 64px rgba(0,0,0,.35)", textAlign: "left" }}>
            <LeadForm lp={lp} />
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,.4)" }}>
            🔒 Deine Daten werden vertraulich behandelt und nicht weitergegeben.
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ background: "#0f172a", color: "#4b5563", padding: "28px 20px", textAlign: "center", fontSize: 13, borderTop: "1px solid #1f2937" }}>
        © {new Date().getFullYear()} · {lp.footerText || "Alle Angaben ohne Gewähr · Datenschutz · Impressum"}
      </footer>

    </main>
  );
}
