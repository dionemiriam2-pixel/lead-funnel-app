"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { TrendingUp, Award, BarChart3 } from "lucide-react";

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

  // --- Report-Kennzahlen ---
  const won  = leads.filter(l => l.pipeline_status === "gewonnen").length;
  const lost = leads.filter(l => l.pipeline_status === "verloren").length;
  const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0;

  // --- Neue Leads pro Monat (letzte 6 Monate) ---
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("de-DE", { month: "short" }), count: 0 });
  }
  leads.forEach(l => {
    if (!l.created_at) return;
    const d = new Date(l.created_at);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const m = months.find(x => x.key === key);
    if (m) m.count++;
  });
  const maxMonth = Math.max(...months.map(m => m.count), 1);

  // --- Funnel (Pipeline-Verteilung) ---
  const funnel = [
    { s: "neu", v: byStatus["neu"] || 0 },
    { s: "kontaktiert", v: byStatus["kontaktiert"] || 0 },
    { s: "angebot", v: byStatus["angebot"] || 0 },
    { s: "gewonnen", v: byStatus["gewonnen"] || 0 },
  ];

  const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 22 };

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <TrendingUp size={20} strokeWidth={1.5} color="var(--text-secondary)" />
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0 }}>Reports</h1>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24 }}>Conversion, Verlauf und Auswertung deiner Leads</p>

        {loading ? <div style={{ color: "var(--text-tertiary)" }}>Lade…</div> : (
          <>
            {/* KPI-Zeile */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { label: "Leads gesamt", val: leads.length },
                { label: "Conversion",   val: conversion + "%" },
                { label: "Gewonnen",     val: won },
                { label: "Verloren",     val: lost },
                { label: "Ø Score",      val: avgScore },
              ].map(s => (
                <div key={s.label} style={{ ...card, flex: "1 1 120px", padding: "18px 20px" }}>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 32, fontWeight: 500, color: "var(--ink)", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Neue Leads pro Monat */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <BarChart3 size={16} strokeWidth={1.5} color="var(--text-secondary)" />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0 }}>Neue Leads pro Monat</h2>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 170 }}>
                {months.map(m => (
                  <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{m.count}</div>
                    <div style={{ width: "55%", maxWidth: 46, height: Math.round((m.count / maxMonth) * 120) + "px", minHeight: m.count > 0 ? 6 : 2, background: m.count > 0 ? "var(--accent)" : "var(--border)", borderRadius: "6px 6px 0 0", transition: "height .5s ease" }} />
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funnel */}
            <div style={{ ...card, marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Verkaufs-Funnel</h2>
              {funnel.map((f, i) => {
                const pct = leads.length ? Math.round((f.v / leads.length) * 100) : 0;
                return (
                  <div key={f.s} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "var(--ink)", fontWeight: 500, textTransform: "capitalize" }}>{f.s}</span>
                      <span style={{ color: "var(--text-secondary)" }}>{f.v} ({pct}%)</span>
                    </div>
                    <div style={{ height: 14, background: "var(--border)", borderRadius: 6 }}>
                      <div style={{ height: 14, width: pct + "%", background: f.s === "gewonnen" ? "var(--accent)" : "var(--ink)", borderRadius: 6, opacity: 1 - i * 0.15, transition: "width .5s ease" }} />
                    </div>
                  </div>
                );
              })}
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
