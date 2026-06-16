"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { apiFetch, authHeaders } from "@/lib/api";
import {
  MapPin, Globe, Link2, Mail, Target, MessageSquare,
  AlertCircle, Users, Zap, Map, Search, ChevronRight,
  Trash2, ExternalLink, Plus,
} from "lucide-react";

/* ─── Konstanten ─────────────────────────────────────────── */
const TABS = ["Leads", "Pipeline", "Kanäle", "Profil", "Marketing", "Landing Pages"];

const PIPELINE = [
  { key: "kalt",         label: "Kalt",         color: "var(--text-tertiary)",  bg: "var(--bg)" },
  { key: "kontaktiert",  label: "Kontaktiert",  color: "#6b7280",               bg: "var(--bg)" },
  { key: "qualifiziert", label: "Qualifiziert", color: "#4b5563",               bg: "var(--bg)" },
  { key: "angebot",      label: "Angebot",      color: "#1f2937",               bg: "var(--bg)" },
  { key: "gewonnen",     label: "Gewonnen",     color: "var(--ink)",            bg: "var(--bg)" },
  { key: "verloren",     label: "Verloren",     color: "var(--accent)",         bg: "var(--bg)" },
];

const KANALE = [
  { key: "google-maps",  Icon: MapPin,        label: "Google Maps",      desc: "Firmen-Scraping & Leads",    soon: false },
  { key: "landing-page", Icon: Globe,         label: "Landing Page",     desc: "Inbound Lead-Erfassung",     soon: false },
  { key: "linkedin",     Icon: Link2,         label: "LinkedIn",         desc: "Kontakte & Outreach",        soon: true  },
  { key: "email",        Icon: Mail,          label: "E-Mail Outreach",  desc: "Mails senden & Verlauf",     soon: false },
  { key: "ads",          Icon: Target,        label: "Werbeanzeigen",    desc: "Meta / Google Ads",          soon: true  },
  { key: "chat",         Icon: MessageSquare, label: "ManyChat / Chat",  desc: "Chat-Automatisierung",       soon: true  },
];

const SOURCES_DEF = [
  { key: "google-maps",  label: "Google Maps Bot",   desc: "Findet Firmen automatisch täglich" },
  { key: "linkedin",     label: "LinkedIn",           desc: "Sales Navigator, Suche, Gruppen" },
  { key: "facebook",     label: "Facebook / Instagram", desc: "Lead Ads, Gruppen, DMs" },
  { key: "google-ads",   label: "Google Ads",         desc: "Suchanzeigen, Display" },
  { key: "gelbe-seiten", label: "Gelbe Seiten",       desc: "Branchenverzeichnis" },
  { key: "csv",          label: "CSV / eigene Liste", desc: "Kontakte selbst hochladen" },
];

const OUTREACH_OPTS = {
  "google-maps":  [{ key:"ads",label:"Custom Audience Ads",desc:"Kontakte bei Meta/Google hochladen" },{ key:"email",label:"E-Mail (KI)",desc:"KI schreibt personalisiertes Angebot" },{ key:"phone",label:"Telefonakquise",desc:"Direkt anrufen — 100% legal im B2B" }],
  "linkedin":     [{ key:"dm",label:"LinkedIn DM",desc:"Persönliche Nachricht direkt auf LinkedIn" },{ key:"ads",label:"LinkedIn Ads",desc:"Gesponsorte Inhalte, InMail Ads" },{ key:"connect",label:"Vernetzung + Follow-up",desc:"Vernetzen, dann nach 3 Tagen anschreiben" }],
  "facebook":     [{ key:"ads",label:"Custom Audience Ads",desc:"Kontakte hochladen, Anzeigen ausspielen" },{ key:"lead-ads",label:"Lead Ads",desc:"Formular direkt in Facebook" },{ key:"dm",label:"Facebook / Instagram DM",desc:"Direktnachricht an die Firma" }],
  "google-ads":   [{ key:"ads",label:"Suchanzeigen",desc:"Erscheinen wenn jemand nach deiner Leistung sucht" },{ key:"display",label:"Display Ads",desc:"Banner auf Websites im Google Netzwerk" },{ key:"remarketing",label:"Remarketing",desc:"Kontakte erneut ansprechen" }],
  "gelbe-seiten": [{ key:"email",label:"E-Mail (KI)",desc:"KI schreibt personalisiertes Angebot" },{ key:"phone",label:"Telefonakquise",desc:"Direkt anrufen" },{ key:"ads",label:"Custom Audience Ads",desc:"Kontakte bei Meta hochladen" }],
  "csv":          [{ key:"email",label:"E-Mail (KI)",desc:"KI schreibt personalisiertes Angebot" },{ key:"ads",label:"Custom Audience Ads",desc:"Liste direkt bei Meta/Google hochladen" },{ key:"phone",label:"Telefonakquise",desc:"Liste durcharbeiten, anrufen" }],
};

/* ─── Styling-Shortcuts ──────────────────────────────────── */
const S = {
  card:      { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" },
  label:     { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 },
  input:     { width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--ink)", background: "var(--surface)", boxSizing: "border-box", fontFamily: "inherit" },
  btn:       { padding: "9px 20px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnSm:     { padding: "5px 12px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" },
  btnOutline:{ padding: "5px 12px", background: "transparent", color: "var(--ink)", border: "1px solid var(--border-strong)", borderRadius: 6, fontSize: 12, cursor: "pointer" },
  sectionHd: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", marginBottom: 10 },
};

/* ─── Hilfsfunktion: Pipeline-Status eines Leads ────────── */
function pStatus(lead) {
  const v = lead.pipeline_status || lead.status || "";
  if (!v || v === "new" || v === "neu") return "kalt";
  return v;
}

/* ═══════════════════════════════════════════════════════════ */
export default function KundeDetailPage() {
  const { id } = useParams();

  /* Daten */
  const [client,    setClient]    = useState(null);
  const [products,  setProducts]  = useState([]);
  const [leads,     setLeads]     = useState([]);

  /* UI */
  const [tab,          setTab]          = useState("Leads");
  const [form,         setForm]         = useState({});
  const [openChannel,  setOpenChannel]  = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortCol,      setSortCol]      = useState("score");
  const [sortDir,      setSortDir]      = useState("desc");
  const [msg,          setMsg]          = useState("");

  /* Produkte & Strategie */
  const [newProd,   setNewProd]   = useState({ name:"", description:"", target_groups:"", keywords:"", region:"", offer:"" });
  const [analysis,          setAnalysis]          = useState({});
  const [analysing,         setAnalysing]         = useState(null);
  const [stratStep,         setStratStep]         = useState(1);
  const [analysingWebsite,  setAnalysingWebsite]  = useState(false);
  const [websiteAnalysisErr,setWebsiteAnalysisErr]= useState("");
  const [landingPages,      setLandingPages]      = useState([]);
  const [generatingLP,      setGeneratingLP]      = useState(false);
  const [lpError,           setLpError]           = useState("");
  const [lpPreview,         setLpPreview]         = useState(null);

  /* ── Daten laden ─────────────────────────────────────── */
  async function load() {
    const [cr, pr, lr, lpRes] = await Promise.all([
      apiFetch("/api/clients"),
      apiFetch("/api/products?client_id=" + id),
      apiFetch("/api/leads"),
      apiFetch("/api/landing-pages?client_id=" + id),
    ]);
    setLandingPages(lpRes.data || []);
    const c = (cr.data || []).find(x => x.id === id);
    setClient(c || null);
    setForm(c || {});
    setProducts(pr.data || []);
    /* UUID-basierter Filter — exakt wie die alte App */
    setLeads((lr.data || []).filter(l => l.client_id === id));
  }

  useEffect(() => { if (id) load(); }, [id]);

  /* ── API-Handler ─────────────────────────────────────── */
  function flash(text) { setMsg(text); setTimeout(() => setMsg(""), 2500); }

  async function saveClient(extra = {}) {
    await fetch("/api/clients", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ id, ...form, ...extra }) });
    flash("✓ Gespeichert");
    await load();
  }

  async function activateChannel(key) {
    const updated = { ...(form.channels || {}), [key]: true };
    setForm(f => ({ ...f, channels: updated }));
    await apiFetch("/api/clients", { method: "PATCH", body: JSON.stringify({ id, channels: updated }) });
  }

  async function toggleChannel(key, val) {
    const updated = { ...(form.channels || {}), [key]: val };
    setForm(f => ({ ...f, channels: updated }));
    await apiFetch("/api/clients", { method: "PATCH", body: JSON.stringify({ id, channels: updated }) });
  }

  async function updateLeadStatus(leadId, newStatus) {
    await apiFetch("/api/leads", { method: "PATCH", body: JSON.stringify({ id: leadId, pipeline_status: newStatus }) });
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, pipeline_status: newStatus } : l));
  }

  async function addProduct() {
    if (!newProd.name.trim()) return;
    await fetch("/api/products", { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...newProd, client_id: id, region: newProd.region || client?.region }) });
    setNewProd({ name:"", description:"", target_groups:"", keywords:"", region:"", offer:"" });
    await load();
  }

  async function delProduct(pid) {
    if (!confirm("Produkt löschen?")) return;
    await fetch("/api/products?id=" + pid, { method: "DELETE", headers: authHeaders() });
    await load();
  }

  async function startAnalysis(prod) {
    setAnalysing(prod.id);
    const d = await apiFetch("/api/analyse", { method: "POST", body: JSON.stringify({ product_id: prod.id, client_id: id }) });
    setAnalysis(a => ({ ...a, [prod.id]: d }));
    setAnalysing(null);
  }

  async function analyseWebsite() {
    if (!form.website) { setWebsiteAnalysisErr("Bitte zuerst eine Website-URL speichern."); return; }
    setAnalysingWebsite(true);
    setWebsiteAnalysisErr("");
    try {
      const d = await apiFetch("/api/analyse", { method: "POST", body: JSON.stringify({ client_id: id }) });
      if (d.error) { setWebsiteAnalysisErr(d.error); return; }
      setForm(f => ({ ...f, target_audience: d.target_audience || f.target_audience, usp: d.usp || f.usp, keywords: d.keywords || f.keywords }));
      await load();
      flash("✓ Website analysiert");
    } catch {
      setWebsiteAnalysisErr("Netzwerkfehler — bitte nochmal versuchen.");
    } finally {
      setAnalysingWebsite(false);
    }
  }

  /* ── Lade-Zustand ────────────────────────────────────── */
  if (!client) return <AppShell><div style={{ padding: 40, color: "var(--text-secondary)" }}>Lade…</div></AppShell>;

  /* ── Berechnungen ─────────────────────────────────────── */
  const initial      = (client.name?.[0] || "K").toUpperCase();
  const unprocessed  = leads.filter(l => !l.pipeline_status || l.pipeline_status === "kalt" || l.pipeline_status === "new" || l.pipeline_status === "neu");
  const hot          = leads.filter(l => (l.score || 0) >= 6);
  const cities       = new Set(leads.map(l => l.city).filter(Boolean));

  const pipeCounts   = Object.fromEntries(PIPELINE.map(p => [p.key, 0]));
  leads.forEach(l => { const k = pStatus(l); if (k in pipeCounts) pipeCounts[k]++; });

  const sourceCounts = {};
  leads.forEach(l => { if (l.source) sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });

  /* gefilterte + sortierte Lead-Tabelle */
  let displayLeads = leads;
  if (sourceFilter) displayLeads = displayLeads.filter(l => l.source === sourceFilter);
  if (statusFilter) displayLeads = displayLeads.filter(l => pStatus(l) === statusFilter);
  displayLeads = [...displayLeads].sort((a, b) => {
    const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
    return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  /* Strategie */
  const strat            = form.strategy || {};
  const selSources       = strat.sources   || [];
  const selOutreach      = strat.outreach  || {};
  const stratDone        = selSources.length > 0 && selSources.every(s => (selOutreach[s] || []).length > 0);
  function toggleSrc(key)      { const n = selSources.includes(key) ? selSources.filter(s=>s!==key) : [...selSources,key]; setForm(f=>({...f,strategy:{...strat,sources:n}})); }
  function toggleOut(sk, ok)   { const c=selOutreach[sk]||[]; const n=c.includes(ok)?c.filter(o=>o!==ok):[...c,ok]; setForm(f=>({...f,strategy:{...strat,outreach:{...selOutreach,[sk]:n}}})); }

  /* ═══════════════════════════════════════════════════════ */
  return (
    <AppShell>
      <div style={{ padding: "22px 32px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <a href="/kunden" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Kunden</a>
          <ChevronRight size={13} strokeWidth={1.5} />
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{client.name}</span>
        </div>

        {/* Header-Card mit Tabs */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ minWidth: 130 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{client.name}</div>
            {client.region && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{client.region}</div>}
          </div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap", flex: 1 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "6px 13px", border: "none", borderRadius: 7, fontSize: 13, cursor: "pointer",
                background: tab === t ? "var(--ink)" : "transparent",
                color:      tab === t ? "#fff"       : "var(--text-secondary)",
                fontWeight: tab === t ? 500           : 400,
              }}>{t}</button>
            ))}
          </div>
          {msg && <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600 }}>{msg}</span>}
        </div>

        {/* ═══════════ LEADS ═══════════════════════════════ */}
        {tab === "Leads" && (
          <div>
            {/* Unbearbeitet-Banner */}
            {unprocessed.length > 0 && (
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--accent)", fontSize: 14, fontWeight: 500 }}>
                  <AlertCircle size={15} strokeWidth={1.5} />
                  {unprocessed.length} Lead{unprocessed.length !== 1 ? "s" : ""} warten auf Bearbeitung
                </div>
                <button onClick={() => { setStatusFilter("kalt"); }} style={{ fontSize: 12, padding: "5px 12px", border: "1px solid var(--accent)", borderRadius: 6, background: "transparent", color: "var(--accent)", cursor: "pointer" }}>
                  Jetzt bearbeiten →
                </button>
              </div>
            )}

            {/* KPI-Kacheln */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
              {[
                { Icon: Users,  top:"GESAMT",  sub:"LEADS",       val: leads.length,        hi: false },
                { Icon: Zap,    top:"HOT",     sub:"SCORE ≥ 6",   val: hot.length,          hi: hot.length > 0 },
                { Icon: Search, top:"NEU",     sub:"UNBEARBEITET",val: unprocessed.length,   hi: unprocessed.length > 0 },
                { Icon: Map,    top:"STÄDTE",  sub:"ORTE",        val: cities.size,          hi: false },
              ].map(({ Icon, top, sub, val, hi }) => (
                <div key={top} style={{ ...S.card, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Icon size={14} strokeWidth={1.5} color="var(--text-tertiary)" />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: hi && val > 0 ? "var(--accent)" : "var(--text-tertiary)" }}>{top}</span>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, marginBottom: 4, color: hi && val > 0 ? "var(--accent)" : "var(--ink)" }}>{val}</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)" }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Pipeline-Leiste */}
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={S.sectionHd}>Pipeline-Status</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {pipeCounts["gewonnen"]} gewonnen · {leads.length > 0 ? Math.round(pipeCounts["gewonnen"] / leads.length * 100) : 0}% Conversion
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 99, overflow: "hidden", display: "flex", background: "var(--border)", marginBottom: 10 }}>
                {PIPELINE.map(p => {
                  const pct = leads.length > 0 ? (pipeCounts[p.key] / leads.length) * 100 : 0;
                  return pct > 0 ? <div key={p.key} style={{ width: `${pct}%`, background: p.color }} /> : null;
                })}
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {PIPELINE.map(p => (
                  <span key={p.key} onClick={() => setStatusFilter(statusFilter === p.key ? null : p.key)}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: statusFilter === p.key ? "var(--ink)" : "var(--text-secondary)", cursor: "pointer", fontWeight: statusFilter === p.key ? 600 : 400 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
                    {p.label} <strong style={{ color: "var(--ink)" }}>{pipeCounts[p.key]}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Lead-Quellen */}
            {Object.keys(sourceCounts).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={S.sectionHd}>Lead-Quellen — Klick zum Filtern</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                  {Object.entries(sourceCounts).map(([src, cnt]) => (
                    <div key={src} onClick={() => setSourceFilter(sourceFilter === src ? null : src)}
                      style={{ ...S.card, padding: "12px 14px", cursor: "pointer", border: `1px solid ${sourceFilter === src ? "var(--ink)" : "var(--border)"}` }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", lineHeight: 1, marginBottom: 4 }}>{cnt}</div>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>{src}</div>
                      {sourceFilter === src && <div style={{ width: "100%", height: 2, background: "var(--accent)", borderRadius: 2, marginTop: 8 }} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lead-Tabelle */}
            {(sourceFilter || statusFilter) && (
              <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
                {sourceFilter && <button onClick={() => setSourceFilter(null)} style={{ ...S.btnOutline, fontSize: 12 }}>✕ Quelle: {sourceFilter}</button>}
                {statusFilter && <button onClick={() => setStatusFilter(null)} style={{ ...S.btnOutline, fontSize: 12 }}>✕ Status: {statusFilter}</button>}
              </div>
            )}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {displayLeads.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
                  {leads.length === 0 ? `Noch keine Leads für ${client.name}.` : "Keine Leads mit diesem Filter."}
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {[["company_name","Firma"],["city","Stadt"],["category","Kategorie"],["score","Score"],["pipeline_status","Status"]].map(([col,h]) => (
                        <th key={col} onClick={() => handleSort(col)}
                          style={{ padding: "9px 13px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: sortCol===col?"var(--ink)":"var(--text-tertiary)", cursor: "pointer", userSelect: "none" }}>
                          {h}{sortCol===col ? (sortDir==="asc"?" ↑":" ↓") : ""}
                        </th>
                      ))}
                      <th style={{ padding: "9px 13px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-tertiary)" }}>Telefon</th>
                      <th style={{ padding: "9px 13px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-tertiary)" }}>Website</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayLeads.map(l => {
                      const ps = PIPELINE.find(p => p.key === pStatus(l));
                      return (
                        <tr key={l.id} style={{ borderTop: "1px solid var(--border)" }}>
                          <td style={{ padding: "11px 13px", fontWeight: 500, fontSize: 14, color: "var(--ink)" }}>{l.company_name}</td>
                          <td style={{ padding: "11px 13px", fontSize: 13, color: "var(--text-secondary)" }}>{l.city || "–"}</td>
                          <td style={{ padding: "11px 13px", fontSize: 13, color: "var(--text-secondary)" }}>{l.category || "–"}</td>
                          <td style={{ padding: "11px 13px" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: l.score >= 6 ? "var(--ink)" : "var(--border)", color: l.score >= 6 ? "#fff" : "var(--text-tertiary)" }}>
                              {l.score ?? "–"}
                            </span>
                          </td>
                          <td style={{ padding: "11px 13px" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: ps?.bg || "#f3f4f6", color: ps?.color || "var(--text-secondary)" }}>
                              {ps?.label || pStatus(l)}
                            </span>
                          </td>
                          <td style={{ padding: "11px 13px", fontSize: 12, color: "var(--text-secondary)" }}>{l.phone || "–"}</td>
                          <td style={{ padding: "11px 13px", fontSize: 12 }}>
                            {l.website ? <a href={l.website} target="_blank" rel="noreferrer" style={{ color: "var(--ink)", display: "flex", alignItems: "center", gap: 4 }}><ExternalLink size={12} strokeWidth={1.5} /> Link</a> : "–"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ PIPELINE ════════════════════════════ */}
        {tab === "Pipeline" && (
          <div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
              {PIPELINE.map(col => {
                const colLeads = leads.filter(l => pStatus(l) === col.key);
                const others   = PIPELINE.filter(p => p.key !== col.key);
                return (
                  <div key={col.key} style={{ minWidth: 200, flex: "0 0 200px" }}>
                    {/* Spalten-Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: col.color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{col.label}</span>
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: "auto" }}>{colLeads.length}</span>
                    </div>
                    {/* Lead-Karten */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {colLeads.map(l => (
                        <div key={l.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginBottom: 3 }}>{l.company_name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>{l.city}{l.category ? ` · ${l.category}` : ""}</div>
                          {l.score != null && (
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 99, background: l.score >= 6 ? "var(--ink)" : "var(--border)", color: l.score >= 6 ? "#fff" : "var(--text-tertiary)", marginBottom: 8, display: "inline-block" }}>
                              Score {l.score}
                            </span>
                          )}
                          {/* Status-Wechsel */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                            {others.map(o => (
                              <button key={o.key} onClick={() => updateLeadStatus(l.id, o.key)}
                                style={{ fontSize: 10, padding: "3px 7px", border: "1px solid var(--border)", borderRadius: 5, background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>
                                → {o.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {colLeads.length === 0 && (
                        <div style={{ padding: "16px 12px", textAlign: "center", fontSize: 12, color: "var(--text-tertiary)", border: "1px dashed var(--border)", borderRadius: 10 }}>
                          Leer
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ KANÄLE ══════════════════════════════ */}
        {tab === "Kanäle" && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>Kanäle</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Kanal auswählen und direkt loslegen — <strong>{client.name}</strong>
              </p>
            </div>

            {/* Kacheln */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
              {KANALE.map(({ key, Icon, label, desc, soon }) => {
                const isOpen = openChannel === key;
                return (
                  <div key={key}
                    onClick={() => { if (!soon) setOpenChannel(isOpen ? null : key); }}
                    style={{
                      background: isOpen ? "var(--ink)" : "var(--surface)",
                      border: `1px solid ${isOpen ? "var(--ink)" : "var(--border)"}`,
                      borderRadius: 12, padding: "16px 18px",
                      opacity: soon ? .45 : 1,
                      cursor: soon ? "default" : "pointer",
                      transition: "all .15s",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <Icon size={20} strokeWidth={1.5} color={isOpen ? "#fff" : "var(--text-tertiary)"} />
                      {soon && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "var(--border)", color: "var(--text-tertiary)" }}>Bald</span>}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: isOpen ? "#fff" : "var(--ink)", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, color: isOpen ? "rgba(255,255,255,.65)" : "var(--text-secondary)", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Detail-Panel */}
            {openChannel && (
              <div style={{ ...S.card, padding: 24 }}>
                {/* Google Maps */}
                {openChannel === "google-maps" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <MapPin size={18} strokeWidth={1.5} color="var(--accent)" />
                      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Google Maps</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18 }}>Leads aus der globalen Toolbox zuweisen oder neue Suche starten</p>
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
                        <Search size={13} strokeWidth={1.5} /> Globale Google Maps Suche
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
                        Ergebnisse landen in der globalen Rohstoff-Datenbank — du wählst dann, welche Leads zu welchem Kunden gehören.
                      </p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input placeholder="Suchbegriff, z.B. Ladenbau Neueröffnung" style={{ ...S.input, flex: 2, minWidth: 180 }} />
                        <input placeholder="Ort, z.B. München" style={{ ...S.input, flex: 1, minWidth: 120 }} />
                        <input defaultValue="20" type="number" style={{ ...S.input, width: 70 }} />
                        <button style={S.btn}><Plus size={13} strokeWidth={2} style={{ display: "inline", marginRight: 4 }} />Hinzufügen</button>
                      </div>
                    </div>
                    <div style={S.sectionHd}>Globale Suchaufträge (0)</div>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>Noch keine Suchaufträge — oben starten.</div>
                  </div>
                )}

                {/* Landing Page */}
                {openChannel === "landing-page" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <Globe size={18} strokeWidth={1.5} color="var(--accent)" />
                      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Landing Page</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>URL der aktiven Landing Page für {client.name}</p>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <input
                        value={form.channels?.["lp-url"] || ""}
                        onChange={e => setForm(f => ({ ...f, channels: { ...(f.channels || {}), "lp-url": e.target.value } }))}
                        placeholder="https://deinedomain.de/landingpage"
                        style={{ ...S.input, flex: 1 }}
                      />
                      <button onClick={() => { const updated = { ...(form.channels || {}) }; apiFetch("/api/clients", { method: "PATCH", body: JSON.stringify({ id, channels: updated }) }).then(() => flash("✓ URL gespeichert")); }}
                        style={S.btn}>Speichern</button>
                    </div>
                    {form.channels?.["lp-url"] && (
                      <a href={form.channels["lp-url"]} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--ink)" }}>
                        <ExternalLink size={13} strokeWidth={1.5} /> Landing Page öffnen
                      </a>
                    )}
                  </div>
                )}

                {/* E-Mail */}
                {openChannel === "email" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <Mail size={18} strokeWidth={1.5} color="var(--accent)" />
                      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>E-Mail Outreach</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                      KI schreibt personalisierte E-Mails für Leads von {client.name}
                    </p>
                    <a href="/outreach" style={{ ...S.btn, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                      Zur Outreach-Seite →
                    </a>
                  </div>
                )}

                {/* Fallback */}
                {!["google-maps","landing-page","email"].includes(openChannel) && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Dieser Kanal wird bald konfigurierbar sein.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ PROFIL ══════════════════════════════ */}
        {tab === "Profil" && (
          <div style={{ maxWidth: 680 }}>
            <div style={S.card}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[["name","Firmenname"],["website","Website"],["region","Region / Gebiet"],["contact","Ansprechpartner"],["phone","Telefon"],["email","E-Mail"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={S.label}>{l}</label>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={S.input} />
                  </div>
                ))}
                {[["description","Was bietet der Kunde an?"],["usp","Was macht ihn besonders? (USP)"],["notes","Notizen"]].map(([k, l]) => (
                  <div key={k} style={{ gridColumn: "1/-1" }}>
                    <label style={S.label}>{l}</label>
                    <textarea value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} rows={3}
                      style={{ ...S.input, resize: "vertical" }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={() => saveClient()} style={S.btn}>Speichern</button>
              </div>
            </div>

            {/* Website-Analyse */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 3 }}>Website analysieren</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Lädt die Website, prüft SEO-Felder und füllt Zielgruppe, USP und Keywords per KI aus.
                  </div>
                  {client.analyzed_at && (
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 5 }}>
                      Zuletzt analysiert: {new Date(client.analyzed_at).toLocaleString("de-DE")}
                    </div>
                  )}
                </div>
                <button
                  onClick={analyseWebsite}
                  disabled={analysingWebsite}
                  style={{ ...S.btn, opacity: analysingWebsite ? .6 : 1, cursor: analysingWebsite ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                  {analysingWebsite ? "⏳ Analysiert…" : client.analyzed_at ? "Neu analysieren" : "Analysieren"}
                </button>
              </div>
              {websiteAnalysisErr && (
                <div style={{ marginTop: 10, padding: "9px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
                  {websiteAnalysisErr}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ MARKETING ═══════════════════════════ */}
        {tab === "Marketing" && (
          <div style={{ maxWidth: 820 }}>

            {/* ── Analyse-Ergebnisse ───────────────────────── */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 500, color: "var(--ink)", margin: 0 }}>
                  Website-Analyse
                </h3>
                {client.analyzed_at
                  ? <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Zuletzt analysiert: {new Date(client.analyzed_at).toLocaleString("de-DE")}</span>
                  : <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>Noch nicht analysiert — bitte im Profil auf „Analysieren" klicken.</span>
                }
              </div>

              {client.analyzed_at ? (
                <div style={{ display: "grid", gap: 16 }}>

                  {/* Zielgruppe + USP */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={S.sectionHd}>Zielgruppe</div>
                      <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, lineHeight: 1.6 }}>{client.target_audience || "—"}</p>
                    </div>
                    <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={S.sectionHd}>USP</div>
                      <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, lineHeight: 1.6 }}>{client.usp || "—"}</p>
                    </div>
                  </div>

                  {/* Keywords */}
                  {client.keywords && (
                    <div>
                      <div style={S.sectionHd}>Keywords</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {client.keywords.split(",").map(k => k.trim()).filter(Boolean).map(k => (
                          <span key={k} style={{ background: "var(--ink)", color: "#fff", fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 99 }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEO-Checkliste */}
                  {client.seo_check && (
                    <div>
                      <div style={S.sectionHd}>SEO-Checkliste</div>
                      <div style={{ display: "grid", gap: 6 }}>
                        {[
                          ["title",            "Title-Tag"],
                          ["meta_description", "Meta Description"],
                          ["h1",               "H1-Überschrift"],
                          ["canonical",        "Canonical URL"],
                          ["https",            "HTTPS"],
                          ["og_tags",          "Open Graph Tags"],
                          ["schema_org",       "Schema.org / JSON-LD"],
                          ["robots",           "Robots Meta Tag"],
                          ["sitemap",          "Sitemap"],
                        ].map(([key, label]) => {
                          const entry = client.seo_check[key];
                          if (!entry) return null;
                          return (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "var(--bg)", borderRadius: 8 }}>
                              <span style={{ fontSize: 14, flexShrink: 0 }}>{entry.vorhanden ? "✅" : "❌"}</span>
                              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", minWidth: 160 }}>{label}</span>
                              {entry.wert && (
                                <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}>
                                  {entry.wert}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                  Keine Analyse-Daten vorhanden.
                </div>
              )}
            </div>

            {/* Website & Social */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 500, color: "var(--ink)", marginBottom: 16 }}>Website & Social Media</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[["website","Website-URL"],["instagram","Instagram"],["facebook","Facebook"],["linkedin","LinkedIn"],["tiktok","TikTok"]].map(([k,l]) => (
                  <div key={k}>
                    <label style={S.label}>{l}</label>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={k === "website" ? "https://" : "@handle oder URL"} style={S.input} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <button onClick={() => saveClient()} style={S.btn}>Speichern</button>
              </div>
            </div>

            {/* Marketing-Strategie Felder */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 500, color: "var(--ink)", marginBottom: 16 }}>Marketing-Strategie</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={S.label}>Keywords (kommagetrennt)</label>
                  <input value={form.keywords || ""} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>USP / Alleinstellungsmerkmal</label>
                  <input value={form.usp || ""} onChange={e => setForm(f => ({ ...f, usp: e.target.value }))} style={S.input} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={S.label}>Zielgruppe</label>
                  <textarea value={form.target_audience || ""} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} rows={2} style={{ ...S.input, resize: "vertical" }} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={S.label}>Strategie / Notizen</label>
                  <textarea value={form.strategy_notes || ""} onChange={e => setForm(f => ({ ...f, strategy_notes: e.target.value }))} rows={3} style={{ ...S.input, resize: "vertical" }} />
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <button onClick={() => saveClient()} style={S.btn}>Speichern</button>
              </div>
            </div>

            {/* Outreach-Strategie Wizard */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 500, color: "var(--ink)", marginBottom: 20 }}>Outreach-Plan</h3>

              {/* Fortschritt */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
                {[1,2,3].map((s,i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", flex: s < 3 ? 1 : 0 }}>
                    <div onClick={() => setStratStep(s)} style={{ width: 30, height: 30, borderRadius: "50%", background: stratStep >= s ? "var(--ink)" : "var(--border)", color: stratStep >= s ? "#fff" : "var(--text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
                      {stratStep > s ? "✓" : s}
                    </div>
                    <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: stratStep >= s ? "var(--ink)" : "var(--text-tertiary)", flexShrink: 0 }}>{["Quellen","Kontakt-Wege","Plan"][i]}</span>
                    {s < 3 && <div style={{ flex: 1, height: 2, background: stratStep > s ? "var(--ink)" : "var(--border)", margin: "0 12px" }} />}
                  </div>
                ))}
              </div>

              {stratStep === 1 && (
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Wo findest du Leads für <strong>{client.name}</strong>?</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {SOURCES_DEF.map(src => {
                      const on = selSources.includes(src.key);
                      return (
                        <div key={src.key} onClick={() => toggleSrc(src.key)}
                          style={{ padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${on ? "var(--ink)" : "var(--border)"}`, cursor: "pointer", display: "flex", gap: 10 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${on ? "var(--ink)" : "var(--border)"}`, background: on ? "var(--ink)" : "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                            {on && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{src.label}</div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{src.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => setStratStep(2)} disabled={selSources.length === 0}
                    style={{ ...S.btn, opacity: selSources.length === 0 ? .4 : 1, cursor: selSources.length === 0 ? "not-allowed" : "pointer" }}>
                    Weiter → Kontakt-Wege
                  </button>
                </div>
              )}

              {stratStep === 2 && (
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Wie kontaktierst du die Leads?</p>
                  {selSources.map(sk => {
                    const src = SOURCES_DEF.find(s => s.key === sk);
                    const opts = OUTREACH_OPTS[sk] || [];
                    const cho  = selOutreach[sk] || [];
                    return (
                      <div key={sk} style={{ ...S.card, marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginBottom: 10 }}>
                          {src?.label}
                          {cho.length > 0 && <span style={{ marginLeft: 8, background: "var(--border)", color: "var(--ink)", fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 99 }}>{cho.length} gewählt</span>}
                        </div>
                        {opts.map(opt => {
                          const on = cho.includes(opt.key);
                          return (
                            <div key={opt.key} onClick={() => toggleOut(sk, opt.key)}
                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`, marginBottom: 6, cursor: "pointer" }}>
                              <div style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${on ? "var(--ink)" : "var(--border)"}`, background: on ? "var(--ink)" : "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {on && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)" }}>{opt.label}</div>
                                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{opt.desc}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => setStratStep(1)} style={S.btnOutline}>← Zurück</button>
                    <button onClick={() => { saveClient(); setStratStep(3); }} disabled={!stratDone}
                      style={{ ...S.btn, opacity: !stratDone ? .4 : 1, cursor: !stratDone ? "not-allowed" : "pointer" }}>
                      Speichern & Plan anzeigen →
                    </button>
                  </div>
                </div>
              )}

              {stratStep === 3 && (
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Outreach-Fluss für {client.name}:</p>
                  {selSources.map((sk, i) => {
                    const src  = SOURCES_DEF.find(s => s.key === sk);
                    const cho  = (selOutreach[sk] || []).map(ok => (OUTREACH_OPTS[sk] || []).find(o => o.key === ok)).filter(Boolean);
                    return (
                      <div key={sk} style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i+1}</div>
                          {i < selSources.length-1 && <div style={{ width: 2, flex: 1, background: "var(--border)", minHeight: 20 }} />}
                        </div>
                        <div style={{ ...S.card, flex: 1, marginBottom: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{src?.label}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {cho.map(opt => (
                              <span key={opt.key} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 7, padding: "3px 9px", fontSize: 12 }}>{opt.label}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => setStratStep(1)} style={{ ...S.btnOutline, marginTop: 8 }}>← Bearbeiten</button>
                </div>
              )}
            </div>

            {/* Produkte */}
            <div style={S.card}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 500, color: "var(--ink)", marginBottom: 16 }}>Produkte & Leistungen</h3>

              {products.map(p => (
                <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{p.name}</div>
                    <button onClick={() => delProduct(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><Trash2 size={14} strokeWidth={1.5} /></button>
                  </div>
                  {p.description && <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>{p.description}</div>}
                  {p.target_groups && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Zielgruppen: {p.target_groups}</div>}
                  <button onClick={() => startAnalysis(p)} disabled={analysing === p.id} style={{ ...S.btnSm, marginTop: 4 }}>
                    {analysing === p.id ? "⏳ Analysiert…" : "KI-Analyse starten"}
                  </button>
                  {analysis[p.id] && (
                    <div style={{ marginTop: 10, background: "var(--bg)", borderRadius: 8, padding: 12, fontSize: 12, color: "var(--text-secondary)" }}>
                      ✓ {analysis[p.id].searches?.length || 0} Suchaufträge angelegt
                    </div>
                  )}
                </div>
              ))}

              <div style={{ border: "1px dashed var(--border)", borderRadius: 10, padding: "14px 16px", marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>+ Neues Produkt</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[["name","Produktname *"],["region","Region"],["target_groups","Zielgruppen"],["keywords","Keywords"],["offer","Lead-Magnet / Angebot"],["description","Beschreibung"]].map(([k,l]) => (
                    <div key={k} style={{ gridColumn: k === "description" ? "1/-1" : undefined }}>
                      <label style={S.label}>{l}</label>
                      <input value={newProd[k]} onChange={e => setNewProd(p => ({ ...p, [k]: e.target.value }))} style={S.input} />
                    </div>
                  ))}
                </div>
                <button onClick={addProduct} style={{ ...S.btn, marginTop: 12 }}>Produkt anlegen</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ LANDING PAGES ═══════════════════════ */}
        {tab === "Landing Pages" && (() => {
          async function generateLP() {
            setGeneratingLP(true); setLpError(""); setLpPreview(null);
            try {
              const d = await apiFetch("/api/landing-pages", { method: "POST", body: JSON.stringify({ client_id: id }) });
              if (d.error) { setLpError(d.error); return; }
              setLandingPages(lps => [d.lp, ...lps]);
              setLpPreview(d.lp);
            } catch { setLpError("Netzwerkfehler — bitte nochmal versuchen."); }
            finally { setGeneratingLP(false); }
          }
          async function deleteLP(lpId) {
            if (!confirm("Landing Page löschen?")) return;
            await apiFetch("/api/landing-pages?id=" + lpId, { method: "DELETE" });
            setLandingPages(lps => lps.filter(l => l.id !== lpId));
            if (lpPreview?.id === lpId) setLpPreview(null);
          }
          const STATUS_COLOR = { published: "#15803d", draft: "#6b7280", in_bearbeitung: "#6b7280" };
          return (
            <div style={{ maxWidth: 820 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--ink)", margin: 0 }}>Landing Pages</h2>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>{landingPages.length} Seite{landingPages.length !== 1 ? "n" : ""} für {client.name}</p>
                </div>
                <button onClick={generateLP} disabled={generatingLP}
                  style={{ ...S.btn, opacity: generatingLP ? .6 : 1, cursor: generatingLP ? "not-allowed" : "pointer" }}>
                  {generatingLP ? "⏳ Wird erstellt…" : "+ Landingpage entwickeln"}
                </button>
              </div>

              {lpError && <div style={{ marginBottom: 14, padding: "9px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>{lpError}</div>}

              {/* Liste */}
              {landingPages.length === 0 && !generatingLP && (
                <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
                  <Globe size={32} strokeWidth={1} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Noch keine Landing Pages — oben erstellen.</div>
                </div>
              )}

              {landingPages.map(lp => (
                <div key={lp.id} style={{ ...S.card, marginBottom: 10, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                  onClick={() => setLpPreview(lpPreview?.id === lp.id ? null : lp)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lp.title || lp.slug}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>/lp/{lp.slug}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 99, background: STATUS_COLOR[lp.status] + "18", color: STATUS_COLOR[lp.status] }}>
                    {lp.status === "published" ? "Veröffentlicht" : "Entwurf"}
                  </span>
                  <a href={"/lp/" + lp.slug} target="_blank" onClick={e => e.stopPropagation()}
                    style={{ color: "var(--text-tertiary)", display: "flex" }}>
                    <ExternalLink size={14} strokeWidth={1.5} />
                  </a>
                  <button onClick={e => { e.stopPropagation(); deleteLP(lp.id); }}
                    style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex" }}>
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}

              {/* Vorschau */}
              {lpPreview && (
                <div style={{ ...S.card, marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={S.sectionHd}>Vorschau — Entwurf</div>
                    <a href={"/lp/" + lpPreview.slug} target="_blank"
                      style={{ ...S.btnOutline, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 12 }}>
                      <ExternalLink size={12} strokeWidth={1.5} /> Seite öffnen
                    </a>
                  </div>

                  {/* Hero */}
                  <div style={{ background: "var(--ink)", borderRadius: 10, padding: "24px 28px", marginBottom: 14, color: "#fff" }}>
                    {lpPreview.content?.hero?.badge && (
                      <div style={{ display: "inline-block", background: "rgba(255,255,255,.15)", borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "3px 10px", marginBottom: 10 }}>
                        {lpPreview.content.hero.badge}
                      </div>
                    )}
                    <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 8px" }}>
                      {lpPreview.content?.hero?.headline}
                    </h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.75)", margin: "0 0 14px", lineHeight: 1.6 }}>
                      {lpPreview.content?.hero?.subline}
                    </p>
                    {(lpPreview.content?.hero?.bullets || []).map((b, i) => (
                      <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,.85)", marginBottom: 4 }}>✓ {b}</div>
                    ))}
                    <div style={{ marginTop: 16, display: "inline-block", background: "#fff", color: "var(--ink)", fontWeight: 700, padding: "10px 22px", borderRadius: 8, fontSize: 13 }}>
                      {lpPreview.content?.hero?.cta_text}
                    </div>
                  </div>

                  {/* USP-Blöcke */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
                    {(lpPreview.content?.usp_blocks || []).map((b, i) => (
                      <div key={i} style={{ background: "var(--bg)", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>{b.icon}</div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginBottom: 4 }}>{b.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{b.text}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {lpPreview.content?.cta && (
                    <div style={{ background: "var(--bg)", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>{lpPreview.content.cta.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>{lpPreview.content.cta.sub}</div>
                      <div style={{ display: "inline-block", background: "var(--ink)", color: "#fff", fontWeight: 700, padding: "10px 24px", borderRadius: 8, fontSize: 13 }}>
                        {lpPreview.content.cta.button}
                      </div>
                    </div>
                  )}

                  {/* Impressum + Datenschutz */}
                  <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={S.label}>Impressum</label>
                      <textarea rows={4} defaultValue={lpPreview.impressum || ""}
                        onBlur={e => apiFetch("/api/landing-pages", { method: "PATCH", body: JSON.stringify({ id: lpPreview.id, impressum: e.target.value }) })}
                        placeholder="Impressumstext eingeben…"
                        style={{ ...S.input, resize: "vertical" }} />
                    </div>
                    <div>
                      <label style={S.label}>Datenschutz</label>
                      <textarea rows={4} defaultValue={lpPreview.datenschutz || ""}
                        onBlur={e => apiFetch("/api/landing-pages", { method: "PATCH", body: JSON.stringify({ id: lpPreview.id, datenschutz: e.target.value }) })}
                        placeholder="Datenschutztext eingeben…"
                        style={{ ...S.input, resize: "vertical" }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-tertiary)" }}>Impressum und Datenschutz werden beim Speichern automatisch übernommen.</div>
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </AppShell>
  );
}
