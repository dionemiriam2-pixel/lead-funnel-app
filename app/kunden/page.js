"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { apiFetch, authHeaders } from "@/lib/api";
import { Building2, Trash2, MapPin } from "lucide-react";

const inp = { width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--ink)", background: "var(--surface)", boxSizing: "border-box", fontFamily: "inherit" };
const lbl = { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 };

export default function KundenPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", region: "", contact: "", description: "", usp: "" });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function load() {
    setLoading(true);
    const d = await apiFetch("/api/clients");
    setClients(d.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/clients", { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
    setShowNew(false);
    setForm({ name: "", website: "", region: "", contact: "", description: "", usp: "" });
    await load();
    setSaving(false);
  }

  async function del(id) {
    if (!confirm("Kunden wirklich löschen?")) return;
    await fetch("/api/clients?id=" + id, { method: "DELETE", headers: authHeaders() });
    await load();
  }

  return (
    <AppShell>
      <div style={{ padding: "28px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0 }}>Kunden</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>Kunden anlegen, Produkte definieren, KI-Analyse starten</p>
          </div>
          <button onClick={() => setShowNew(true)}
            style={{ padding: "9px 18px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            + Neuer Kunde
          </button>
        </div>

        {showNew && (
          <div style={{ background: "var(--surface)", borderRadius: 12, padding: 24, marginBottom: 20, border: "1px solid var(--border-strong)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Neuer Kunde</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["name", "Firmenname *"], ["website", "Website"], ["region", "Region (z.B. DACH / München)"], ["contact", "Ansprechpartner"]].map(([k, l]) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={inp} />
                </div>
              ))}
              {[["description", "Was bietet der Kunde an?"], ["usp", "Was macht ihn besonders? (USP)"]].map(([k, l]) => (
                <div key={k} style={{ gridColumn: "1/-1" }}>
                  <label style={lbl}>{l}</label>
                  <textarea value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} rows={2}
                    style={{ ...inp, resize: "vertical" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={save} disabled={saving}
                style={{ padding: "9px 20px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                {saving ? "Speichern…" : "Kunde anlegen"}
              </button>
              <button onClick={() => setShowNew(false)}
                style={{ padding: "9px 16px", background: "var(--border)", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", color: "var(--text-secondary)", fontFamily: "inherit" }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ color: "var(--text-tertiary)", padding: 20 }}>Lade…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {clients.map(c => (
              <div key={c.id} onClick={() => router.push("/kunden/" + c.id)}
                style={{ background: "var(--surface)", borderRadius: 12, padding: 20, cursor: "pointer", border: "1px solid var(--border)", transition: "border-color .15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-strong)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <Building2 size={22} strokeWidth={1.5} color="var(--text-secondary)" />
                  <button onClick={e => { e.stopPropagation(); del(c.id); }}
                    style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "var(--ink)" }}>{c.name}</h3>
                {c.region && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                    <MapPin size={12} strokeWidth={1.5} />
                    {c.region}
                  </div>
                )}
                {c.website && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.website}</div>}
                {c.description && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.5 }}>{c.description.slice(0, 100)}{c.description.length > 100 ? "…" : ""}</p>}
                <div style={{ marginTop: 14, padding: "7px 10px", background: "var(--bg)", borderRadius: 7, fontSize: 12, color: "var(--ink)", fontWeight: 500, border: "1px solid var(--border)" }}>
                  Klicken → Produkte & KI-Analyse →
                </div>
              </div>
            ))}
            {clients.length === 0 && !showNew && (
              <div style={{ color: "var(--text-tertiary)", padding: 20 }}>Noch keine Kunden. Lege deinen ersten an!</div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
