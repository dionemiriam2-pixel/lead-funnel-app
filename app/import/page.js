"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { authHeaders } from "@/lib/api";

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
  });
}

export default function ImportPage() {
  const [tab, setTab] = useState("csv");
  const [csv, setCsv] = useState("");
  const [client, setClient] = useState("");
  const [source, setSource] = useState("csv-import");
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    const pw = localStorage.getItem("lf_auth_pw") || "DEIN_PASSWORT";
    setWebhookUrl(window.location.origin + "/api/webhook?key=" + pw);
  }, []);

  function onFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCsv(ev.target.result); setPreview(parseCSV(ev.target.result).slice(0, 5)); };
    reader.readAsText(file);
  }

  async function doImport() {
    const rows = parseCSV(csv);
    if (!rows.length) return;
    setImporting(true);
    const r = await fetch("/api/import", { method: "POST", headers: authHeaders(), body: JSON.stringify({ rows, client, source }) });
    const d = await r.json();
    setResult(d);
    setImporting(false);
  }

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", margin: "0 0 4px" }}>📥 Import & Integrationen</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Leads aus anderen Tools importieren oder automatisch einspeisen</p>

        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", marginBottom: 24 }}>
          {[["csv", "📊 CSV-Import"], ["webhook", "🔗 Webhook (n8n / Make)"], ["sources", "📋 Alle Quellen"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding: "10px 18px", border: "none", background: "none", borderBottom: tab === k ? "2px solid #6366f1" : "2px solid transparent", color: tab === k ? "#6366f1" : "#6b7280", fontWeight: tab === k ? 700 : 400, cursor: "pointer", fontSize: 14, marginBottom: -1 }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "csv" && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>CSV-Datei hochladen</h2>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Spalten: <code>company_name, email, phone, city, website, industry, notes</code></p>
              <input type="file" accept=".csv,.txt" onChange={onFile} style={{ marginBottom: 14 }} />
              {preview.length > 0 && (
                <div style={{ marginBottom: 14, overflowX: "auto" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Vorschau (erste 5 Zeilen):</div>
                  <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr>{Object.keys(preview[0]).map(k => <th key={k} style={{ padding: "4px 8px", background: "#f9fafb", border: "1px solid #e5e7eb" }}>{k}</th>)}</tr></thead>
                    <tbody>{preview.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j} style={{ padding: "4px 8px", border: "1px solid #f3f4f6" }}>{v}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>Für Kunden (optional)</label>
                  <input value={client} onChange={e => setClient(e.target.value)} placeholder="z.B. KOMIKO"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>Quelle</label>
                  <input value={source} onChange={e => setSource(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <button onClick={doImport} disabled={!preview.length || importing}
                style={{ padding: "10px 22px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {importing ? "⏳ Importiere…" : `${parseCSV(csv).length} Leads importieren`}
              </button>
              {result && <div style={{ marginTop: 12, color: result.ok ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{result.ok ? `✓ ${result.imported} Leads importiert!` : "Fehler: " + result.error}</div>}
            </div>
          </div>
        )}

        {tab === "webhook" && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,.06)", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Webhook-URL</h2>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>In n8n, Make oder Zapier eintragen — jeder POST wird als Lead gespeichert.</p>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 16px", fontFamily: "monospace", fontSize: 13, wordBreak: "break-all", border: "1px solid #e5e7eb", marginBottom: 16 }}>{webhookUrl}</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>JSON-Felder:</h3>
              <pre style={{ background: "#f9fafb", borderRadius: 10, padding: 16, fontSize: 12, overflowX: "auto", border: "1px solid #e5e7eb" }}>{`{
  "company_name": "Musterfirma GmbH",
  "email": "info@musterfirma.de",
  "phone": "+49 89 123456",
  "city": "München",
  "website": "https://musterfirma.de",
  "industry": "Gastronomie",
  "source": "facebook-ads",
  "client": "KOMIKO",
  "product": "Ladenbau",
  "score": 8,
  "notes": "Hat Interesse gezeigt"
}`}</pre>
            </div>
            <div style={{ background: "#eff6ff", borderRadius: 16, padding: 20, border: "1px solid #bfdbfe" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#1d4ed8" }}>💡 n8n Tipp:</h3>
              <p style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.6 }}>HTTP Request Node → Method: POST → URL: obige Webhook-URL → Body: JSON.<br />Funktioniert mit Facebook Lead Ads, LinkedIn, Google Ads, Typeform, Calendly und mehr.</p>
            </div>
          </div>
        )}

        {tab === "sources" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { icon: "🤖", name: "Google Maps Bot", status: "Aktiv", color: "#22c55e", desc: "Sucht täglich um 07:00 Uhr automatisch. Manuell auslösbar." },
              { icon: "📄", name: "Landing Pages", status: "Aktiv", color: "#22c55e", desc: "3 Landing Pages live. Formular → Lead direkt in Supabase." },
              { icon: "🔗", name: "Webhook", status: "Bereit", color: "#f59e0b", desc: "URL oben eintragen in n8n oder Make." },
              { icon: "📊", name: "CSV-Import", status: "Bereit", color: "#f59e0b", desc: "CSV hochladen und Leads manuell importieren." },
              { icon: "📱", name: "Facebook Lead Ads", status: "Via Webhook", color: "#6366f1", desc: "In n8n: Facebook Lead Ads Trigger → Webhook-URL." },
              { icon: "💼", name: "LinkedIn", status: "Via Webhook", color: "#6366f1", desc: "Sales Navigator Export als CSV oder via n8n Webhook." },
              { icon: "📒", name: "Gelbe Seiten Bot", status: "Geplant", color: "#9ca3af", desc: "Zweite Bot-Quelle. In Entwicklung." },
              { icon: "🔍", name: "Google Suche Bot", status: "Geplant", color: "#9ca3af", desc: "Firmen-Websites aus Google-Suche. In Entwicklung." },
              { icon: "📧", name: "E-Mail Weiterleitung", status: "Via n8n", color: "#6366f1", desc: "Lead-Anfragen per E-Mail über n8n einlesen." },
              { icon: "✍️", name: "Manuelle Eingabe", status: "Im Dashboard", color: "#22c55e", desc: "Lead direkt im Dashboard anlegen — jederzeit." },
            ].map(s => (
              <div key={s.name} style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{s.name}</h3>
                  <span style={{ background: s.color + "22", color: s.color, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{s.status}</span>
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
