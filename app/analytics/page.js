"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { TrendingUp, Award } from "lucide-react";

function Bar({ label, val, max, accent }) {
  const pct = max > 0 ? Math.round((val / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--text-secondary)" }}>{val}</span>
      </div>
      <div style={{ height: 8, background: "var(--border)", borderRadius: 999 }}>
        <div style={{ height: 8, width: pct + "%", background: accent ? "var(--accent)" : "var(--ink)", borderRadius: 999, transition: "width .5s ease" }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/leads").then(d => { setLeads(d.data || []); setLoading(false); });
  }, []);

  function groupBy(arr, key) {
    return arr.reduce((acc, item) => { const k = item[key] || "Unbekannt"; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  }

  const bySource  = groupBy(leads, "source");
  const byClient  = groupBy(leads, "client");
  const byProduct = groupBy(leads, "product");
  const byStatus  = groupBy(leads, "pipeline_status");
  const maxSource  = Math.max(...Object.values(bySource),  1);
  const maxClient  = Math.max(...Object.values(byClient),  1);
  const maxProduct = Math.max(...Object.values(byProduct), 1);
  const avgScore   = leads.length ? (leads.reduce((s, l) => s + (Number(l.score) || 0), 0) / leads.length).toFixed(1) : 0;
  const topLeads   = [...leads].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);

  const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 22 };

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <TrendingUp size={20} strokeWidth={1.5} color="var(--text-secondary)" />
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0 }}>Analytics</h1>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24 }}>Auswertung aller Lead-Quellen und Produkte</p>

        {loading ? <div style={{ color: "var(--text-tertiary)" }}>Lade…</div> : (
          <>
            {/* KPI-Zeile */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              {[
                { label: "Leads gesamt",  val: leads.length },
                { label: "Ø Score",       val: avgScore },
                { label: "Gewonnen",      val: leads.filter(l => l.pipeline_status === "gewonnen").length },
                { label: "Top-Leads ≥ 8", val: leads.filter(l => l.score >= 8).length },
              ].map(s => (
                <div key={s.label} style={{ ...card, flex: "1 1 130px", padding: "18px 20px" }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 500, color: "var(--ink)", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Leads nach Quelle</h2>
                {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => <Bar key={k} label={k} val={v} max={maxSource} />)}
              </div>
              <div style={card}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Pipeline-Status</h2>
                {[["neu",""],["kontaktiert",""],["angebot",""],["gewonnen",""],["verloren","accent"]].map(([s, a]) =>
                  <Bar key={s} label={s} val={byStatus[s] || 0} max={leads.length} accent={!!a} />
                )}
              </div>
              <div style={card}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Leads nach Kunde</h2>
                {Object.entries(byClient).sort((a, b) => b[1] - a[1]).map(([k, v]) => <Bar key={k} label={k} val={v} max={maxClient} />)}
              </div>
              <div style={card}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Leads nach Produkt</h2>
                {Object.entries(byProduct).sort((a, b) => b[1] - a[1]).map(([k, v]) => <Bar key={k} label={k} val={v} max={maxProduct} />)}
              </div>
            </div>

            {/* Top 5 */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Award size={16} strokeWidth={1.5} color="var(--text-secondary)" />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0 }}>Top 5 Leads nach Score</h2>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Firma", "Ort", "Quelle", "Produkt", "Score"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topLeads.map(l => (
                    <tr key={l.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 500, color: "var(--ink)" }}>{l.company_name}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-secondary)" }}>{l.city || "–"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12 }}>
                        <span style={{ background: "var(--border)", padding: "2px 8px", borderRadius: 999, color: "var(--text-secondary)" }}>{l.source || "–"}</span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-secondary)" }}>{l.product || "–"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: l.score >= 6 ? "var(--ink)" : "var(--border)", color: l.score >= 6 ? "#fff" : "var(--text-tertiary)", padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          {l.score}
                        </span>
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
