"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { apiFetch, authHeaders } from "@/lib/api";

const inp = { width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--ink)", background: "var(--surface)", boxSizing: "border-box", fontFamily: "inherit" };
const lbl = { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 };

const PROF_FIELDS = ["name","website","email","description","usp","target_audience","keywords"];
function profPct(c) { return Math.round(PROF_FIELDS.filter(f => !!c[f]).length / PROF_FIELDS.length * 100); }

function ClientCard({ c, onDelete, onClick }) {
  const [logoErr, setLogoErr] = useState(false);
  const initial  = (c.name?.[0] || "K").toUpperCase();
  const domain   = c.website ? (() => { try { return new URL(c.website).hostname.replace(/^www\./, ""); } catch { return c.website; } })() : null;
  const logoUrl  = domain ? `https://logo.clearbit.com/${domain}` : null;
  const pct      = profPct(c);
  const analysed = !!c.analyzed_at;

  return (
    <div
      onClick={onClick}
      style={{ background: "var(--surface)", borderRadius: 14, padding: 20, cursor: "pointer", border: "1px solid var(--border)", transition: "box-shadow .15s, border-color .15s", display: "flex", flexDirection: "column", gap: 0 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>

      {/* Top row: Logo + Trash */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        {logoUrl && !logoErr ? (
          <img src={logoUrl} alt={c.name} onError={() => setLogoErr(true)}
            style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain", background: "#fff", border: "1px solid var(--border)" }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17 }}>
            {initial}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {analysed && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#2E6FD6", background: "#2E6FD610", padding: "2px 8px", borderRadius: 99 }}>
              KI
            </span>
          )}
          <button onClick={e => { e.stopPropagation(); onDelete(c.id); }}
            style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex", padding: 2, borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}>
            ✕
          </button>
        </div>
      </div>

      {/* Name */}
      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 4, lineHeight: 1.3 }}>{c.name}</div>

      {/* Region + Domain */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
        {c.region && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)" }}>
            {c.region}
          </div>
        )}
        {domain && (
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {domain}
          </div>
        )}
      </div>

      {/* Beschreibung */}
      {c.description && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 14, flexGrow: 1 }}>
          {c.description.slice(0, 90)}{c.description.length > 90 ? "…" : ""}
        </p>
      )}

      {/* Profil-Vollständigkeit */}
      <div style={{ marginTop: "auto", paddingTop: c.description ? 0 : 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500 }}>Profil</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? "#15803d" : pct >= 50 ? "var(--bar-fill)" : "var(--text-tertiary)" }}>{pct}%</span>
        </div>
        <div style={{ height: 4, background: "var(--bar-track)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: 4, width: pct + "%", borderRadius: 99, transition: "width .4s ease",
            background: pct === 100 ? "#15803d" : "var(--bar-fill)" }} />
        </div>
      </div>
    </div>
  );
}

export default function KundenPage() {
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showNew,  setShowNew]  = useState(false);
  const [form,     setForm]     = useState({ name: "", website: "", region: "", contact: "", description: "", usp: "" });
  const [saving,   setSaving]   = useState(false);
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
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
              {clients.length > 0 ? `${clients.length} Kunde${clients.length !== 1 ? "n" : ""}` : "Noch keine Kunden"}
            </p>
          </div>
          <button onClick={() => setShowNew(v => !v)}
            style={{ padding: "9px 18px", background: showNew ? "var(--border)" : "var(--ink)", color: showNew ? "var(--text-secondary)" : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            {showNew ? "Abbrechen" : "+ Neuer Kunde"}
          </button>
        </div>

        {showNew && (
          <div style={{ background: "var(--surface)", borderRadius: 12, padding: 24, marginBottom: 24, border: "1px solid var(--border-strong)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Neuer Kunde</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["name","Firmenname *"],["website","Website"],["region","Region (z.B. DACH / München)"],["contact","Ansprechpartner"]].map(([k, l]) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={inp}
                    onKeyDown={e => e.key === "Enter" && k === "name" && save()} />
                </div>
              ))}
              {[["description","Was bietet der Kunde an?"],["usp","Was macht ihn besonders? (USP)"]].map(([k, l]) => (
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
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ color: "var(--text-tertiary)", padding: 20 }}>Lade…</div>
        ) : clients.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Noch keine Kunden</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>Lege deinen ersten Kunden an und starte die KI-Analyse.</div>
            <button onClick={() => setShowNew(true)}
              style={{ padding: "10px 22px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Ersten Kunden anlegen
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {clients.map(c => (
              <ClientCard key={c.id} c={c} onDelete={del} onClick={() => router.push("/kunden/" + c.id)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
