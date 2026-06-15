"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { authHeaders } from "@/lib/api";
import { Upload, MapPin, BarChart2, Link2, List, Bot, Search, Trash2, Info, Play, FileText, Globe, Mail, Linkedin, PenLine } from "lucide-react";

function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
  });
}

const inp = { width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--ink)", background: "var(--surface)", boxSizing: "border-box", fontFamily: "inherit" };
const lbl = { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".05em" };
const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 };

const SOURCES_LIST = [
  { Icon: Bot,      name: "Google Maps Bot",       status: "Aktiv",         desc: "Sucht täglich um 07:00 Uhr automatisch. Manuell auslösbar.",      link: "maps" },
  { Icon: Globe,    name: "Landing Pages",          status: "Aktiv",         desc: "3 Landing Pages live. Formular → Lead direkt in Supabase." },
  { Icon: Link2,    name: "Webhook",                status: "Bereit",        desc: "URL oben eintragen in n8n oder Make.",                             link: "webhook" },
  { Icon: BarChart2,name: "CSV-Import",             status: "Bereit",        desc: "CSV hochladen und Leads manuell importieren.",                     link: "csv" },
  { Icon: FileText, name: "Facebook Lead Ads",      status: "Via Webhook",   desc: "In n8n: Facebook Lead Ads Trigger → Webhook-URL." },
  { Icon: Link2,    name: "LinkedIn",               status: "Via Webhook",   desc: "Sales Navigator Export als CSV oder via n8n Webhook." },
  { Icon: List,     name: "Gelbe Seiten Bot",       status: "Geplant",       desc: "Zweite Bot-Quelle. In Entwicklung." },
  { Icon: Search,   name: "Google Suche Bot",       status: "Geplant",       desc: "Firmen-Websites aus Google-Suche. In Entwicklung." },
  { Icon: Mail,     name: "E-Mail Weiterleitung",   status: "Via n8n",       desc: "Lead-Anfragen per E-Mail über n8n einlesen." },
  { Icon: PenLine,  name: "Manuelle Eingabe",       status: "Im Dashboard",  desc: "Lead direkt im Dashboard anlegen — jederzeit." },
];

export default function ImportPage() {
  const [tab, setTab] = useState("maps");
  const [csv, setCsv] = useState("");
  const [client, setClient] = useState("");
  const [source, setSource] = useState("csv-import");
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState("");

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

  const TABS = [
    { key: "maps",    Icon: MapPin,    label: "Google Maps Bot" },
    { key: "csv",     Icon: BarChart2, label: "CSV-Import" },
    { key: "webhook", Icon: Link2,     label: "Webhook (n8n / Make)" },
    { key: "sources", Icon: List,      label: "Alle Quellen" },
  ];

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Upload size={20} strokeWidth={1.5} color="var(--text-secondary)" />
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0 }}>Import & Integrationen</h1>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24 }}>Leads aus anderen Tools importieren oder automatisch einspeisen</p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
          {TABS.map(({ key, Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", border: "none", background: "none", borderBottom: tab === key ? "2px solid var(--ink)" : "2px solid transparent", color: tab === key ? "var(--ink)" : "var(--text-secondary)", fontWeight: tab === key ? 600 : 400, cursor: "pointer", fontSize: 13, marginBottom: -1, fontFamily: "inherit" }}>
              <Icon size={14} strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>

        {/* GOOGLE MAPS BOT */}
        {tab === "maps" && (
          <div style={{ maxWidth: 800 }}>
            {/* Bot-Card */}
            <div style={{ ...card, padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Bot size={28} strokeWidth={1.5} color="var(--ink)" />
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: "0 0 3px" }}>Google Maps Bot</h2>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Sucht täglich um 07:00 Uhr automatisch. Du kannst ihn auch manuell starten.</p>
                  </div>
                </div>
                <button onClick={runBot} disabled={botRunning}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", background: botRunning ? "var(--text-tertiary)" : "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: botRunning ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>
                  <Play size={13} strokeWidth={1.5} />
                  {botRunning ? "Startet…" : "Bot starten"}
                </button>
              </div>
              {botMsg && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: botMsg.startsWith("✓") ? "var(--ink)" : "var(--accent)" }}>
                  {botMsg}
                </div>
              )}
              <div style={{ marginTop: 16, display: "flex", gap: 24, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500, color: "var(--ink)" }}>{terms.length}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".06em" }}>Suchaufträge</div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500, color: "var(--ink)" }}>07:00</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".06em" }}>Nächster Lauf</div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 500, color: "var(--ink)" }}>täglich</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".06em" }}>Frequenz</div>
                </div>
              </div>
            </div>

            {/* Neuer Suchauftrag */}
            <div style={{ ...card, border: "1px dashed var(--border)", padding: 22, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>+ Neuer Suchauftrag</h3>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 12, alignItems: "end" }}>
                <div>
                  <label style={lbl}>Suchbegriff *</label>
                  <input value={newTerm.term} onChange={e => setNewTerm(t => ({ ...t, term: e.target.value }))}
                    placeholder="z.B. Restaurant, Ladenbau, Friseur"
                    onKeyDown={e => e.key === "Enter" && addTerm()}
                    style={inp} />
                </div>
                <div>
                  <label style={lbl}>Stadt / Region</label>
                  <input value={newTerm.location} onChange={e => setNewTerm(t => ({ ...t, location: e.target.value }))}
                    placeholder="z.B. München" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Branche</label>
                  <input value={newTerm.industry} onChange={e => setNewTerm(t => ({ ...t, industry: e.target.value }))}
                    placeholder="z.B. Gastronomie" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Max</label>
                  <input type="number" value={newTerm.max_results} onChange={e => setNewTerm(t => ({ ...t, max_results: e.target.value }))} style={inp} />
                </div>
              </div>
              <button onClick={addTerm} disabled={addingTerm || !newTerm.term.trim()}
                style={{ marginTop: 14, padding: "10px 22px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: addingTerm ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {addingTerm ? "Speichern…" : "Suchauftrag hinzufügen"}
              </button>
            </div>

            {/* Suchaufträge Liste */}
            <div style={card}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                  Aktive Suchaufträge <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>({terms.length})</span>
                </h3>
                <button onClick={loadTerms} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                  ↻ Aktualisieren
                </button>
              </div>
              {termsLoading ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>Lade Suchaufträge…</div>
              ) : terms.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>
                  <Search size={28} strokeWidth={1.5} color="var(--border)" style={{ marginBottom: 10 }} />
                  <div style={{ fontWeight: 500, marginBottom: 6, color: "var(--ink)" }}>Noch keine Suchaufträge</div>
                  <div style={{ fontSize: 13 }}>Trage oben einen Suchbegriff ein — der Bot sucht dann automatisch passende Firmen auf Google Maps.</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Suchbegriff", "Stadt / Region", "Branche", "Kunde", "Max.", "Erstellt", ""].map(h => (
                        <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {terms.map(t => (
                      <tr key={t.id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "11px 14px", fontWeight: 500, color: "var(--ink)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ink)", display: "inline-block" }} />
                            {t.term}
                          </span>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{t.location || "–"}</td>
                        <td style={{ padding: "11px 14px", fontSize: 13 }}>
                          {t.industry ? <span style={{ background: "var(--border)", padding: "2px 8px", borderRadius: 999, fontSize: 12, color: "var(--text-secondary)" }}>{t.industry}</span> : "–"}
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{t.client || "–"}</td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>{t.max_results || 20}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-tertiary)" }}>
                          {t.created_at ? new Date(t.created_at).toLocaleDateString("de-DE") : "–"}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <button onClick={() => deleteTerm(t.id)}
                            style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center" }}
                            title="Löschen">
                            <Trash2 size={15} strokeWidth={1.5} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: 14, padding: 16, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Info size={15} strokeWidth={1.5} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                <strong>So funktioniert es:</strong> Der Bot liest diese Suchbegriffe aus der Datenbank und sucht auf Google Maps nach passenden Firmen. Gefundene Firmen werden automatisch als Leads mit Quelle "google-maps" ins Dashboard eingetragen. Du kannst auch über <strong>Kunden → Produkte → Analyse starten</strong> automatisch passende Suchbegriffe generieren lassen.
              </p>
            </div>
          </div>
        )}

        {/* CSV */}
        {tab === "csv" && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ ...card, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>CSV-Datei hochladen</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>Spalten: <code style={{ background: "var(--border)", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>company_name, email, phone, city, website, industry, notes</code></p>
              <input type="file" accept=".csv,.txt" onChange={onFile} style={{ marginBottom: 14 }} />
              {preview.length > 0 && (
                <div style={{ marginBottom: 14, overflowX: "auto" }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Vorschau (erste 5 Zeilen):</div>
                  <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr>{Object.keys(preview[0]).map(k => <th key={k} style={{ padding: "4px 8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>{k}</th>)}</tr></thead>
                    <tbody>{preview.map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j} style={{ padding: "4px 8px", border: "1px solid var(--border)", color: "var(--ink)" }}>{v}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Für Kunden (optional)</label>
                  <input value={client} onChange={e => setClient(e.target.value)} placeholder="z.B. KOMIKO" style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Quelle</label>
                  <input value={source} onChange={e => setSource(e.target.value)} style={inp} />
                </div>
              </div>
              <button onClick={doImport} disabled={!preview.length || importing}
                style={{ padding: "10px 22px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                {importing ? "Importiere…" : `${parseCSV(csv).length} Leads importieren`}
              </button>
              {result && (
                <div style={{ marginTop: 12, fontWeight: 600, fontSize: 13, color: result.ok ? "var(--ink)" : "var(--accent)" }}>
                  {result.ok ? `✓ ${result.imported} Leads importiert!` : "Fehler: " + result.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WEBHOOK */}
        {tab === "webhook" && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ ...card, padding: 24, marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Webhook-URL</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>In n8n, Make oder Zapier eintragen — jeder POST wird als Lead gespeichert.</p>
              <div style={{ background: "var(--bg)", borderRadius: 8, padding: "12px 14px", fontFamily: "monospace", fontSize: 13, wordBreak: "break-all", border: "1px solid var(--border)", marginBottom: 16, color: "var(--ink)" }}>{webhookUrl}</div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>JSON-Felder:</h3>
              <pre style={{ background: "var(--bg)", borderRadius: 8, padding: 16, fontSize: 12, overflowX: "auto", border: "1px solid var(--border)", color: "var(--ink)" }}>{`{
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
            <div style={{ ...card, padding: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Info size={15} strokeWidth={1.5} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>n8n Tipp</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>HTTP Request Node → Method: POST → URL: obige Webhook-URL → Body: JSON.<br />Funktioniert mit Facebook Lead Ads, LinkedIn, Google Ads, Typeform, Calendly und mehr.</p>
              </div>
            </div>
          </div>
        )}

        {/* SOURCES */}
        {tab === "sources" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {SOURCES_LIST.map(s => (
              <div key={s.name} onClick={() => s.link && setTab(s.link)}
                style={{ ...card, padding: 18, cursor: s.link ? "pointer" : "default" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <s.Icon size={20} strokeWidth={1.5} color="var(--text-secondary)" />
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "var(--border)", color: "var(--text-secondary)" }}>
                    {s.status}
                  </span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "0 0 6px" }}>{s.name}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                {s.link && <div style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500, marginTop: 10 }}>→ öffnen</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
