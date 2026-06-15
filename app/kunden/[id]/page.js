"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { apiFetch, authHeaders } from "@/lib/api";

const TABS = ["Profil", "🎯 Strategie", "Produkte", "Leads"];

const SOURCES = [
  { key: "google-maps", icon: "🗺️", label: "Google Maps Bot", desc: "Findet Firmen automatisch täglich" },
  { key: "linkedin", icon: "💼", label: "LinkedIn", desc: "Sales Navigator, Suche, Gruppen" },
  { key: "facebook", icon: "📱", label: "Facebook / Instagram", desc: "Lead Ads, Gruppen, DMs" },
  { key: "google-ads", icon: "🔍", label: "Google Ads", desc: "Suchanzeigen, Display" },
  { key: "gelbe-seiten", icon: "📒", label: "Gelbe Seiten", desc: "Branchenverzeichnis" },
  { key: "csv", icon: "📊", label: "CSV / eigene Liste", desc: "Kontakte selbst hochladen" },
];

const CHANNELS = [
  { key: "ads",        icon: "🎯", label: "Custom Audience Ads",  desc: "Kontakte bei Meta/Google hochladen" },
  { key: "email",      icon: "📧", label: "E-Mail",               desc: "KI schreibt personalisiertes Angebot" },
  { key: "linkedin",   icon: "💼", label: "LinkedIn",             desc: "DM, Vernetzung + Follow-up" },
  { key: "facebook",   icon: "📱", label: "Facebook / Instagram", desc: "Lead Ads, DMs, Custom Audience" },
  { key: "google-ads", icon: "🔍", label: "Google Ads",           desc: "Suchanzeigen und Display" },
  { key: "phone",      icon: "📞", label: "Telefonakquise",       desc: "Direkt anrufen — legal im B2B" },
];

const OUTREACH_OPTIONS = {
  "google-maps": [
    { key: "ads", icon: "🎯", label: "Custom Audience Ads", desc: "Kontakte bei Meta/Google hochladen → Firma sieht deine Werbung" },
    { key: "email", icon: "📧", label: "E-Mail (KI)", desc: "KI schreibt personalisiertes Angebot automatisch" },
    { key: "phone", icon: "📞", label: "Telefonakquise", desc: "Direkt anrufen — 100% legal im B2B" },
  ],
  "linkedin": [
    { key: "dm", icon: "💬", label: "LinkedIn DM", desc: "Persönliche Nachricht direkt auf LinkedIn" },
    { key: "ads", icon: "🎯", label: "LinkedIn Ads", desc: "Gesponsorte Inhalte, InMail Ads" },
    { key: "connect", icon: "🤝", label: "Vernetzung + Follow-up", desc: "Vernetzen, dann nach 3 Tagen anschreiben" },
  ],
  "facebook": [
    { key: "ads", icon: "🎯", label: "Custom Audience Ads", desc: "Kontakte hochladen, Anzeigen ausspielen" },
    { key: "lead-ads", icon: "📋", label: "Lead Ads", desc: "Formular direkt in Facebook — Leads kommen automatisch rein" },
    { key: "dm", icon: "💬", label: "Facebook / Instagram DM", desc: "Direktnachricht an die Firma" },
  ],
  "google-ads": [
    { key: "ads", icon: "🎯", label: "Suchanzeigen", desc: "Erscheinen wenn jemand nach deiner Leistung sucht" },
    { key: "display", icon: "🖼️", label: "Display Ads", desc: "Banner auf Websites im Google Netzwerk" },
    { key: "remarketing", icon: "🔄", label: "Remarketing", desc: "Kontakte die Website besucht haben erneut ansprechen" },
  ],
  "gelbe-seiten": [
    { key: "email", icon: "📧", label: "E-Mail (KI)", desc: "KI schreibt personalisiertes Angebot" },
    { key: "phone", icon: "📞", label: "Telefonakquise", desc: "Direkt anrufen" },
    { key: "ads", icon: "🎯", label: "Custom Audience Ads", desc: "Kontakte bei Meta hochladen" },
  ],
  "csv": [
    { key: "email", icon: "📧", label: "E-Mail (KI)", desc: "KI schreibt personalisiertes Angebot" },
    { key: "ads", icon: "🎯", label: "Custom Audience Ads", desc: "Liste direkt bei Meta/Google hochladen" },
    { key: "phone", icon: "📞", label: "Telefonakquise", desc: "Liste durcharbeiten, anrufen" },
  ],
};

export default function KundeDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tab, setTab] = useState("Profil");
  const [form, setForm] = useState({});
  const [newProd, setNewProd] = useState({ name: "", description: "", target_groups: "", keywords: "", region: "", offer: "" });
  const [analysis, setAnalysis] = useState({});
  const [analysing, setAnalysing] = useState(null);
  const [msg, setMsg] = useState("");
  const [stratStep, setStratStep] = useState(1);

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

  if (!client) return <AppShell><div style={{ padding: 40, color: "#6b7280" }}>Lade…</div></AppShell>;

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <a href="/kunden" style={{ color: "#6b7280", textDecoration: "none", fontSize: 13 }}>← Kunden</a>
          <span style={{ color: "#d1d5db" }}>/</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>{client.name}</h1>
        </div>

        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "10px 18px", border: "none", background: "none", borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent", color: tab === t ? "#6366f1" : "#6b7280", fontWeight: tab === t ? 700 : 400, cursor: "pointer", fontSize: 14, marginBottom: -1 }}>
              {t}
            </button>
          ))}
        </div>

        {/* PROFIL */}
        {tab === "Profil" && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,.06)", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[["name", "Firmenname"], ["website", "Website"], ["region", "Region"], ["contact", "Ansprechpartner"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>{l}</label>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                ))}
                {[["description", "Was bietet der Kunde an?"], ["usp", "Was macht ihn besonders? (USP)"]].map(([k, l]) => (
                  <div key={k} style={{ gridColumn: "1/-1" }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>{l}</label>
                    <textarea value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} rows={3}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={saveClient}
                  style={{ padding: "10px 22px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Speichern
                </button>
                {msg && <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>{msg}</span>}
              </div>
            </div>

            {/* KANAL-KACHELN */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>📣 Outreach-Kanäle</h3>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>Welche Kanäle nutzt du für diesen Kunden? Aktive Kanäle erscheinen bei jedem Lead.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {CHANNELS.map(ch => {
                  const active = form.channels?.[ch.key] ?? false;
                  return (
                    <div key={ch.key}
                      onClick={() => setForm(f => ({ ...f, channels: { ...(f.channels || {}), [ch.key]: !active } }))}
                      style={{ padding: "14px 12px", borderRadius: 12, border: `2px solid ${active ? "#6366f1" : "#e5e7eb"}`, background: active ? "#f5f3ff" : "#fafafa", cursor: "pointer", transition: "all .15s", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{ch.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: active ? "#4338ca" : "#1a1a2e", marginBottom: 3 }}>{ch.label}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>{ch.desc}</div>
                      {active && <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: "#6366f1" }}>✓ Aktiv</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={saveChannels}
                  style={{ padding: "10px 22px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Kanäle speichern
                </button>
                {msg && <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>{msg}</span>}
              </div>
            </div>
          </div>
        )}

        {/* STRATEGIE */}
        {tab === "🎯 Strategie" && (() => {
          const strat = form.strategy || {};
          const selectedSources = strat.sources || [];
          const selectedOutreach = strat.outreach || {};
          const allDone = selectedSources.length > 0 && selectedSources.every(s => (selectedOutreach[s] || []).length > 0);

          function toggleSource(key) {
            const next = selectedSources.includes(key) ? selectedSources.filter(s => s !== key) : [...selectedSources, key];
            const newStrat = { ...strat, sources: next };
            setForm(f => ({ ...f, strategy: newStrat }));
          }

          function toggleOutreach(sourceKey, outKey) {
            const cur = selectedOutreach[sourceKey] || [];
            const next = cur.includes(outKey) ? cur.filter(o => o !== outKey) : [...cur, outKey];
            const newStrat = { ...strat, outreach: { ...selectedOutreach, [sourceKey]: next } };
            setForm(f => ({ ...f, strategy: newStrat }));
          }

          return (
            <div style={{ maxWidth: 780 }}>
              {/* Fortschrittsleiste */}
              <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
                {[1, 2, 3].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", flex: s < 3 ? 1 : 0 }}>
                    <div onClick={() => setStratStep(s)} style={{ width: 36, height: 36, borderRadius: "50%", background: stratStep >= s ? "#6366f1" : "#e5e7eb", color: stratStep >= s ? "#fff" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
                      {stratStep > s ? "✓" : s}
                    </div>
                    <div style={{ marginLeft: 10, marginRight: s < 3 ? 0 : 0, flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: stratStep >= s ? "#4338ca" : "#9ca3af" }}>{["Quellen", "Kontakt-Wege", "Dein Plan"][i]}</div>
                    </div>
                    {s < 3 && <div style={{ flex: 1, height: 2, background: stratStep > s ? "#6366f1" : "#e5e7eb", margin: "0 12px" }} />}
                  </div>
                ))}
              </div>

              {/* STUFE 1 — Quellen */}
              {stratStep === 1 && (
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>Wo findest du die Kontakte?</h2>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Wähle alle Plattformen und Tools aus, über die du für <strong>{client.name}</strong> Leads sammeln möchtest.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {SOURCES.map(src => {
                      const on = selectedSources.includes(src.key);
                      return (
                        <div key={src.key} onClick={() => toggleSource(src.key)}
                          style={{ padding: "16px 18px", borderRadius: 14, border: `2px solid ${on ? "#6366f1" : "#e5e7eb"}`, background: on ? "#f5f3ff" : "#fff", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start", transition: "all .15s" }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${on ? "#6366f1" : "#d1d5db"}`, background: on ? "#6366f1" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                            {on && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
                          </div>
                          <div>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{src.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: on ? "#4338ca" : "#1a1a2e" }}>{src.label}</div>
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{src.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => setStratStep(2)} disabled={selectedSources.length === 0}
                    style={{ marginTop: 20, padding: "11px 28px", background: selectedSources.length > 0 ? "#6366f1" : "#e5e7eb", color: selectedSources.length > 0 ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: selectedSources.length > 0 ? "pointer" : "not-allowed" }}>
                    Weiter → Kontakt-Wege wählen
                  </button>
                </div>
              )}

              {/* STUFE 2 — Outreach pro Quelle */}
              {stratStep === 2 && (
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>Wie kontaktierst du sie?</h2>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Pro Plattform: welche Wege nutzt du um die Kontakte zu erreichen?</p>
                  {selectedSources.map(srcKey => {
                    const src = SOURCES.find(s => s.key === srcKey);
                    const options = OUTREACH_OPTIONS[srcKey] || [];
                    const chosen = selectedOutreach[srcKey] || [];
                    return (
                      <div key={srcKey} style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 1px 8px rgba(0,0,0,.06)", border: "1px solid #f3f4f6" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                          <span style={{ fontSize: 20 }}>{src.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{src.label}</span>
                          {chosen.length > 0 && <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{chosen.length} gewählt</span>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {options.map(opt => {
                            const on = chosen.includes(opt.key);
                            return (
                              <div key={opt.key} onClick={() => toggleOutreach(srcKey, opt.key)}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${on ? "#6366f1" : "#e5e7eb"}`, background: on ? "#f5f3ff" : "#fafafa", cursor: "pointer" }}>
                                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${on ? "#6366f1" : "#d1d5db"}`, background: on ? "#6366f1" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  {on && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                                </div>
                                <span style={{ fontSize: 16 }}>{opt.icon}</span>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: on ? "#4338ca" : "#1a1a2e" }}>{opt.label}</div>
                                  <div style={{ fontSize: 12, color: "#6b7280" }}>{opt.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button onClick={() => setStratStep(1)} style={{ padding: "11px 20px", background: "#f3f4f6", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#6b7280" }}>← Zurück</button>
                    <button onClick={() => { saveClient(); setStratStep(3); }} disabled={!allDone}
                      style={{ padding: "11px 28px", background: allDone ? "#6366f1" : "#e5e7eb", color: allDone ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: allDone ? "pointer" : "not-allowed" }}>
                      Speichern & Plan anzeigen →
                    </button>
                  </div>
                </div>
              )}

              {/* STUFE 3 — Zusammenfassung */}
              {stratStep === 3 && (
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>Dein Outreach-Plan für {client.name}</h2>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>So funktioniert dein System von Anfang bis zum Abschluss:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {selectedSources.map((srcKey, idx) => {
                      const src = SOURCES.find(s => s.key === srcKey);
                      const chosen = (selectedOutreach[srcKey] || []).map(ok => (OUTREACH_OPTIONS[srcKey] || []).find(o => o.key === ok)).filter(Boolean);
                      return (
                        <div key={srcKey} style={{ display: "flex", gap: 16, marginBottom: 0 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{idx + 1}</div>
                            {idx < selectedSources.length - 1 && <div style={{ width: 2, flex: 1, background: "#e5e7eb", minHeight: 32 }} />}
                          </div>
                          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", marginBottom: 12, flex: 1, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <span style={{ fontSize: 18 }}>{src.icon}</span>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>{src.label}</span>
                              <span style={{ fontSize: 12, color: "#6b7280" }}>— Leads sammeln</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {chosen.map(opt => (
                                <span key={opt.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f5f3ff", color: "#4338ca", borderRadius: 8, padding: "5px 10px", fontSize: 13, fontWeight: 600 }}>
                                  {opt.icon} {opt.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#22c55e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏆</div>
                      </div>
                      <div style={{ background: "#dcfce7", borderRadius: 14, padding: "16px 18px", flex: 1, border: "1px solid #bbf7d0" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#15803d" }}>Abschluss</div>
                        <div style={{ fontSize: 13, color: "#166534", marginTop: 4 }}>Lead wird im Dashboard zu "Gewonnen" — du hast einen neuen Kunden für {client.name}.</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={() => setStratStep(1)} style={{ padding: "10px 18px", background: "#f3f4f6", border: "none", borderRadius: 10, fontSize: 13, cursor: "pointer", color: "#6b7280" }}>← Bearbeiten</button>
                    <button onClick={() => { saveClient(); }} style={{ padding: "10px 22px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                      ✓ Plan gespeichert
                    </button>
                  </div>
                  {msg && <div style={{ marginTop: 10, color: "#22c55e", fontWeight: 600, fontSize: 13 }}>{msg}</div>}
                </div>
              )}
            </div>
          );
        })()}

        {/* PRODUKTE */}
        {tab === "Produkte" && (
          <div>
            {products.map(p => (
              <div key={p.id} style={{ background: "#fff", borderRadius: 16, padding: 22, marginBottom: 16, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>{p.name}</h3>
                  <button onClick={() => delProduct(p.id)} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 16 }}>🗑</button>
                </div>
                {p.description && <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>{p.description}</p>}
                {p.target_groups && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Zielgruppen: </span>
                    {p.target_groups.split(",").map(t => <span key={t} style={{ display: "inline-block", background: "#eff6ff", color: "#1d4ed8", borderRadius: 999, padding: "2px 9px", fontSize: 12, margin: "2px 3px" }}>{t.trim()}</span>)}
                  </div>
                )}
                {p.keywords && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Keywords: </span>
                    {p.keywords.split(",").map(k => <span key={k} style={{ display: "inline-block", background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "2px 7px", fontSize: 12, margin: "2px 3px" }}>{k.trim()}</span>)}
                  </div>
                )}
                {p.offer && <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>💡 {p.offer}</div>}

                <button onClick={() => startAnalysis(p)} disabled={analysing === p.id}
                  style={{ padding: "9px 18px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {analysing === p.id ? "⏳ KI analysiert…" : "🤖 Analyse starten → Leads suchen"}
                </button>

                {analysis[p.id] && (
                  <div style={{ marginTop: 16, background: "#f5f3ff", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#4338ca" }}>
                      ✓ {analysis[p.id].searches?.length || 0} Suchaufträge angelegt — Bot sucht passende Firmen
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                      {(analysis[p.id].searches || []).map((s, i) => (
                        <span key={i} style={{ background: "#fff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#4338ca" }}>
                          {s.term} · {s.location}
                        </span>
                      ))}
                    </div>
                    {(analysis[p.id].lp_ideas || []).length > 0 && (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#4338ca" }}>💡 Landing-Page-Ideen:</div>
                        {analysis[p.id].lp_ideas.map((lp, i) => (
                          <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", marginBottom: 8, border: "1px solid #ddd6fe" }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{lp.headline}</div>
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Zielgruppe: {lp.target} · Lead-Magnet: {lp.magnet}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 8px rgba(0,0,0,.06)", border: "2px dashed #e5e7eb" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#6b7280" }}>+ Neues Produkt / Leistung</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[["name", "Produktname *"], ["region", "Region (optional)"], ["target_groups", "Zielgruppen (Komma-getrennt)"], ["keywords", "Keywords (Komma-getrennt)"], ["offer", "Lead-Magnet / Angebot"], ["description", "Beschreibung"]].map(([k, l]) => (
                  <div key={k} style={{ gridColumn: k === "description" ? "1/-1" : undefined }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>{l}</label>
                    <input value={newProd[k]} onChange={e => setNewProd(p => ({ ...p, [k]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <button onClick={addProduct}
                style={{ marginTop: 14, padding: "10px 22px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Produkt anlegen
              </button>
            </div>
          </div>
        )}

        {/* LEADS */}
        {tab === "Leads" && (
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,.06)", overflow: "hidden" }}>
            {leads.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                Noch keine Leads für {client.name}.<br />
                <span style={{ fontSize: 13 }}>Starte eine Analyse unter „Produkte".</span>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#f9fafb" }}>{["Firma", "Ort", "Produkt", "Quelle", "Score", "Status"].map(h => <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{l.company_name}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{l.city || "–"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}>{l.product || "–"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12 }}><span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 999 }}>{l.source || "–"}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ background: l.score >= 8 ? "#dcfce7" : l.score >= 6 ? "#fef9c3" : "#fee2e2", color: l.score >= 8 ? "#15803d" : l.score >= 6 ? "#854d0e" : "#991b1b", padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{l.score}</span></td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{l.pipeline_status || "neu"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
