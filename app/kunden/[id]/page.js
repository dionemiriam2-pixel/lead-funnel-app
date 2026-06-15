"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { apiFetch, authHeaders } from "@/lib/api";
import {
  MapPin, Globe, Link2, Mail, Target, MessageSquare,
  AlertCircle, Users, Zap, Map, Search,
} from "lucide-react";

const TABS = ["Leads", "Pipeline", "Kanäle", "Profil", "Produkte", "Marketing", "Landing Pages"];

const PIPELINE_STATUSES = [
  { key: "kalt",         label: "Kalt",         color: "#9ca3af" },
  { key: "kontaktiert",  label: "Kontaktiert",  color: "#ec4899" },
  { key: "qualifiziert", label: "Qualifiziert", color: "#f97316" },
  { key: "angebot",      label: "Angebot",      color: "#a855f7" },
  { key: "gewonnen",     label: "Gewonnen",     color: "#22c55e" },
  { key: "verloren",     label: "Verloren",     color: "#ef4444" },
];

const KANALE = [
  { key: "google-maps",  Icon: MapPin,        label: "Google Maps",      desc: "Firmen-Scraping & Leads",    soon: false },
  { key: "landing-page", Icon: Globe,         label: "Landing Page",     desc: "Inbound Lead-Erfassung",     soon: false },
  { key: "linkedin",     Icon: Link2,         label: "LinkedIn",         desc: "Kontakte & Outreach",        soon: true },
  { key: "email",        Icon: Mail,          label: "E-Mail Outreach",  desc: "Mails senden & Verlauf",     soon: false },
  { key: "ads",          Icon: Target,        label: "Werbeanzeigen",    desc: "Meta / Google Ads",          soon: true },
  { key: "chat",         Icon: MessageSquare, label: "ManyChat / Chat",  desc: "Chat-Automatisierung",       soon: true },
];

const SOURCES = [
  { key: "google-maps", label: "Google Maps Bot", desc: "Findet Firmen automatisch täglich" },
  { key: "linkedin",    label: "LinkedIn",         desc: "Sales Navigator, Suche, Gruppen" },
  { key: "facebook",    label: "Facebook / Instagram", desc: "Lead Ads, Gruppen, DMs" },
  { key: "google-ads",  label: "Google Ads",       desc: "Suchanzeigen, Display" },
  { key: "gelbe-seiten",label: "Gelbe Seiten",     desc: "Branchenverzeichnis" },
  { key: "csv",         label: "CSV / eigene Liste", desc: "Kontakte selbst hochladen" },
];

const OUTREACH_OPTIONS = {
  "google-maps": [
    { key: "ads",   label: "Custom Audience Ads", desc: "Kontakte bei Meta/Google hochladen → Firma sieht deine Werbung" },
    { key: "email", label: "E-Mail (KI)",          desc: "KI schreibt personalisiertes Angebot automatisch" },
    { key: "phone", label: "Telefonakquise",       desc: "Direkt anrufen — 100% legal im B2B" },
  ],
  "linkedin": [
    { key: "dm",      label: "LinkedIn DM",            desc: "Persönliche Nachricht direkt auf LinkedIn" },
    { key: "ads",     label: "LinkedIn Ads",           desc: "Gesponsorte Inhalte, InMail Ads" },
    { key: "connect", label: "Vernetzung + Follow-up", desc: "Vernetzen, dann nach 3 Tagen anschreiben" },
  ],
  "facebook": [
    { key: "ads",      label: "Custom Audience Ads",        desc: "Kontakte hochladen, Anzeigen ausspielen" },
    { key: "lead-ads", label: "Lead Ads",                   desc: "Formular direkt in Facebook" },
    { key: "dm",       label: "Facebook / Instagram DM",    desc: "Direktnachricht an die Firma" },
  ],
  "google-ads": [
    { key: "ads",        label: "Suchanzeigen", desc: "Erscheinen wenn jemand nach deiner Leistung sucht" },
    { key: "display",    label: "Display Ads",  desc: "Banner auf Websites im Google Netzwerk" },
    { key: "remarketing",label: "Remarketing",  desc: "Kontakte die Website besucht haben erneut ansprechen" },
  ],
  "gelbe-seiten": [
    { key: "email", label: "E-Mail (KI)",         desc: "KI schreibt personalisiertes Angebot" },
    { key: "phone", label: "Telefonakquise",      desc: "Direkt anrufen" },
    { key: "ads",   label: "Custom Audience Ads", desc: "Kontakte bei Meta hochladen" },
  ],
  "csv": [
    { key: "email", label: "E-Mail (KI)",         desc: "KI schreibt personalisiertes Angebot" },
    { key: "ads",   label: "Custom Audience Ads", desc: "Liste direkt bei Meta/Google hochladen" },
    { key: "phone", label: "Telefonakquise",      desc: "Liste durcharbeiten, anrufen" },
  ],
};

export default function KundeDetailPage() {
  const { id } = useParams();
  const [client,    setClient]    = useState(null);
  const [products,  setProducts]  = useState([]);
  const [leads,     setLeads]     = useState([]);
  const [tab,       setTab]       = useState("Leads");
  const [form,      setForm]      = useState({});
  const [newProd,   setNewProd]   = useState({ name: "", description: "", target_groups: "", keywords: "", region: "", offer: "" });
  const [analysis,  setAnalysis]  = useState({});
  const [analysing, setAnalysing] = useState(null);
  const [msg,       setMsg]       = useState("");
  const [stratStep, setStratStep] = useState(1);
  const [openChannel,  setOpenChannel]  = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);

  async function load() {
    const [cr, pr, lr] = await Promise.all([
      apiFetch("/api/clients"),
      apiFetch("/api/products?client_id=" + id),
      apiFetch("/api/leads"),
    ]);
    const c = (cr.data || []).find(x => x.id === id);
    setClient(c || null);
    setForm(c || {});
    setProducts(pr.data || []);
    setLeads((lr.data || []).filter(l => l.client === c?.name));
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function saveClient() {
    await fetch("/api/clients", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ id, ...form }) });
    setMsg("✓ Gespeichert");
    setTimeout(() => setMsg(""), 2000);
    await load();
  }

  async function addProduct() {
    if (!newProd.name.trim()) return;
    await fetch("/api/products", { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...newProd, client_id: id, region: newProd.region || client?.region }) });
    setNewProd({ name: "", description: "", target_groups: "", keywords: "", region: "", offer: "" });
    await load();
  }

  async function delProduct(pid) {
    if (!confirm("Produkt löschen?")) return;
    await fetch("/api/products?id=" + pid, { method: "DELETE", headers: authHeaders() });
    await load();
  }

  async function saveChannels() {
    await apiFetch("/api/clients", { method: "PATCH", body: JSON.stringify({ id, channels: form.channels || {} }) });
    setMsg("✓ Kanäle gespeichert");
    setTimeout(() => setMsg(""), 2000);
  }

  async function startAnalysis(prod) {
    setAnalysing(prod.id);
    const d = await apiFetch("/api/analyse", { method: "POST", body: JSON.stringify({ product_id: prod.id, client_id: id }) });
    setAnalysis(a => ({ ...a, [prod.id]: d }));
    setAnalysing(null);
  }

  if (!client) return <AppShell><div style={{ padding: 40, color: "var(--text-secondary)" }}>Lade…</div></AppShell>;

  // Computed
  const initial       = (client.name?.[0] || "K").toUpperCase();
  const unprocessed   = leads.filter(l => !l.pipeline_status || l.pipeline_status === "neu");
  const hot           = leads.filter(l => (l.score || 0) >= 6);
  const cities        = new Set(leads.map(l => l.city).filter(Boolean));
  const filteredLeads = sourceFilter ? leads.filter(l => l.source === sourceFilter) : leads;

  const pipelineCounts = Object.fromEntries(PIPELINE_STATUSES.map(s => [s.key, 0]));
  leads.forEach(l => {
    const k = l.pipeline_status || "kalt";
    if (k in pipelineCounts) pipelineCounts[k]++;
    else pipelineCounts["kalt"]++;
  });

  const sourceCounts = {};
  leads.forEach(l => { if (l.source) sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });

  const strat           = form.strategy || {};
  const selectedSources = strat.sources || [];
  const selectedOutreach= strat.outreach || {};
  const allDone         = selectedSources.length > 0 && selectedSources.every(s => (selectedOutreach[s] || []).length > 0);

  function toggleSource(key) {
    const next = selectedSources.includes(key) ? selectedSources.filter(s => s !== key) : [...selectedSources, key];
    setForm(f => ({ ...f, strategy: { ...strat, sources: next } }));
  }
  function toggleOutreach(sourceKey, outKey) {
    const cur  = selectedOutreach[sourceKey] || [];
    const next = cur.includes(outKey) ? cur.filter(o => o !== outKey) : [...cur, outKey];
    setForm(f => ({ ...f, strategy: { ...strat, outreach: { ...selectedOutreach, [sourceKey]: next } } }));
  }

  const S = {
    card: { background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" },
    label: { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 },
    input: { width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--ink)", background: "#fff", boxSizing: "border-box" },
    btn: { padding: "9px 20px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" },
    btnOutline: { padding: "9px 20px", background: "transparent", color: "var(--ink)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 14, cursor: "pointer" },
  };

  return (
    <AppShell>
      <div style={{ padding: "24px 32px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
          <a href="/kunden" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Kunden</a>
          <span style={{ color: "var(--border-strong)", opacity: .4 }}>›</span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{client.name}</span>
        </div>

        {/* Header Card mit Tabs */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 20px", marginBottom: 22, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ minWidth: 140 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{client.name}</div>
            {client.region && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>{client.region}</div>}
          </div>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "6px 13px", border: "none", borderRadius: 7, fontSize: 13, cursor: "pointer",
                background: tab === t ? "var(--ink)" : "transparent",
                color: tab === t ? "#fff" : "var(--text-secondary)",
                fontWeight: tab === t ? 500 : 400,
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── LEADS TAB ── */}
        {tab === "Leads" && (
          <div>
            {unprocessed.length > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "11px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent)", fontSize: 14, fontWeight: 500 }}>
                  <AlertCircle size={16} strokeWidth={1.5} />
                  {unprocessed.length} Lead{unprocessed.length !== 1 ? "s" : ""} warten auf Bearbeitung
                </div>
                <button onClick={() => setSourceFilter(null)} style={{ padding: "5px 14px", border: "1px solid var(--accent)", borderRadius: 7, background: "transparent", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}>
                  Jetzt bearbeiten →
                </button>
              </div>
            )}

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { Icon: Users,  top: "GESAMT",  sub: "LEADS",       val: leads.length,      accent: false },
                { Icon: Zap,    top: "HOT",     sub: "SCORE ≥ 6",   val: hot.length,        accent: true },
                { Icon: Search, top: "NEU",     sub: "UNBEARBEITET",val: unprocessed.length, accent: unprocessed.length > 0 },
                { Icon: Map,    top: "STÄDTE",  sub: "ORTE",        val: cities.size,       accent: false },
              ].map(({ Icon, top, sub, val, accent }) => (
                <div key={top} style={{ ...S.card, padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Icon size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: accent && val > 0 ? "var(--accent)" : "var(--text-tertiary)", textTransform: "uppercase" }}>{top}</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 5, color: accent && val > 0 ? "var(--accent)" : "var(--ink)" }}>{val}</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)" }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Pipeline Bar */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)" }}>Pipeline-Status</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {pipelineCounts["gewonnen"]} gewonnen · {leads.length > 0 ? Math.round(pipelineCounts["gewonnen"] / leads.length * 100) : 0}% Conversion
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 99, overflow: "hidden", display: "flex", background: "var(--border)", marginBottom: 12 }}>
                {PIPELINE_STATUSES.map(s => {
                  const pct = leads.length > 0 ? (pipelineCounts[s.key] / leads.length) * 100 : 0;
                  return pct > 0 ? <div key={s.key} style={{ width: `${pct}%`, background: s.color, transition: "width .3s" }} /> : null;
                })}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {PIPELINE_STATUSES.map(s => (
                  <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                    {s.label} <span style={{ fontWeight: 600, color: "var(--ink)" }}>{pipelineCounts[s.key]}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Lead Sources */}
            {Object.keys(sourceCounts).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", marginBottom: 10 }}>
                  Lead-Quellen — Klick zum Filtern
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {Object.entries(sourceCounts).map(([source, count]) => (
                    <div key={source} onClick={() => setSourceFilter(sourceFilter === source ? null : source)}
                      style={{ background: "#fff", border: `1px solid ${sourceFilter === source ? "var(--ink)" : "var(--border)"}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer" }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)", lineHeight: 1, marginBottom: 5 }}>{count}</div>
                      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>{source}</div>
                      {sourceFilter === source && <div style={{ width: "100%", height: 2, background: "var(--accent)", borderRadius: 2, marginTop: 8 }} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lead Table */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {filteredLeads.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
                  Noch keine Leads für {client.name}.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Firma", "Ort", "Quelle", "Score", "Status"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(l => (
                      <tr key={l.id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 500, fontSize: 14, color: "var(--ink)" }}>{l.company_name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{l.city || "–"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 11, background: "var(--bg)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 99, color: "var(--text-secondary)" }}>{l.source || "–"}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: l.score >= 8 ? "#dcfce7" : l.score >= 6 ? "#fef9c3" : "#f3f4f6", color: l.score >= 8 ? "#15803d" : l.score >= 6 ? "#854d0e" : "var(--text-secondary)" }}>
                            {l.score ?? "–"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{l.pipeline_status || "neu"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── PIPELINE TAB ── */}
        {tab === "Pipeline" && (
          <div style={{ ...S.card, padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
            Pipeline-Ansicht kommt bald.
          </div>
        )}

        {/* ── KANÄLE TAB ── */}
        {tab === "Kanäle" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Kanäle</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Lead-Quellen für <strong>{client.name}</strong> — aktivieren, konfigurieren, direkt arbeiten
              </p>
            </div>

            {/* Channel Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {KANALE.map(({ key, Icon, label, desc, soon }) => {
                const isActive = !!form.channels?.[key];
                const isOpen   = openChannel === key;
                return (
                  <div key={key} style={{
                    background: "#fff",
                    border: `1px solid ${isOpen ? "var(--accent)" : isActive ? "var(--border-strong)" : "var(--border)"}`,
                    borderRadius: 12, padding: "16px 18px",
                    opacity: soon ? .55 : 1,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <Icon size={20} strokeWidth={1.5} color={isOpen ? "var(--accent)" : "var(--text-secondary)"} />
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                        background: soon ? "#f3f4f6" : isActive ? "#dcfce7" : "#f3f4f6",
                        color:      soon ? "var(--text-tertiary)" : isActive ? "#15803d" : "var(--text-tertiary)",
                      }}>
                        {soon ? "Bald" : isActive ? "Aktiv" : "Inaktiv"}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>{desc}</div>
                    {!soon && (
                      <button
                        onClick={() => {
                          const next = isOpen ? null : key;
                          setOpenChannel(next);
                          if (next && !isActive) {
                            const updated = { ...(form.channels || {}), [key]: true };
                            setForm(f => ({ ...f, channels: updated }));
                            apiFetch("/api/clients", { method: "PATCH", body: JSON.stringify({ id, channels: updated }) });
                          }
                        }}
                        style={{ fontSize: 12, padding: "5px 12px", border: "1px solid var(--border-strong)", borderRadius: 6, background: "transparent", color: "var(--ink)", cursor: "pointer" }}>
                        {isOpen ? "Schließen ↑" : isActive ? "Geöffnet ↓" : "Aktivieren"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Channel Detail Panel */}
            {openChannel && (
              <div style={{ ...S.card, padding: 24 }}>
                {openChannel === "google-maps" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <MapPin size={18} strokeWidth={1.5} color="var(--accent)" />
                      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Google Maps</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18 }}>
                      Leads aus der globalen Toolbox zuweisen oder neue Suche starten
                    </p>
                    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
                        <Search size={14} strokeWidth={1.5} /> Globale Google Maps Suche
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
                        Ergebnisse landen in der globalen Rohstoff-Datenbank — du wählst dann, welche Leads zu welchem Kunden gehören.
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input placeholder="Suchbegriff, z.B. Ladenbau Neueröffnung"
                          style={{ flex: 2, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--ink)" }} />
                        <input placeholder="Ort, z.B. München"
                          style={{ flex: 1, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--ink)" }} />
                        <input defaultValue="20" type="number"
                          style={{ width: 60, padding: "9px 8px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, textAlign: "center" }} />
                        <button style={{ ...S.btn, fontSize: 13, padding: "9px 16px" }}>+ Hinzufügen</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)" }}>
                      Globale Suchaufträge (0)
                    </div>
                  </div>
                )}
                {openChannel === "email" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <Mail size={18} strokeWidth={1.5} color="var(--accent)" />
                      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>E-Mail Outreach</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18 }}>
                      KI schreibt personalisierte E-Mails für jeden Lead automatisch
                    </p>
                    <a href="/outreach" style={{ ...S.btn, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                      Zur Outreach-Seite →
                    </a>
                  </div>
                )}
                {openChannel === "landing-page" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <Globe size={18} strokeWidth={1.5} color="var(--accent)" />
                      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Landing Page</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      Landing Pages für {client.name} verwalten — kommt bald.
                    </p>
                  </div>
                )}
                {!["google-maps", "email", "landing-page"].includes(openChannel) && (
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Dieser Kanal wird bald konfigurierbar sein.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PROFIL TAB ── */}
        {tab === "Profil" && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ ...S.card }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[["name", "Firmenname"], ["website", "Website"], ["region", "Region"], ["contact", "Ansprechpartner"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={S.label}>{l}</label>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={S.input} />
                  </div>
                ))}
                {[["description", "Was bietet der Kunde an?"], ["usp", "Was macht ihn besonders? (USP)"]].map(([k, l]) => (
                  <div key={k} style={{ gridColumn: "1/-1" }}>
                    <label style={S.label}>{l}</label>
                    <textarea value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} rows={3}
                      style={{ ...S.input, fontFamily: "inherit", resize: "vertical" }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={saveClient} style={S.btn}>Speichern</button>
                {msg && <span style={{ color: "#22c55e", fontSize: 13 }}>{msg}</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUKTE TAB ── */}
        {tab === "Produkte" && (
          <div>
            {products.map(p => (
              <div key={p.id} style={{ ...S.card, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{p.name}</h3>
                  <button onClick={() => delProduct(p.id)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 15 }}>🗑</button>
                </div>
                {p.description && <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 10 }}>{p.description}</p>}
                {p.target_groups && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Zielgruppen: </span>
                    {p.target_groups.split(",").map(t => <span key={t} style={{ display: "inline-block", background: "#eff6ff", color: "#1d4ed8", borderRadius: 99, padding: "2px 9px", fontSize: 12, margin: "2px 3px" }}>{t.trim()}</span>)}
                  </div>
                )}
                {p.keywords && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Keywords: </span>
                    {p.keywords.split(",").map(k => <span key={k} style={{ display: "inline-block", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 7px", fontSize: 12, margin: "2px 3px" }}>{k.trim()}</span>)}
                  </div>
                )}
                <button onClick={() => startAnalysis(p)} disabled={analysing === p.id} style={{ ...S.btn, fontSize: 13 }}>
                  {analysing === p.id ? "⏳ KI analysiert…" : "Analyse starten → Leads suchen"}
                </button>
                {analysis[p.id] && (
                  <div style={{ marginTop: 14, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: "var(--ink)" }}>
                      ✓ {analysis[p.id].searches?.length || 0} Suchaufträge angelegt
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(analysis[p.id].searches || []).map((s, i) => (
                        <span key={i} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "var(--text-secondary)" }}>
                          {s.term} · {s.location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ ...S.card, border: "2px dashed var(--border)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "var(--text-secondary)" }}>+ Neues Produkt / Leistung</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[["name", "Produktname *"], ["region", "Region (optional)"], ["target_groups", "Zielgruppen (Komma-getrennt)"], ["keywords", "Keywords (Komma-getrennt)"], ["offer", "Lead-Magnet / Angebot"], ["description", "Beschreibung"]].map(([k, l]) => (
                  <div key={k} style={{ gridColumn: k === "description" ? "1/-1" : undefined }}>
                    <label style={S.label}>{l}</label>
                    <input value={newProd[k]} onChange={e => setNewProd(p => ({ ...p, [k]: e.target.value }))} style={S.input} />
                  </div>
                ))}
              </div>
              <button onClick={addProduct} style={{ ...S.btn, marginTop: 14 }}>Produkt anlegen</button>
            </div>
          </div>
        )}

        {/* ── MARKETING TAB (Strategie) ── */}
        {tab === "Marketing" && (
          <div style={{ maxWidth: 780 }}>
            {/* Fortschrittsleiste */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
              {[1, 2, 3].map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", flex: s < 3 ? 1 : 0 }}>
                  <div onClick={() => setStratStep(s)} style={{ width: 34, height: 34, borderRadius: "50%", background: stratStep >= s ? "var(--ink)" : "var(--border)", color: stratStep >= s ? "#fff" : "var(--text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
                    {stratStep > s ? "✓" : s}
                  </div>
                  <div style={{ marginLeft: 10, flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: stratStep >= s ? "var(--ink)" : "var(--text-tertiary)" }}>{["Quellen", "Kontakt-Wege", "Dein Plan"][i]}</div>
                  </div>
                  {s < 3 && <div style={{ flex: 1, height: 2, background: stratStep > s ? "var(--ink)" : "var(--border)", margin: "0 12px" }} />}
                </div>
              ))}
            </div>

            {stratStep === 1 && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Wo findest du die Kontakte?</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Wähle alle Plattformen aus, über die du für <strong>{client.name}</strong> Leads sammeln möchtest.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {SOURCES.map(src => {
                    const on = selectedSources.includes(src.key);
                    return (
                      <div key={src.key} onClick={() => toggleSource(src.key)}
                        style={{ padding: "14px 16px", borderRadius: 12, border: `2px solid ${on ? "var(--ink)" : "var(--border)"}`, background: on ? "var(--bg)" : "#fff", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${on ? "var(--ink)" : "var(--border)"}`, background: on ? "var(--ink)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          {on && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{src.label}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{src.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setStratStep(2)} disabled={selectedSources.length === 0}
                  style={{ ...S.btn, marginTop: 20, opacity: selectedSources.length === 0 ? .4 : 1, cursor: selectedSources.length === 0 ? "not-allowed" : "pointer" }}>
                  Weiter → Kontakt-Wege wählen
                </button>
              </div>
            )}

            {stratStep === 2 && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Wie kontaktierst du sie?</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Pro Plattform: welche Wege nutzt du um die Kontakte zu erreichen?</p>
                {selectedSources.map(srcKey => {
                  const src     = SOURCES.find(s => s.key === srcKey);
                  const options = OUTREACH_OPTIONS[srcKey] || [];
                  const chosen  = selectedOutreach[srcKey] || [];
                  return (
                    <div key={srcKey} style={{ ...S.card, marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{src.label}</span>
                        {chosen.length > 0 && <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>{chosen.length} gewählt</span>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {options.map(opt => {
                          const on = chosen.includes(opt.key);
                          return (
                            <div key={opt.key} onClick={() => toggleOutreach(srcKey, opt.key)}
                              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 9, border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`, background: on ? "var(--bg)" : "#fafafa", cursor: "pointer" }}>
                              <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${on ? "var(--ink)" : "var(--border)"}`, background: on ? "var(--ink)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {on && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)" }}>{opt.label}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{opt.desc}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => setStratStep(1)} style={S.btnOutline}>← Zurück</button>
                  <button onClick={() => { saveClient(); setStratStep(3); }} disabled={!allDone}
                    style={{ ...S.btn, opacity: !allDone ? .4 : 1, cursor: !allDone ? "not-allowed" : "pointer" }}>
                    Speichern & Plan anzeigen →
                  </button>
                </div>
              </div>
            )}

            {stratStep === 3 && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Dein Outreach-Plan für {client.name}</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>So funktioniert dein System von Anfang bis zum Abschluss:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {selectedSources.map((srcKey, idx) => {
                    const src    = SOURCES.find(s => s.key === srcKey);
                    const chosen = (selectedOutreach[srcKey] || []).map(ok => (OUTREACH_OPTIONS[srcKey] || []).find(o => o.key === ok)).filter(Boolean);
                    return (
                      <div key={srcKey} style={{ display: "flex", gap: 16, marginBottom: 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{idx + 1}</div>
                          {idx < selectedSources.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--border)", minHeight: 28 }} />}
                        </div>
                        <div style={{ ...S.card, marginBottom: 12, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: "var(--ink)" }}>{src.label}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {chosen.map(opt => (
                              <span key={opt.key} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "var(--ink)" }}>
                                {opt.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button onClick={() => setStratStep(1)} style={S.btnOutline}>← Bearbeiten</button>
                  <button onClick={() => saveClient()} style={S.btn}>✓ Plan gespeichert</button>
                </div>
                {msg && <div style={{ marginTop: 10, color: "#22c55e", fontSize: 13 }}>{msg}</div>}
              </div>
            )}
          </div>
        )}

        {/* ── LANDING PAGES TAB ── */}
        {tab === "Landing Pages" && (
          <div style={{ ...S.card, padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
            Landing Pages für {client.name} kommen bald.
          </div>
        )}

      </div>
    </AppShell>
  );
}
