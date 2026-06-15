"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch, authHeaders } from "@/lib/api";
import {
  Trash2, Mail, Phone, Tag, User, Sparkles, Play,
  AlertTriangle, PenLine, Link2, Copy, Building2, Zap,
  Lightbulb, Search,
} from "lucide-react";

const PIPELINE = ["neu", "kontaktiert", "angebot", "gewonnen", "verloren"];
const PIPELINE_COLOR = {
  neu:         "#cbd5e1",   // sehr hell — Ausgangszustand
  kontaktiert: "#94a3b8",   // hellgrau
  angebot:     "#64748b",   // mittelgrau
  gewonnen:    "#1e293b",   // fast schwarz
  verloren:    "#C8322C",   // einzige Akzentfarbe — Verlust = Alarm
};
const SOURCES = ["google-maps", "landing-page", "webhook", "csv-import", "manuell"];

function ScoreBadge({ s }) {
  s = Number(s) || 0;
  const bg  = s >= 8 ? "#dcfce7" : s >= 6 ? "#fef9c3" : "#f3f4f6";
  const col = s >= 8 ? "#15803d" : s >= 6 ? "#854d0e" : "var(--text-tertiary)";
  return (
    <span style={{ background: bg, color: col, padding: "2px 8px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
      {s}
    </span>
  );
}

function PipelineBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const color = PIPELINE_COLOR[status] || "var(--text-secondary)";
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        {status || "neu"} ▾
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: 4, zIndex: 99, minWidth: 130, boxShadow: "0 8px 24px rgba(0,0,0,.10)" }}>
          {PIPELINE.map(p => (
            <div key={p} onClick={() => { onChange(p); setOpen(false); }}
              style={{ padding: "7px 10px", cursor: "pointer", borderRadius: 7, fontSize: 13, color: PIPELINE_COLOR[p], fontWeight: 600 }}>
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [leads,              setLeads]              = useState([]);
  const [clients,            setClients]            = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [filters,            setFilters]            = useState({ q: "", client: "", source: "", status: "" });
  const [expanded,           setExpanded]           = useState(null);
  const [noteVal,            setNoteVal]            = useState("");
  const [outreach,           setOutreach]           = useState({});
  const [generating,         setGenerating]         = useState(null);
  const [enriching,          setEnriching]          = useState(null);
  const [sequencing,         setSequencing]         = useState(null);
  const [linkedinMsg,        setLinkedinMsg]        = useState({});
  const [generatingLinkedin, setGeneratingLinkedin] = useState(null);
  const [clientForOutreach,  setClientForOutreach]  = useState(null);
  const [copied,             setCopied]             = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.client) params.set("client", filters.client);
    if (filters.source) params.set("source", filters.source);
    if (filters.status) params.set("status", filters.status);
    if (filters.q)      params.set("q", filters.q);
    const [lr, cr] = await Promise.all([
      apiFetch("/api/leads?" + params),
      apiFetch("/api/clients"),
    ]);
    setLeads(lr.data || []);
    setClients(cr.data || []);
    setClientForOutreach((cr.data || [])[0]?.id || null);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function updateLead(id, fields) {
    await fetch("/api/leads", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ id, ...fields }) });
    setLeads(ls => ls.map(l => l.id === id ? { ...l, ...fields } : l));
  }

  async function deleteLead(id) {
    if (!confirm("Lead wirklich löschen?")) return;
    await fetch("/api/leads?id=" + id, { method: "DELETE", headers: authHeaders() });
    setLeads(ls => ls.filter(l => l.id !== id));
  }

  async function enrichLead(lead) {
    setEnriching(lead.id);
    const r = await fetch("/api/enrich", { method: "POST", headers: authHeaders(), body: JSON.stringify({ lead_id: lead.id }) });
    const d = await r.json();
    if (d.ok) setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, enriched_data: d.enriched, score: d.enriched.score_suggestion || l.score } : l));
    setEnriching(null);
  }

  async function startSequence(lead) {
    setSequencing(lead.id);
    const r = await fetch("/api/sequence", { method: "POST", headers: authHeaders(), body: JSON.stringify({ lead_id: lead.id }) });
    const d = await r.json();
    if (d.ok) setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, sequence: d.steps, sequence_started_at: new Date().toISOString() } : l));
    setSequencing(null);
  }

  async function updateStep(lead, stepId, status) {
    const r = await fetch("/api/sequence", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ lead_id: lead.id, step_id: stepId, status }) });
    const d = await r.json();
    if (d.ok) setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, sequence: d.steps } : l));
  }

  async function genLinkedin(lead) {
    setGeneratingLinkedin(lead.id);
    const r = await fetch("/api/linkedin-msg", { method: "POST", headers: authHeaders(), body: JSON.stringify({ lead_id: lead.id, client_id: clientForOutreach }) });
    const d = await r.json();
    if (d.ok) setLinkedinMsg(m => ({ ...m, [lead.id]: d }));
    setGeneratingLinkedin(null);
  }

  async function genOutreach(lead) {
    if (!clientForOutreach) { alert("Bitte zuerst einen Kunden unter /kunden anlegen."); return; }
    setGenerating(lead.id);
    const d = await apiFetch("/api/outreach", { method: "POST", body: JSON.stringify({ lead_id: lead.id, client_id: clientForOutreach }) });
    if (d.text) setOutreach(o => ({ ...o, [lead.id]: d.text }));
    setGenerating(null);
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const stats = {
    total:   leads.length,
    neu:     leads.filter(l => l.pipeline_status === "neu").length,
    gewonnen:leads.filter(l => l.pipeline_status === "gewonnen").length,
    score:   leads.length ? (leads.reduce((s, l) => s + (Number(l.score) || 0), 0) / leads.length).toFixed(1) : 0,
  };

  const inp = {
    padding: "9px 13px", border: "1px solid var(--border)", borderRadius: 8,
    fontSize: 13, color: "var(--ink)", background: "#fff", fontFamily: "inherit",
  };

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0 }}>
            Lead-Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 3 }}>Alle Leads aus allen Quellen</p>
        </div>

        {/* KPI-Karten */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Gesamt",   val: stats.total,    sub: "Leads" },
            { label: "Neu",      val: stats.neu,      sub: "Unbearbeitet" },
            { label: "Gewonnen", val: stats.gewonnen, sub: "Abschlüsse" },
            { label: "Ø Score",  val: stats.score,    sub: "Durchschnitt" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: "var(--ink)", lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".06em" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter-Leiste */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 180px" }}>
            <Search size={14} strokeWidth={1.5} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
            <input placeholder="Firma suchen…" value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
              style={{ ...inp, width: "100%", paddingLeft: 32, boxSizing: "border-box" }} />
          </div>
          <select value={filters.client} onChange={e => setFilters(f => ({ ...f, client: e.target.value }))} style={inp}>
            <option value="">Alle Kunden</option>
            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))} style={inp}>
            <option value="">Alle Quellen</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={inp}>
            <option value="">Alle Status</option>
            {PIPELINE.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => setFilters({ q: "", client: "", source: "", status: "" })}
            style={{ padding: "9px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "var(--text-secondary)" }}>
            Zurücksetzen
          </button>
        </div>

        {/* Lead-Tabelle */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Lade…</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Keine Leads gefunden.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Firma", "Ort", "Quelle", "Produkt", "Score", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <>
                    <tr key={l.id} style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }}
                      onClick={() => { setExpanded(expanded === l.id ? null : l.id); setNoteVal(l.notes || ""); }}>
                      <td style={{ padding: "12px 14px", fontWeight: 500, fontSize: 14, color: "var(--ink)" }}>
                        {l.company_name}
                        {l.website && (
                          <a href={l.website} target="_blank" onClick={e => e.stopPropagation()}
                            style={{ marginLeft: 6, color: "var(--text-tertiary)", fontSize: 11, textDecoration: "none" }}>↗</a>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{l.city || "–"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12 }}>
                        <span style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 99, color: "var(--text-secondary)" }}>{l.source || "–"}</span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{l.product || "–"}</td>
                      <td style={{ padding: "12px 14px" }}><ScoreBadge s={l.score} /></td>
                      <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                        <PipelineBadge status={l.pipeline_status} onChange={v => updateLead(l.id, { pipeline_status: v })} />
                      </td>
                      <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteLead(l.id)}
                          style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <Trash2 size={15} strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>

                    {/* Erweiterte Zeile */}
                    {expanded === l.id && (
                      <tr key={l.id + "_exp"}>
                        <td colSpan={7} style={{ background: "var(--bg)", padding: "20px 24px", borderTop: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

                            {/* Details */}
                            <div style={{ flex: "1 1 190px" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)", marginBottom: 10 }}>Details</div>
                              {l.email    && <div style={{ fontSize: 13, marginBottom: 5, display: "flex", alignItems: "center", gap: 6, color: "var(--ink)" }}><Mail    size={13} strokeWidth={1.5} color="var(--text-tertiary)" />{l.email}</div>}
                              {l.phone    && <div style={{ fontSize: 13, marginBottom: 5, display: "flex", alignItems: "center", gap: 6, color: "var(--ink)" }}><Phone   size={13} strokeWidth={1.5} color="var(--text-tertiary)" />{l.phone}</div>}
                              {l.industry && <div style={{ fontSize: 13, marginBottom: 5, display: "flex", alignItems: "center", gap: 6, color: "var(--ink)" }}><Tag     size={13} strokeWidth={1.5} color="var(--text-tertiary)" />{l.industry}</div>}
                              {l.client   && <div style={{ fontSize: 13, marginBottom: 5, display: "flex", alignItems: "center", gap: 6, color: "var(--ink)" }}><User    size={13} strokeWidth={1.5} color="var(--text-tertiary)" />{l.client}</div>}

                              {/* KI-Analyse */}
                              <div style={{ marginTop: 14 }}>
                                <button onClick={() => enrichLead(l)} disabled={enriching === l.id}
                                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "#fff", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: enriching === l.id ? "not-allowed" : "pointer", opacity: enriching === l.id ? .5 : 1 }}>
                                  <Sparkles size={13} strokeWidth={1.5} />
                                  {enriching === l.id ? "Analysiert…" : "KI-Analyse"}
                                </button>
                              </div>
                              {l.enriched_data?.main_offering && (
                                <div style={{ marginTop: 10, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>KI-Einschätzung</div>
                                  <div style={{ fontSize: 12, color: "var(--ink)", marginBottom: 5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                                    <Building2 size={12} strokeWidth={1.5} color="var(--text-tertiary)" style={{ marginTop: 1, flexShrink: 0 }} />
                                    {l.enriched_data.main_offering}
                                  </div>
                                  {l.enriched_data.pain_points && (
                                    <div style={{ fontSize: 12, color: "var(--ink)", marginBottom: 5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                                      <Zap size={12} strokeWidth={1.5} color="var(--text-tertiary)" style={{ marginTop: 1, flexShrink: 0 }} />
                                      {l.enriched_data.pain_points}
                                    </div>
                                  )}
                                  {l.enriched_data.outreach_angle && (
                                    <div style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500, display: "flex", alignItems: "flex-start", gap: 6 }}>
                                      <Lightbulb size={12} strokeWidth={1.5} color="var(--text-tertiary)" style={{ marginTop: 1, flexShrink: 0 }} />
                                      {l.enriched_data.outreach_angle}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Notizen */}
                            <div style={{ flex: "1 1 200px" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)", marginBottom: 10 }}>Notizen</div>
                              <textarea value={noteVal} onChange={e => setNoteVal(e.target.value)} rows={4}
                                style={{ width: "100%", padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", color: "var(--ink)", background: "#fff" }} />
                              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                                <button onClick={() => updateLead(l.id, { notes: noteVal })}
                                  style={{ padding: "7px 14px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer" }}>
                                  Speichern
                                </button>
                                <input type="date" defaultValue={l.follow_up_date || ""} onChange={e => updateLead(l.id, { follow_up_date: e.target.value })}
                                  style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 7, fontSize: 12, color: "var(--ink)" }} />
                              </div>
                            </div>

                            {/* Follow-up Sequenz */}
                            <div style={{ flex: "1 1 200px" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)", marginBottom: 10 }}>Follow-up Sequenz</div>
                              {!(l.sequence?.length > 0) ? (
                                <div>
                                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.6 }}>
                                    Automatischer Plan: E-Mail → LinkedIn (Tag 3) → Follow-up (Tag 7) → Ads (Tag 14)
                                  </div>
                                  <button onClick={() => startSequence(l)} disabled={sequencing === l.id}
                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: sequencing === l.id ? "not-allowed" : "pointer", opacity: sequencing === l.id ? .5 : 1 }}>
                                    <Play size={13} strokeWidth={1.5} />
                                    {sequencing === l.id ? "Startet…" : "Sequenz starten"}
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  {l.sequence.map(step => {
                                    const done     = step.status === "done";
                                    const skipped  = step.status === "skipped";
                                    const startedAt= l.sequence_started_at ? new Date(l.sequence_started_at) : null;
                                    const dueDate  = startedAt ? new Date(startedAt.getTime() + step.day * 86400000) : null;
                                    const overdue  = dueDate && !done && new Date() > dueDate;
                                    return (
                                      <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                                        <div onClick={() => updateStep(l, step.id, done ? "pending" : "done")}
                                          style={{ width: 17, height: 17, borderRadius: 4, border: `2px solid ${done ? "#059669" : overdue ? "var(--accent)" : "var(--border)"}`, background: done ? "#059669" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                                          {done && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <span style={{ fontSize: 12, color: done ? "var(--text-tertiary)" : "var(--ink)", fontWeight: done ? 400 : 500, textDecoration: done ? "line-through" : "none" }}>
                                            {step.label}
                                          </span>
                                          {dueDate && !done && (
                                            <div style={{ fontSize: 11, color: overdue ? "var(--accent)" : "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 3 }}>
                                              {overdue && <AlertTriangle size={10} strokeWidth={1.5} />}
                                              {overdue ? "überfällig" : `Tag ${step.day}`}
                                            </div>
                                          )}
                                        </div>
                                        {!done && !skipped && (
                                          <button onClick={() => updateStep(l, step.id, "skipped")}
                                            style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 11 }}>skip</button>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>
                                    {l.sequence.filter(s => s.status === "done").length}/{l.sequence.length} erledigt
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* E-Mail + LinkedIn */}
                            <div style={{ flex: "1 1 240px" }}>
                              {/* E-Mail */}
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)", marginBottom: 10 }}>
                                <Mail size={12} strokeWidth={1.5} /> E-Mail Anschreiben
                              </div>
                              {(outreach[l.id] || l.outreach_text) && (
                                <textarea readOnly value={outreach[l.id] || l.outreach_text} rows={4}
                                  style={{ width: "100%", padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", background: "#fff", color: "var(--ink)", marginBottom: 6 }} />
                              )}
                              <button onClick={() => genOutreach(l)} disabled={generating === l.id}
                                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", opacity: generating === l.id ? .5 : 1 }}>
                                <PenLine size={13} strokeWidth={1.5} />
                                {generating === l.id ? "Wird erstellt…" : "E-Mail generieren"}
                              </button>

                              {/* LinkedIn */}
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)", margin: "18px 0 10px" }}>
                                <Link2 size={12} strokeWidth={1.5} /> LinkedIn-Nachricht
                              </div>
                              {(() => {
                                const lm = linkedinMsg[l.id] || l.linkedin_msg;
                                return lm?.connection_request ? (
                                  <div>
                                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, marginBottom: 5 }}>
                                      1. Vernetzungsanfrage ({lm.connection_request.length}/250 Zeichen)
                                    </div>
                                    <textarea readOnly value={lm.connection_request} rows={3}
                                      style={{ width: "100%", padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", background: "#fff", color: "var(--ink)" }} />
                                    <button onClick={() => copyText(lm.connection_request, l.id + "_cr")}
                                      style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, cursor: "pointer", color: "var(--ink)" }}>
                                      <Copy size={11} strokeWidth={1.5} />
                                      {copied === l.id + "_cr" ? "Kopiert!" : "Kopieren"}
                                    </button>

                                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, margin: "10px 0 5px" }}>2. Follow-up nach Vernetzung</div>
                                    <textarea readOnly value={lm.followup_message} rows={4}
                                      style={{ width: "100%", padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", background: "#fff", color: "var(--ink)" }} />
                                    <button onClick={() => copyText(lm.followup_message, l.id + "_fu")}
                                      style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, cursor: "pointer", color: "var(--ink)" }}>
                                      <Copy size={11} strokeWidth={1.5} />
                                      {copied === l.id + "_fu" ? "Kopiert!" : "Kopieren"}
                                    </button>

                                    {lm.search_tip && (
                                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 5, alignItems: "flex-start" }}>
                                        <Lightbulb size={12} strokeWidth={1.5} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 1 }} />
                                        {lm.search_tip}
                                      </div>
                                    )}
                                  </div>
                                ) : null;
                              })()}
                              <button onClick={() => genLinkedin(l)} disabled={generatingLinkedin === l.id}
                                style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", color: "var(--ink)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 500, opacity: generatingLinkedin === l.id ? .5 : 1 }}>
                                <Link2 size={13} strokeWidth={1.5} />
                                {generatingLinkedin === l.id ? "Wird erstellt…" : "LinkedIn-Nachricht generieren"}
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
