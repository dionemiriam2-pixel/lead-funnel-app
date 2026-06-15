"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", flex: 1, minWidth: 160, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#9ca3af", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.6px", color: "#111827", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>{sub}</div>}
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
    if (fields.source)   p.set("utm_source", fields.source);
    if (fields.medium)   p.set("utm_medium", fields.medium);
    if (fields.campaign) p.set("utm_campaign", fields.campaign);
    if (fields.content)  p.set("utm_content", fields.content);
    const base = fields.url.includes("?") ? fields.url + "&" : fields.url + "?";
    setResult(base + p.toString());
    setCopied(false);
  }

  function copy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inp = (key, label, placeholder) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{label}</label>
      <input value={fields[key]} onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
        style={{ width: "100%", padding: "9px 11px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#111827", background: "#fafafa", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }} />
    </div>
  );

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>🔗 UTM-Generator</div>
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Erstelle getrackte Links für deine Kampagnen.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>{inp("url", "Ziel-URL *", "https://deine-seite.de/landingpage")}</div>
        {inp("source", "utm_source *", "z.B. facebook, google, newsletter")}
        {inp("medium", "utm_medium *", "z.B. cpc, email, social")}
        {inp("campaign", "utm_campaign *", "z.B. sommer-aktion-2026")}
        {inp("content", "utm_content (optional)", "z.B. banner-oben")}
      </div>
      <button onClick={generate}
        style={{ padding: "10px 22px", background: "#111827", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        Link generieren
      </button>
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Dein UTM-Link</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1, padding: "10px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, color: "#374151", wordBreak: "break-all", lineHeight: 1.6 }}>
              {result}
            </div>
            <button onClick={copy}
              style={{ padding: "10px 16px", background: copied ? "#dcfce7" : "#f3f4f6", color: copied ? "#15803d" : "#374151", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {copied ? "✓ Kopiert" : "Kopieren"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch("/api/leads"), apiFetch("/api/clients")]).then(([lr, cr]) => {
      setLeads(lr.data || []);
      setClients(cr.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = selectedClientId ? leads.filter(l => l.client_id === selectedClientId) : leads;
  const total = filtered.length;
  const hot = filtered.filter(l => (Number(l.score) || 0) >= 6).length;
  const gewonnen = filtered.filter(l => l.status === "gewonnen").length;
  const convRate = total > 0 ? Math.round(gewonnen / total * 100) : 0;

  return (
    <AppShell>
      <div style={{ padding: "32px 32px", maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.4px" }}>Tracking</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>KPIs, Ads-Anbindung und Kampagnen-Tools</div>
          </div>
          <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer" }}>
            <option value="">Alle Kunden</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* KPI-Zeile */}
        {loading ? (
          <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24 }}>Lädt…</div>
        ) : (
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <KpiCard label="Leads gesamt" value={total} sub={selectedClientId ? clients.find(c => c.id === selectedClientId)?.name : "alle Kunden"} color="#e11d48" />
            <KpiCard label="Hot Leads ≥6" value={hot} sub={`${total > 0 ? Math.round(hot / total * 100) : 0}% des Gesamt`} color="#f59e0b" />
            <KpiCard label="Conversion Rate" value={convRate + "%"} sub={`${gewonnen} gewonnen`} color="#059669" />
          </div>
        )}

        {/* Ads-Platzhalter */}
        <div style={{ background: "#f9fafb", border: "1.5px dashed #e5e7eb", borderRadius: 14, padding: "28px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 36, flexShrink: 0 }}>📊</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>Meta & Google Ads</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
              Spend, Impressionen, Klicks und Leads direkt aus Meta und Google — kommt in <strong>Phase 4</strong> via Windsor.ai.<br />
              Die Tabelle <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>ad_metrics</code> wird dann hier befüllt.
            </div>
          </div>
        </div>

        {/* UTM-Generator */}
        <UtmGenerator />
      </div>
    </AppShell>
  );
}
