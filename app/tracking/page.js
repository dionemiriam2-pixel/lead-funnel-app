"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { BarChart2, Copy, Link } from "lucide-react";

function KpiCard({ label, value, sub }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 500, color: "var(--ink)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function UtmGenerator() {
  const [fields, setFields] = useState({ url: "", source: "", medium: "", campaign: "", content: "" });
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  function generate() {
    if (!fields.url || !fields.source || !fields.medium || !fields.campaign) return;
    const p = new URLSearchParams();
    if (fields.source)   p.set("utm_source",   fields.source);
    if (fields.medium)   p.set("utm_medium",   fields.medium);
    if (fields.campaign) p.set("utm_campaign", fields.campaign);
    if (fields.content)  p.set("utm_content",  fields.content);
    const base = fields.url.includes("?") ? fields.url + "&" : fields.url + "?";
    setResult(base + p.toString());
    setCopied(false);
  }

  function copy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle = { width: "100%", padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--ink)", background: "#fff", boxSizing: "border-box", fontFamily: "inherit" };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 };

  const field = (key, label, placeholder) => (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      <input value={fields[key]} onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
    </div>
  );

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Link size={16} strokeWidth={1.5} color="var(--text-secondary)" />
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>UTM-Generator</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Erstelle getrackte Links für deine Kampagnen.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>{field("url", "Ziel-URL *", "https://deine-seite.de/landingpage")}</div>
        {field("source",   "utm_source *",            "z.B. facebook, google, newsletter")}
        {field("medium",   "utm_medium *",            "z.B. cpc, email, social")}
        {field("campaign", "utm_campaign *",           "z.B. sommer-aktion-2026")}
        {field("content",  "utm_content (optional)",  "z.B. banner-oben")}
      </div>
      <button onClick={generate}
        style={{ padding: "9px 20px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
        Link generieren
      </button>
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>Dein UTM-Link</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1, padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--ink)", wordBreak: "break-all", lineHeight: 1.6 }}>
              {result}
            </div>
            <button onClick={copy}
              style={{ padding: "9px 14px", background: copied ? "var(--ink)" : "transparent", color: copied ? "#fff" : "var(--ink)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
              <Copy size={13} strokeWidth={1.5} />
              {copied ? "Kopiert" : "Kopieren"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  const [leads,            setLeads]            = useState([]);
  const [clients,          setClients]          = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    Promise.all([apiFetch("/api/leads"), apiFetch("/api/clients")]).then(([lr, cr]) => {
      setLeads(lr.data || []);
      setClients(cr.data || []);
      setLoading(false);
    });
  }, []);

  const filtered  = selectedClientId ? leads.filter(l => l.client_id === selectedClientId) : leads;
  const total     = filtered.length;
  const hot       = filtered.filter(l => (Number(l.score) || 0) >= 6).length;
  const gewonnen  = filtered.filter(l => l.status === "gewonnen").length;
  const convRate  = total > 0 ? Math.round(gewonnen / total * 100) : 0;

  const inp = { padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--ink)", background: "#fff" };

  return (
    <AppShell>
      <div style={{ padding: "28px 32px", maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0 }}>Tracking</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>KPIs, Ads-Anbindung und Kampagnen-Tools</p>
          </div>
          <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} style={inp}>
            <option value="">Alle Kunden</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* KPI-Zeile */}
        {loading ? (
          <div style={{ color: "var(--text-tertiary)", fontSize: 14, marginBottom: 24 }}>Lädt…</div>
        ) : (
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <KpiCard label="Leads gesamt"   value={total}           sub={selectedClientId ? clients.find(c => c.id === selectedClientId)?.name : "alle Kunden"} />
            <KpiCard label="Hot Leads ≥ 6" value={hot}             sub={`${total > 0 ? Math.round(hot / total * 100) : 0}% des Gesamt`} />
            <KpiCard label="Conversion"     value={convRate + "%"}  sub={`${gewonnen} gewonnen`} />
          </div>
        )}

        {/* Ads-Platzhalter */}
        <div style={{ background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: 12, padding: "24px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 18 }}>
          <BarChart2 size={32} strokeWidth={1} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>Meta & Google Ads</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Spend, Impressionen, Klicks und Leads direkt aus Meta und Google — kommt in <strong>Phase 4</strong> via Windsor.ai.<br />
              Die Tabelle <code style={{ background: "var(--border)", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>ad_metrics</code> wird dann hier befüllt.
            </div>
          </div>
        </div>

        {/* UTM-Generator */}
        <UtmGenerator />
      </div>
    </AppShell>
  );
}
