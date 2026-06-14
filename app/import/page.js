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
  const [tab, setTab] = useState("maps");
  const [csv, setCsv] = useState("");
  const [client, setClient] = useState("");
  const [source, setSource] = useState("csv-import");
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  // Google Maps Bot state
  const [terms, setTerms] = useState([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [newTerm, setNewTerm] = useState({ term: "", location: "", industry: "", max_results: 20 });
  const [addingTerm, setAddingTerm] = useState(false);
  const [botMsg, setBotMsg] = useState("");
  const [botRunning, setBotRunning] = useState(false);

  useEffect(() => {
    const pw = localStorage.getItem("lf_auth_pw") || "DEIN_PASSWORT";
    setWebhookUrl(window.location.origin + "/api/webhook?key=" + pw);
  }, []);

  useEffect(() => {
    if (tab === "maps") loadTerms();
  }, [tab]);

  async function loadTerms() {
    setTermsLoading(true);
    const r = await fetch("/api/search-terms", { headers: authHeaders() });
    const d = await r.json();
    setTerms(d.data || []);
    setTermsLoading(false);
  }

  async function addTerm() {
    if (!newTerm.term.trim()) return;
    setAddingTerm(true);
    const r = await fetch("/api/search-terms", { method: "POST", headers: authHeaders(), body: JSON.stringify(newTerm) });
    const d = await r.json();
    if (d.ok) {
      setNewTerm({ term: "", location: "", industry: "", max_results: 20 });
      await loadTerms();
    }
    setAddingTerm(false);
  }

  async function deleteTerm(id) {
    if (!confirm("Suchauftrag löschen?")) return;
    await fetch("/api/search-terms?id=" + id, { method: "DELETE", headers: authHeaders() });
    await loadTerms();
  }

  async function runBot() {
    setBotRunning(true);
    setBotMsg("");
    try {
      const r = await fetch("/api/run-bot", { method: "POST", headers: authHeaders() });
      const d = await r.json();
      if (d.ok) setBotMsg("✓ Bot wurde gestartet! Neue Leads erscheinen in wenigen Minuten im Dashboard.");
      else setBotMsg("Fehler: " + (d.error || "Unbekannt"));
    } catch {
      setBotMsg("Fehler beim Starten des Bots.");
    }
    setBotRunning(false);
  }

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
          {[["maps", "🗺️ Google Maps Bot"], ["csv", "📊 CSV-Import"], ["webhook", "🔗 Webhook (n8n / Make)"], ["sources", "📋 Alle Quellen"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding: "10px 18px", border: "none", background: "none", borderBottom: tab === k ? "2px solid #6366f1" : "2px solid transparent", color: tab === k ? "#6366f1" : "#6b7280", fontWeight: tab === k ? 700 : 400, cursor: "pointer", fontSize: 14, marginBottom: -1 }}>
              {l}
            </button>
          ))}
        </div>

        {/* GOOGLE MAPS BOT */}
        {tab === "maps" && (
          <div style={{ maxWidth: 800 }}>
            {/* Bot starten Card */}
            <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderRadius: 16, padding: 24, marginBottom: 20, color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🤖</div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Google Maps Bot</h2>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Sucht täglich um 07:00 Uhr automatisch. Du kannst ihn auch manuell starten.</p>
                </div>
                <button onClick={runBot} disabled={botRunning}
                  style={{ padding: "12px 24px", background: botRunning ? "#374151" : "#6366f1", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: botRunning ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                  {botRunning ? "⏳ Startet…" : "▶ Bot jetzt starten"}
                </button>
              </div>
              {botMsg && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: botMsg.startsWith("✓") ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)", borderRadius: 8, fontSize: 13, color: botMsg.startsWith("✓") ? "#86efac" : "#fca5a5" }}>
                  {botMsg}
                </div>
              )}
              <div style={{ marginTop: 14, display: "flex", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#a5b4fc" }}>{terms.length}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Suchaufträge</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#86efac" }}>07:00</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Nächster Lauf</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fcd34d" }}>täglich</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Frequenz</div>
                </div>
              </div>
            </div>

            {/* Neuer Suchauftrag */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 22, marginBottom: 20, boxShadow: "0 1px 8px rgba(0,0,0,.06)", border: "2px dashed #e5e7eb" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#1a1a2e" }}>+ Neuer Suchauftrag</h3>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 12, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>Suchbegriff *</label>
                  <input
                    value={newTerm.term}
                    onChange={e => setNewTerm(t => ({ ...t, term: e.target.value }))}
                    placeholder="z.B. Restaurant, Ladenbau, Friseur"
                    onKeyDown={e => e.key === "Enter" && addTerm()}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>Stadt / Region</label>
                  <input
                    value={newTerm.location}
                    onChange={e => setNewTerm(t => ({ ...t, location: e.target.value }))}
                    placeholder="z.B. München"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>Branche</label>
                  <input
                    value={newTerm.industry}
                    onChange={e => setNewTerm(t => ({ ...t, industry: e.target.value }))}
                    placeholder="z.B. Gastronomie"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>Max</label>
                  <input
                    type="number"
                    value={newTerm.max_results}
                    onChange={e => setNewTerm(t => ({ ...t, max_results: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>
              <button onClick={addTerm} disabled={addingTerm || !newTerm.term.trim()}
                style={{ marginTop: 14, padding: "10px 22px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: addingTerm ? "not-allowed" : "pointer" }}>
                {addingTerm ? "⏳ Speichern…" : "Suchauftrag hinzufügen"}
              </button>
            </div>

            {/* Suchaufträge Liste */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,.06)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
                  Aktive Suchaufträge <span style={{ color: "#6b7280", fontWeight: 400 }}>({terms.length})</span>
                </h3>
                <button onClick={loadTerms} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  ↻ Aktualisieren
                </button>
              </div>
              {termsLoading ? (
                <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>Lade Suchaufträge…</div>
              ) : terms.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Noch keine Suchaufträge</div>
                  <div style={{ fontSize: 13 }}>Trage oben einen Suchbegriff ein — der Bot sucht dann automatisch passende Firmen auf Google Maps.</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Suchbegriff", "Stadt / Region", "Branche", "Kunde", "Max. Ergebnisse", "Erstellt", ""].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {terms.map(t => (
                      <tr key={t.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1a1a2e" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                            {t.term}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{t.location || "–"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>
                          {t.industry ? <span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 999, fontSize: 12 }}>{t.industry}</span> : "–"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{t.client || "–"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280", textAlign: "center" }}>{t.max_results || 20}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#9ca3af" }}>
                          {t.created_at ? new Date(t.created_at).toLocaleDateString("de-DE") : "–"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button onClick={() => deleteTerm(t.id)}
                            style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 16, padding: "2px 6px" }}
                            title="Löschen">
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: 16, padding: 16, background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe" }}>
              <p style={{ fontSize: 13, color: "#1d4ed8", margin: 0, lineHeight: 1.6 }}>
                💡 <strong>So funktioniert es:</strong> Der Bot liest diese Suchbegriffe aus der Datenbank und sucht auf Google Maps nach passenden Firmen. Gefundene Firmen werden automatisch als Leads mit Quelle "google-maps" ins Dashboard eingetragen. Du kannst auch über <strong>Kunden → Produkte → Analyse starten</strong> automatisch passende Suchbegriffe generieren lassen.
              </p>
            </div>
          </div>
        )}

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
              { icon: "🤖", name: "Google Maps Bot", status: "Aktiv", color: "#22c55e", desc: "Sucht täglich um 07:00 Uhr automatisch. Manuell auslösbar.", link: "maps" },
              { icon: "📄", name: "Landing Pages", status: "Aktiv", color: "#22c55e", desc: "3 Landing Pages live. Formular → Lead direkt in Supabase." },
              { icon: "🔗", name: "Webhook", status: "Bereit", color: "#f59e0b", desc: "URL oben eintragen in n8n oder Make.", link: "webhook" },
              { icon: "📊", name: "CSV-Import", status: "Bereit", color: "#f59e0b", desc: "CSV hochladen und Leads manuell importieren.", link: "csv" },
              { icon: "📱", name: "Facebook Lead Ads", status: "Via Webhook", color: "#6366f1", desc: "In n8n: Facebook Lead Ads Trigger → Webhook-URL." },
              { icon: "💼", name: "LinkedIn", status: "Via Webhook", color: "#6366f1", desc: "Sales Navigator Export als CSV oder via n8n Webhook." },
              { icon: "📒", name: "Gelbe Seiten Bot", status: "Geplant", color: "#9ca3af", desc: "Zweite Bot-Quelle. In Entwicklung." },
              { icon: "🔍", name: "Google Suche Bot", status: "Geplant", color: "#9ca3af", desc: "Firmen-Websites aus Google-Suche. In Entwicklung." },
              { icon: "📧", name: "E-Mail Weiterleitung", status: "Via n8n", color: "#6366f1", desc: "Lead-Anfragen per E-Mail über n8n einlesen." },
              { icon: "✍️", name: "Manuelle Eingabe", status: "Im Dashboard", color: "#22c55e", desc: "Lead direkt im Dashboard anlegen — jederzeit." },
            ].map(s => (
              <div key={s.name} onClick={() => s.link && setTab(s.link)}
                style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 8px rgba(0,0,0,.06)", cursor: s.link ? "pointer" : "default", border: s.link ? "1px solid #e5e7eb" : "none" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{s.name}</h3>
                  <span style={{ background: s.color + "22", color: s.color, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{s.status}</span>
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{s.desc}</p>
                {s.link && <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginTop: 8 }}>→ öffnen</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
