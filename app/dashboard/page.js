"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";

const PIPELINE = ["neu", "kontaktiert", "angebot", "gewonnen", "verloren"];
const PIPELINE_COLOR = { neu: "#6366f1", kontaktiert: "#f59e0b", angebot: "#0ea5e9", gewonnen: "#22c55e", verloren: "#ef4444" };
const SOURCES = ["google-maps", "landing-page", "webhook", "csv-import", "manuell"];

function pw() { return typeof window !== "undefined" ? localStorage.getItem("lf_auth_pw") || "" : ""; }

function ScoreBadge({ s }) {
  s = Number(s) || 0;
  const c = s >= 8 ? "#dcfce7,#15803d" : s >= 6 ? "#fef9c3,#854d0e" : "#fee2e2,#991b1b";
  const [bg, col] = c.split(",");
  return <span style={{ background: bg, color: col, padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{s}</span>;
}

function PipelineBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const color = PIPELINE_COLOR[status] || "#6b7280";
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: color + "22", color, border: "none", borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        {status || "neu"} ▾
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 6, zIndex: 99, minWidth: 130, boxShadow: "0 4px 20px rgba(0,0,0,.12)" }}>
          {PIPELINE.map(p => (
            <div key={p} onClick={() => { onChange(p); setOpen(false); }}
              style={{ padding: "7px 10px", cursor: "pointer", borderRadius: 7, fontSize: 13, color: PIPELINE_COLOR[p], fontWeight: 600, background: status === p ? "#f5f5f5" : "transparent" }}>
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: "", client: "", source: "", status: "" });
  const [expanded, setExpanded] = useState(null);
  const [noteVal, setNoteVal] = useState("");
  const [outreach, setOutreach] = useState({});
  const [generating, setGenerating] = useState(null);

  const h = { "x-pw": localStorage.getItem("lf_auth_pw") || "" };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.client) params.set("client", filters.client);
    if (filters.source) params.set("source", filters.source);
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    const [lr, cr] = await Promise.all([
      fetch("/api/leads?" + params, { headers: h }).then(r => r.json()),
      fetch("/api/clients", { headers: h }).then(r => r.json()),
    ]);
    setLeads(lr.data || []);
    setClients(cr.data || []);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function updateLead(id, fields) {
    await fetch("/api/leads", { method: "PATCH", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ id, ...fields }) });
    setLeads(ls => ls.map(l => l.id === id ? { ...l, ...fields } : l));
  }

  async function deleteLead(id) {
    if (!confirm("Lead wirklich löschen?")) return;
    await fetch("/api/leads?id=" + id, { method: "DELETE", headers: h });
    setLeads(ls => ls.filter(l => l.id !== id));
  }

  async function genOutreach(lead) {
    setGenerating(lead.id);
    const r = await fetch("/api/outreach", {
      method: "POST", headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: lead.id, client_id: clients[0]?.id }),
    });
    const d = await r.json();
    if (d.text) { setOutreach(o => ({ ...o, [lead.id]: d.text })); }
    setGenerating(null);
  }

  const stats = {
    total: leads.length,
    neu: leads.filter(l => l.pipeline_status === "neu").length,
    gewonnen: leads.filter(l => l.pipeline_status === "gewonnen").length,
    score: leads.length ? (leads.reduce((s, l) => s + (Number(l.score) || 0), 0) / leads.length).toFixed(1) : 0,
  };

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>📊 Lead-Dashboard</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>Alle Leads aus allen Quellen</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Gesamt", val: stats.total, color: "#6366f1" },
            { label: "Neu", val: stats.neu, color: "#f59e0b" },
            { label: "Gewonnen", val: stats.gewonnen, color: "#22c55e" },
            { label: "Ø Score", val: stats.score, color: "#0ea5e9" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 22px", flex: "1 1 120px", boxShadow: "0 1px 8px rgba(0,0,0,.06)", borderLeft: "4px solid " + s.color }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 20, boxShadow: "0 1px 8px rgba(0,0,0,.06)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="🔍 Suche Firma…" value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            style={{ padding: "9px 13px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, minWidth: 200 }} />
          <select value={filters.client} onChange={e => setFilters(f => ({ ...f, client: e.target.value }))}
            style={{ padding: "9px 13px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14 }}>
            <option value="">Alle Kunden</option>
            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}
            style={{ padding: "9px 13px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14 }}>
            <option value="">Alle Quellen</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{ padding: "9px 13px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14 }}>
            <option value="">Alle Status</option>
            {PIPELINE.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => setFilters({ q: "", client: "", source: "", status: "" })}
            style={{ padding: "9px 14px", background: "#f3f4f6", border: "none", borderRadius: 9, fontSize: 13, cursor: "pointer", color: "#6b7280" }}>
            Zurücksetzen
          </button>
        </div>

        {/* Tabelle */}
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 8px rgba(0,0,0,.06)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Lade…</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Keine Leads gefunden.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Firma", "Ort", "Quelle", "Produkt", "Score", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: .4 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <>
                    <tr key={l.id} style={{ borderTop: "1px solid #f3f4f6", cursor: "pointer" }} onClick={() => { setExpanded(expanded === l.id ? null : l.id); setNoteVal(l.notes || ""); }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, fontSize: 14 }}>
                        {l.company_name}
                        {l.website && <a href={l.website} target="_blank" onClick={e => e.stopPropagation()} style={{ marginLeft: 6, color: "#6366f1", fontSize: 11 }}>↗</a>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{l.city || "–"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12 }}>
                        <span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 999, color: "#374151" }}>{l.source || "–"}</span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{l.product || "–"}</td>
                      <td style={{ padding: "12px 14px" }}><ScoreBadge s={l.score} /></td>
                      <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                        <PipelineBadge status={l.pipeline_status} onChange={v => updateLead(l.id, { pipeline_status: v })} />
                      </td>
                      <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteLead(l.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>🗑</button>
                      </td>
                    </tr>
                    {expanded === l.id && (
                      <tr key={l.id + "_exp"}>
                        <td colSpan={7} style={{ background: "#f9fafb", padding: "16px 20px", borderTop: "1px solid #f3f4f6" }}>
                          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                            {/* Details */}
                            <div style={{ flex: "1 1 200px" }}>
                              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, marginBottom: 8 }}>DETAILS</div>
                              {l.email && <div style={{ fontSize: 13, marginBottom: 4 }}>📧 {l.email}</div>}
                              {l.phone && <div style={{ fontSize: 13, marginBottom: 4 }}>📞 {l.phone}</div>}
                              {l.industry && <div style={{ fontSize: 13, marginBottom: 4 }}>🏷 {l.industry}</div>}
                              {l.client && <div style={{ fontSize: 13, marginBottom: 4 }}>👤 Kunde: {l.client}</div>}
                              {l.source_detail && <div style={{ fontSize: 13, color: "#6b7280" }}>Quelle: {l.source_detail}</div>}
                            </div>
                            {/* Notizen */}
                            <div style={{ flex: "1 1 220px" }}>
                              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, marginBottom: 8 }}>NOTIZEN</div>
                              <textarea value={noteVal} onChange={e => setNoteVal(e.target.value)} rows={3}
                                style={{ width: "100%", padding: "9px 11px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <button onClick={() => updateLead(l.id, { notes: noteVal })}
                                  style={{ padding: "7px 14px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                                  Speichern
                                </button>
                                <input type="date" defaultValue={l.follow_up_date || ""} onChange={e => updateLead(l.id, { follow_up_date: e.target.value })}
                                  style={{ padding: "7px 11px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }} />
                              </div>
                            </div>
                            {/* KI-Anschreiben */}
                            <div style={{ flex: "1 1 260px" }}>
                              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, marginBottom: 8 }}>KI-ANSCHREIBEN</div>
                              {outreach[l.id] || l.outreach_text ? (
                                <textarea readOnly value={outreach[l.id] || l.outreach_text} rows={5}
                                  style={{ width: "100%", padding: "9px 11px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", background: "#fff" }} />
                              ) : null}
                              <button onClick={() => genOutreach(l)} disabled={generating === l.id}
                                style={{ marginTop: 8, padding: "7px 14px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                                {generating === l.id ? "⏳ Wird erstellt…" : "✍️ Anschreiben generieren"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
