import LeadForm from "./LeadForm";

export default function LandingPage({ lp }) {
  return (
    <main>
      <section style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb 55%,#0ea5e9)", color: "#fff", padding: "56px 20px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 320px", minWidth: 280 }}>
            {lp.badge && (
              <span style={{ display: "inline-block", background: "rgba(255,255,255,.18)", padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 18 }}>{lp.badge}</span>
            )}
            <h1 style={{ fontSize: 36, lineHeight: 1.15, marginBottom: 16 }}>{lp.headline}</h1>
            <p style={{ fontSize: 18, opacity: 0.95, marginBottom: 24 }}>{lp.subline}</p>
            <ul style={{ listStyle: "none" }}>
              {(lp.bullets || []).map((b, i) => (
                <li key={i} style={{ padding: "8px 0 8px 28px", position: "relative", fontSize: 16 }}>
                  <span style={{ position: "absolute", left: 0, color: "#bbf7d0", fontWeight: 800 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ flex: "0 1 340px", minWidth: 280, background: "#fff", color: "#111827", borderRadius: 16, padding: 28, boxShadow: "0 12px 40px rgba(0,0,0,.18)" }}>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>{lp.formTitle || "Jetzt eintragen"}</h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 18 }}>{lp.formSub || ""}</p>
            <LeadForm lp={lp} />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "32px 20px", textAlign: "center", color: "#374151" }}>
        ★★★★★ „Hat uns bei der Eröffnung enorm geholfen." · Über 50 begleitete Projekte
      </section>
    </main>
  );
}
