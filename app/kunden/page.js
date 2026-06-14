"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function KundenPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", region: "", contact: "", description: "", usp: "" });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const h = { "x-pw": localStorage.getItem("lf_auth_pw") || "", "Content-Type": "application/json" };

  async function load() {
    setLoading(true);
    const r = await fetch("/api/clients", { headers: h });
    const d = await r.json();
    setClients(d.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/clients", { method: "POST", headers: h, body: JSON.stringify(form) });
    setShowNew(false);
    setForm({ name: "", website: "", region: "", contact: "", description: "", usp: "" });
    await load();
    setSaving(false);
  }

  async function del(id) {
    if (!confirm("Kunden wirklich löschen?")) return;
    await fetch("/api/clients?id=" + id, { method: "DELETE", headers: h });
    await load();
  }

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>🏢 Kunden</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>Verwalte deine Kunden und deren Produkte</p>
          </div>
          <button onClick={() => setShowNew(true)}
            style={{ padding: "10px 20px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            + Neuer Kunde
          </button>
        </div>

        {/* Neuer Kunde */}
        {showNew && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 2px 16px rgba(0,0,0,.08)", border: "2px solid #6366f1" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Neuer Kunde</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["name", "Firmenname *"], ["website", "Website"], ["region", "Region (z.B. DACH / München)"], ["contact", "Ansprechpartner"]].map(([k, l]) => (
                <div key={k}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>{l}</label>
                  <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>Was bietet der Kunde an?</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>Was macht ihn besonders? (USP)</label>
                <textarea value={form.usp} onChange={e => setForm(f => ({ ...f, usp: e.target.value }))} rows={2}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={save} disabled={saving}
                style={{ padding: "10px 22px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Speichern…" : "Kunde anlegen"}
              </button>
              <button onClick={() => setShowNew(false)}
                style={{ padding: "10px 16px", background: "#f3f4f6", border: "none", borderRadius: 9, fontSize: 14, cursor: "pointer", color: "#6b7280" }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Kundenliste */}
        {loading ? <div style={{ color: "#6b7280", padding: 20 }}>Lade…</div> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {clients.map(c => (
              <div key={c.id} style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 8px rgba(0,0,0,.06)", cursor: "pointer", border: "1px solid #f3f4f6", transition: "box-shadow .15s" }}
                onClick={() => router.push("/kunden/" + c.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
                  <button onClick={e => { e.stopPropagation(); del(c.id); }}
                    style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 16 }}>🗑</button>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "#1a1a2e" }}>{c.name}</h3>
                {c.region && <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>📍 {c.region}</div>}
                {c.website && <div style={{ fontSize: 12, color: "#6366f1" }}>{c.website}</div>}
                {c.description && <p style={{ fontSize: 13, color: "#6b7280", marginTop: 10, lineHeight: 1.5 }}>{c.description.slice(0, 100)}{c.description.length > 100 ? "…" : ""}</p>}
                <div style={{ marginTop: 14, padding: "8px 12px", background: "#f5f3ff", borderRadius: 8, fontSize: 12, color: "#6366f1", fontWeight: 600 }}>
                  Klicken → Produkte & Analyse →
                </div>
              </div>
            ))}
            {clients.length === 0 && !showNew && (
              <div style={{ color: "#6b7280", padding: 20 }}>Noch keine Kunden. Leg deinen ersten an!</div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
