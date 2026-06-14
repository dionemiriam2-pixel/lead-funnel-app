"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

function Bar({ label, val, max, color }) {
  const pct = max > 0 ? Math.round((val / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
        <span style={{ color: "#374151", fontWeight: 600 }}>{label}</span>
        <span style={{ color: "#6b7280" }}>{val}</span>
      </div>
      <div style={{ height: 10, background: "#f3f4f6", borderRadius: 999 }}>
        <div style={{ height: 10, width: pct + "%", background: color || "#6366f1", borderRadius: 999, transition: "width .5s ease" }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const h = { "x-pw": localStorage.getItem("lf_auth_pw") || "" };

  useEffect(() => {
    fetch("/api/leads", { headers: h }).then(r => r.json()).then(d => {
      setLeads(d.data || []);
      setLoading(false);
    });
  }, []);

  function groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const k = item[key] || "Unbekannt";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }

  const bySource = groupBy(leads, "source");
  const byClient = groupBy(leads, "client");
  const byProduct = groupBy(leads, "product");
  const byStatus = groupBy(leads, "pipeline_status");
  const maxSource = Math.max(...Object.values(bySource), 1);
  const maxClient = Math.max(...Object.values(byClient), 1);
  const maxProduct = Math.max(...Object.values(byProduct), 1);

  const avgScore = leads.length ? (leads.reduce((s, l) => s + (Number(l.score) || 0), 0) / leads.length).toFixed(1) : 0;
  const topLeads = [...leads].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);

  const sourceColors = { "google-maps": "#22c55e", "landing-page": "#6366f1", "webhook": "#f59e0b", "csv-import": "#0ea5e9", "manuell": "#ec4899" };

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", margin: "0 0 4px" }}>📈 Analytics</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Auswertung aller Lead-Quellen und Produkte</p>

        {loading ? <div style={{ color: "#6b7280" }}>Lade…</div> : (
          <>
            {/* KPIs */}
            <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
              {[
                { label: "Leads gesamt", val: leads.length, color: "#6366f1" },
                { label: "Ø Score", val: avgScore, color: "#f59e0b" },
                { label: "Gewonnen", val: leads.filter(l => l.pipeline_status === "gewonnen").length, color: "#22c55e" },
                { label: "Top-Leads (≥8)", val: leads.filter(l => l.score >= 8).length, color: "#0ea5e9" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 24px", flex: "1 1 130px", boxShadow: "0 1px 8px rgba(0,0,0,.06)", borderTop: "4px solid " + s.color }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              {/* Quellen */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#1a1a2e" }}>Leads nach Quelle</h2>
                {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <Bar key={k} label={k} val={v} max={maxSource} color={sourceColors[k] || "#6366f1"} />
                ))}
              </div>

              {/* Pipeline */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#1a1a2e" }}>Pipeline-Status</h2>
                {[["neu", "#6366f1"], ["kontaktiert", "#f59e0b"], ["angebot", "#0ea5e9"], ["gewonnen", "#22c55e"], ["verloren", "#ef4444"]].map(([s, c]) => (
                  <Bar key={s} label={s} val={byStatus[s] || 0} max={leads.length} color={c} />
                ))}
              </div>

              {/* Kunden */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#1a1a2e" }}>Leads nach Kunde</h2>
                {Object.entries(byClient).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <Bar key={k} label={k} val={v} max={maxClient} color="#0ea5e9" />
                ))}
              </div>

              {/* Produkte */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#1a1a2e" }}>Leads nach Produkt</h2>
                {Object.entries(byProduct).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <Bar key={k} label={k} val={v} max={maxProduct} color="#ec4899" />
                ))}
              </div>
            </div>

            {/* Top Leads */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1a1a2e" }}>🏆 Top 5 Leads nach Score</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Firma", "Ort", "Quelle", "Produkt", "Score"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topLeads.map(l => (
                    <tr key={l.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "11px 14px", fontWeight: 600, fontSize: 14 }}>{l.company_name}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#6b7280" }}>{l.city || "–"}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12 }}><span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 999 }}>{l.source || "–"}</span></td>
                      <td style={{ padding: "11px 14px", fontSize: 13 }}>{l.product || "–"}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ background: l.score >= 8 ? "#dcfce7" : "#fef9c3", color: l.score >= 8 ? "#15803d" : "#854d0e", padding: "3px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{l.score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
