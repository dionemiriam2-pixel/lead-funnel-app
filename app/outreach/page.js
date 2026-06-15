"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { Mail, Link2, Target, Play, PenLine, ChevronDown, ChevronUp } from "lucide-react";

const STEP_ICONS  = { email: Mail, linkedin: Link2, email_followup: Mail, ads: Target };
const STEP_LABELS = {
  email:          "E-Mail senden",
  linkedin:       "LinkedIn kontaktieren",
  email_followup: "Follow-up E-Mail",
  ads:            "Custom Audience hochladen",
};

const inp = { padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--ink)", background: "#fff", fontFamily: "inherit", boxSizing: "border-box" };
const btnFill    = { padding: "7px 14px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };
const btnOutline = { padding: "7px 14px", background: "transparent", color: "var(--ink)", border: "1px solid var(--border-strong)", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 };

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
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Sequenz</div>
      {steps.map(s => {
        const Icon = STEP_ICONS[s.type] || Mail;
        const done = s.status === "done";
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <input type="checkbox" checked={done} disabled={done}
              onChange={() => markDone(s.id)}
              style={{ accentColor: "var(--ink)", cursor: done ? "default" : "pointer" }} />
            <Icon size={12} strokeWidth={1.5} color={done ? "var(--text-tertiary)" : "var(--text-secondary)"} />
            <span style={{ fontSize: 12, color: done ? "var(--text-tertiary)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>
              {STEP_LABELS[s.type] || s.label}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: "auto" }}>Tag {s.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function LeadRow({ lead, clients, onUpdate }) {
  const client = clients.find(c => c.id === lead.client_id);
  const [expanded,     setExpanded]     = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingLi,    setLoadingLi]    = useState(false);
  const [loadingSeq,   setLoadingSeq]   = useState(false);
  const [emailText,    setEmailText]    = useState(lead.outreach_text || "");
  const [liMsg,        setLiMsg]        = useState(lead.linkedin_msg || null);
  const [error,        setError]        = useState("");

  async function genEmail() {
    if (!client) { setError("Kein Kunde zugewiesen (client_id fehlt)."); return; }
    setLoadingEmail(true); setError("");
    const res = await apiFetch("/api/outreach", { method: "POST", body: JSON.stringify({ lead_id: lead.id, client_id: client.id }) });
    setLoadingEmail(false);
    if (res.ok) setEmailText(res.text);
    else setError(res.error || "Fehler beim Generieren");
  }

  async function genLinkedIn() {
    if (!client) { setError("Kein Kunde zugewiesen (client_id fehlt)."); return; }
    setLoadingLi(true); setError("");
    const res = await apiFetch("/api/linkedin-msg", { method: "POST", body: JSON.stringify({ lead_id: lead.id, client_id: client.id }) });
    setLoadingLi(false);
    if (res.ok) setLiMsg({ connection_request: res.connection_request, followup_message: res.followup_message });
    else setError(res.error || "Fehler beim Generieren");
  }

  async function startSequence() {
    setLoadingSeq(true); setError("");
    await apiFetch("/api/sequence", { method: "POST", body: JSON.stringify({ lead_id: lead.id }) });
    setLoadingSeq(false);
    onUpdate();
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      {/* Kopfzeile */}
      <div onClick={() => setExpanded(v => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{lead.company_name}</span>
          {lead.city && <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{lead.city}</span>}
          {client && (
            <span style={{ fontSize: 11, background: "#fef2f2", color: "var(--accent)", border: "1px solid #fecaca", borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>
              {client.name}
            </span>
          )}
          {!lead.client_id && (
            <span style={{ fontSize: 11, background: "var(--bg)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 7px" }}>
              eigener Lead
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp  size={16} strokeWidth={1.5} color="var(--text-tertiary)" />
          : <ChevronDown size={16} strokeWidth={1.5} color="var(--text-tertiary)" />}
      </div>

      {/* Aufgeklappter Bereich */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>
          {error && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef2f2", color: "var(--accent)", border: "1px solid #fecaca", borderRadius: 7, fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Aktionen */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button onClick={genEmail} disabled={loadingEmail} style={{ ...btnFill, opacity: loadingEmail ? .5 : 1 }}>
              <PenLine size={13} strokeWidth={1.5} />
              {loadingEmail ? "Generiert…" : "E-Mail generieren"}
            </button>
            <button onClick={genLinkedIn} disabled={loadingLi} style={{ ...btnOutline, opacity: loadingLi ? .5 : 1 }}>
              <Link2 size={13} strokeWidth={1.5} />
              {loadingLi ? "Generiert…" : "LinkedIn"}
            </button>
            {!lead.sequence?.length && (
              <button onClick={startSequence} disabled={loadingSeq} style={{ ...btnOutline, opacity: loadingSeq ? .5 : 1 }}>
                <Play size={13} strokeWidth={1.5} />
                {loadingSeq ? "Startet…" : "Sequenz starten"}
              </button>
            )}
          </div>

          {/* E-Mail-Text */}
          {emailText && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>E-Mail-Entwurf</div>
              <textarea readOnly value={emailText}
                style={{ ...inp, width: "100%", minHeight: 130, resize: "vertical", background: "var(--bg)", color: "var(--ink)" }} />
            </div>
          )}

          {/* LinkedIn */}
          {liMsg && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>LinkedIn — Vernetzungsanfrage</div>
              <textarea readOnly value={liMsg.connection_request}
                style={{ ...inp, width: "100%", minHeight: 70, resize: "vertical", background: "var(--bg)", color: "var(--ink)", marginBottom: 10 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>LinkedIn — Follow-up</div>
              <textarea readOnly value={liMsg.followup_message}
                style={{ ...inp, width: "100%", minHeight: 90, resize: "vertical", background: "var(--bg)", color: "var(--ink)" }} />
            </div>
          )}

          <SequenceSteps lead={lead} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

export default function OutreachPage() {
  const [leads,            setLeads]            = useState([]);
  const [clients,          setClients]          = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loading,          setLoading]          = useState(true);

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
      <div style={{ padding: "28px 32px", maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0 }}>Outreach</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>
            E-Mails schreiben, LinkedIn-Nachrichten generieren, Follow-up-Sequenzen starten
          </p>
        </div>

        {/* Kunden-Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
            style={{ ...inp, minWidth: 220 }}>
            <option value="">Alle Leads anzeigen</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
            {filtered.length} Lead{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Liste */}
        {loading ? (
          <div style={{ color: "var(--text-tertiary)", fontSize: 14 }}>Lädt…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-tertiary)", fontSize: 14 }}>
            Keine Leads gefunden.
          </div>
        ) : (
          filtered.map(lead => (
            <LeadRow key={lead.id} lead={lead} clients={clients} onUpdate={load} />
          ))
        )}
      </div>
    </AppShell>
  );
}
