"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

const STEP_LABELS = {
  email: "📧 E-Mail senden",
  linkedin: "💼 LinkedIn kontaktieren",
  email_followup: "📧 Follow-up E-Mail",
  ads: "🎯 Custom Audience hochladen",
};

function SequenceSteps({ lead, onUpdate }) {
  const steps = lead.sequence || [];
  if (!steps.length) return null;

  async function markDone(step_id) {
    await apiFetch("/api/sequence", {
      method: "PATCH",
      body: JSON.stringify({ lead_id: lead.id, step_id, status: "done" }),
    });
    onUpdate();
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 7 }}>Sequenz</div>
      {steps.map(s => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <input type="checkbox" checked={s.status === "done"} disabled={s.status === "done"}
            onChange={() => markDone(s.id)}
            style={{ accentColor: "#e11d48", cursor: s.status === "done" ? "default" : "pointer" }} />
          <span style={{ fontSize: 12, color: s.status === "done" ? "#9ca3af" : "#374151", textDecoration: s.status === "done" ? "line-through" : "none" }}>
            {STEP_LABELS[s.type] || s.label}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Tag {s.day}</span>
        </div>
      ))}
    </div>
  );
}

function LeadRow({ lead, clients, onUpdate }) {
  const client = clients.find(c => c.id === lead.client_id);
  const [expanded, setExpanded] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingLi, setLoadingLi] = useState(false);
  const [loadingSeq, setLoadingSeq] = useState(false);
  const [emailText, setEmailText] = useState(lead.outreach_text || "");
  const [liMsg, setLiMsg] = useState(lead.linkedin_msg || null);
  const [error, setError] = useState("");

  async function genEmail() {
    if (!client) { setError("Kein Kunde zugewiesen (client_id fehlt)."); return; }
    setLoadingEmail(true); setError("");
    const res = await apiFetch("/api/outreach", {
      method: "POST",
      body: JSON.stringify({ lead_id: lead.id, client_id: client.id }),
    });
    setLoadingEmail(false);
    if (res.ok) setEmailText(res.text);
    else setError(res.error || "Fehler beim Generieren");
  }

  async function genLinkedIn() {
    if (!client) { setError("Kein Kunde zugewiesen (client_id fehlt)."); return; }
    setLoadingLi(true); setError("");
    const res = await apiFetch("/api/linkedin-msg", {
      method: "POST",
      body: JSON.stringify({ lead_id: lead.id, client_id: client.id }),
    });
    setLoadingLi(false);
    if (res.ok) setLiMsg({ connection_request: res.connection_request, followup_message: res.followup_message });
    else setError(res.error || "Fehler beim Generieren");
  }

  async function startSequence() {
    setLoadingSeq(true); setError("");
    await apiFetch("/api/sequence", {
      method: "POST",
      body: JSON.stringify({ lead_id: lead.id }),
    });
    setLoadingSeq(false);
    onUpdate();
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      {/* Kopfzeile */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer" }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{lead.company_name}</span>
          {lead.city && <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{lead.city}</span>}
          {client && <span style={{ marginLeft: 8, fontSize: 11, background: "#fce7eb", color: "#be123c", borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>{client.name}</span>}
          {!lead.client_id && <span style={{ marginLeft: 8, fontSize: 11, background: "#f3f4f6", color: "#6b7280", borderRadius: 5, padding: "2px 7px" }}>eigener Lead</span>}
        </div>
        <span style={{ fontSize: 18, color: "#9ca3af", lineHeight: 1 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Aufgeklappter Bereich */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6" }}>
          {error && <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef2f2", color: "#dc2626", borderRadius: 7, fontSize: 13 }}>{error}</div>}

          {/* Aktionen */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button onClick={genEmail} disabled={loadingEmail}
              style={{ padding: "7px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: loadingEmail ? .6 : 1 }}>
              {loadingEmail ? "Generiert…" : "✉ E-Mail generieren"}
            </button>
            <button onClick={genLinkedIn} disabled={loadingLi}
              style={{ padding: "7px 14px", background: "#0a66c2", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: loadingLi ? .6 : 1 }}>
              {loadingLi ? "Generiert…" : "💼 LinkedIn"}
            </button>
            {!lead.sequence?.length && (
              <button onClick={startSequence} disabled={loadingSeq}
                style={{ padding: "7px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: loadingSeq ? .6 : 1 }}>
                {loadingSeq ? "Startet…" : "▶ Sequenz starten"}
              </button>
            )}
          </div>

          {/* E-Mail-Text */}
          {emailText && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>E-Mail-Entwurf</div>
              <textarea readOnly value={emailText}
                style={{ width: "100%", minHeight: 130, padding: 10, border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#374151", background: "#f9fafb", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          )}

          {/* LinkedIn-Nachrichten */}
          {liMsg && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>LinkedIn — Vernetzungsanfrage</div>
              <textarea readOnly value={liMsg.connection_request}
                style={{ width: "100%", minHeight: 70, padding: 10, border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#374151", background: "#f9fafb", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>LinkedIn — Follow-up</div>
              <textarea readOnly value={liMsg.followup_message}
                style={{ width: "100%", minHeight: 90, padding: 10, border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#374151", background: "#f9fafb", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          )}

          {/* Sequenz */}
          <SequenceSteps lead={lead} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

export default function OutreachPage() {
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [leadsRes, clientsRes] = await Promise.all([
      apiFetch("/api/leads"),
      apiFetch("/api/clients"),
    ]);
    setLeads(leadsRes.data || []);
    setClients(clientsRes.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = selectedClientId
    ? leads.filter(l => l.client_id === selectedClientId)
    : leads;

  return (
    <AppShell>
      <div style={{ padding: "32px 32px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.4px" }}>Outreach</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>E-Mails schreiben, LinkedIn-Nachrichten generieren, Follow-up-Sequenzen starten</div>
        </div>

        {/* Kunden-Filter */}
        <div style={{ marginBottom: 20 }}>
          <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", background: "#fff", cursor: "pointer", minWidth: 220 }}>
            <option value="">Alle Leads anzeigen</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span style={{ marginLeft: 12, fontSize: 13, color: "#9ca3af" }}>{filtered.length} Lead{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Lead-Liste */}
        {loading ? (
          <div style={{ color: "#9ca3af", fontSize: 14 }}>Lädt…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 14 }}>Keine Leads gefunden.</div>
        ) : (
          filtered.map(lead => (
            <LeadRow key={lead.id} lead={lead} clients={clients} onUpdate={load} />
          ))
        )}
      </div>
    </AppShell>
  );
}
