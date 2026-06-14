"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";

const TABS = ["Profil", "Produkte", "Leads"];

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
  const h = { "x-pw": localStorage.getItem("lf_auth_pw") || "", "Content-Type": "application/json" };

  async function load() {
    const [cr, pr, lr] = await Promise.all([
      fetch("/api/clients", { headers: h }).then(r => r.json()),
      fetch("/api/products?client_id=" + id, { headers: h }).then(r => r.json()),
      fetch("/api/leads", { headers: h }).then(r => r.json()),
    ]);
    const c = (cr.data || []).find(x => x.id === id);
    setClient(c || null);
    setForm(c || {});
    setProducts(pr.data || []);
    setLeads((lr.data || []).filter(l => l.client === c?.name));
  }

  useEffect(() => { load(); }, [id]);

  async function saveClient() {
    await fetch("/api/clients", { method: "PATCH", headers: h, body: JSON.stringify({ id, ...form }) });
    setMsg("✓ Gespeichert");
    setTimeout(() => setMsg(""), 2000);
    await load();
  }

  async function addProduct() {
    if (!newProd.name.trim()) return;
    await fetch("/api/products", { method: "POST", headers: h, body: JSON.stringify({ ...newProd, client_id: id, region: newProd.region || client?.region }) });
    setNewProd({ name: "", description: "", target_groups: "", keywords: "", region: "", offer: "" });
    await load();
  }

  async function delProduct(pid) {
    if (!confirm("Produkt löschen?")) return;
    await fetch("/api/products?id=" + pid, { method: "DELETE", headers: h });
    await load();
  }

  async function startAnalysis(prod) {
    setAnalysing(prod.id);
    const r = await fetch("/api/analyse", { method: "POST", headers: h, body: JSON.stringify({ product_id: prod.id, client_id: id }) });
    const d = await r.json();
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

        {/* Tabs */}
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
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,.06)", maxWidth: 700 }}>
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
              <button onClick={saveClient} style={{ padding: "10px 22px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Speichern
              </button>
              {msg && <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>{msg}</span>}
            </div>
          </div>
        )}

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
                    {p.target_groups.split(",").map(t => (
                      <span key={t} style={{ display: "inline-block", background: "#eff6ff", color: "#1d4ed8", borderRadius: 999, padding: "2px 9px", fontSize: 12, margin: "2px 3px" }}>{t.trim()}</span>
                    ))}
                  </div>
                )}
                {p.keywords && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Keywords: </span>
                    {p.keywords.split(",").map(k => (
                      <span key={k} style={{ display: "inline-block", background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "2px 7px", fontSize: 12, margin: "2px 3px" }}>{k.trim()}</span>
                    ))}
                  </div>
                )}
                {p.offer && <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>💡 Lead-Magnet: {p.offer}</div>}

                <button onClick={() => startAnalysis(p)} disabled={analysing === p.id}
                  style={{ padding: "9px 18px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {analysing === p.id ? "⏳ KI analysiert…" : "🤖 Analyse starten → Leads suchen"}
                </button>

                {analysis[p.id] && (
                  <div style={{ marginTop: 16, background: "#f5f3ff", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#4338ca" }}>
                      ✓ {analysis[p.id].searches?.length || 0} Suchaufträge angelegt
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                      {(analysis[p.id].searches || []).map((s, i) => (
                        <span key={i} style={{ background: "#fff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#4338ca" }}>
                          {s.term} · {s.location}
                        </span>
                      ))}
                    </div>
                    {analysis[p.id].lp_ideas?.length > 0 && (
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

            {/* Neues Produkt */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 8px rgba(0,0,0,.06)", border: "2px dashed #e5e7eb" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#6b7280" }}>+ Neues Produkt / Leistung</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[["name", "Produktname *"], ["region", "Region (optional)"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>{l}</label>
                    <input value={newProd[k]} onChange={e => setNewProd(p => ({ ...p, [k]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                ))}
                {[["description", "Beschreibung"], ["target_groups", "Zielgruppen (Komma-getrennt)"], ["keywords", "Keywords (Komma-getrennt)"], ["offer", "Lead-Magnet / Angebot"]].map(([k, l]) => (
                  <div key={k} style={{ gridColumn: "1/-1" }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>{l}</label>
                    <input value={newProd[k]} onChange={e => setNewProd(p => ({ ...p, [k]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <button onClick={addProduct} style={{ marginTop: 14, padding: "10px 22px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
                <span style={{ fontSize: 13 }}>Starte eine Analyse unter „Produkte" um Leads zu suchen.</span>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Firma", "Ort", "Produkt", "Quelle", "Score", "Status"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{l.company_name}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>{l.city || "–"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}>{l.product || "–"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12 }}><span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 999 }}>{l.source || "–"}</span></td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: l.score >= 8 ? "#dcfce7" : l.score >= 6 ? "#fef9c3" : "#fee2e2", color: l.score >= 8 ? "#15803d" : l.score >= 6 ? "#854d0e" : "#991b1b", padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{l.score}</span>
                      </td>
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
