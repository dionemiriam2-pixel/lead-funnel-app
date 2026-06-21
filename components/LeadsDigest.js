"use client";
import { useState } from "react";
import { authHeaders } from "@/lib/api";

const SRC_COLOR = {
  landingpage: { bg: "#dcfce7", color: "#16a34a" },
  whatsapp:    { bg: "#dcfce7", color: "#15803d" },
  messenger:   { bg: "#dbeafe", color: "#1d4ed8" },
  instagram:   { bg: "#fce7f3", color: "#be185d" },
  email:       { bg: "#fef9c3", color: "#854d0e" },
  linkedin:    { bg: "#dbeafe", color: "#1e40af" },
  "google-maps":{ bg: "#dcfce7", color: "#166534" },
  manuell:     { bg: "#f3f4f6", color: "#6b7280" },
};
function kanalStyle(k) { return SRC_COLOR[k] || { bg: "#f3f4f6", color: "#6b7280" }; }

function kanalZeile(kanaele) {
  return Object.entries(kanaele)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${n}x ${k}`)
    .join(", ");
}

export default function LeadsDigest() {
  const [state,   setState]   = useState("idle"); // idle | loading | done | error
  const [data,    setData]    = useState(null);
  const [errMsg,  setErrMsg]  = useState("");

  async function load() {
    setState("loading");
    setData(null);
    try {
      const res = await fetch("/api/leads-digest", { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setState("done");
    } catch (e) {
      setErrMsg(e.message || "Unbekannter Fehler");
      setState("error");
    }
  }

  const S = {
    card:    { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" },
    btn:     { padding: "9px 20px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
    btnLoad: { padding: "9px 20px", background: "var(--border)", color: "var(--text-secondary)", border: "none", borderRadius: 8, fontSize: 13, cursor: "not-allowed" },
    hd:      { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", marginBottom: 14 },
    badge:   (k) => ({ ...kanalStyle(k), fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }),
  };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: state === "idle" ? 0 : 16 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>Neue Leads (24h)</span>
        <button
          onClick={state === "loading" ? undefined : load}
          style={state === "loading" ? S.btnLoad : S.btn}
          disabled={state === "loading"}
        >
          {state === "loading" ? "Lädt…" : state === "done" ? "Aktualisieren" : "Laden"}
        </button>
      </div>

      {state === "error" && (
        <div style={{ fontSize: 13, color: "#dc2626", marginTop: 4 }}>Fehler: {errMsg}</div>
      )}

      {state === "done" && data && (
        <div>
          {/* Überschrift */}
          <div style={{ fontWeight: 700, fontSize: 22, color: "var(--ink)", marginBottom: 16, lineHeight: 1.2 }}>
            {data.total === 0
              ? "Keine neuen Leads in den letzten 24 Stunden."
              : `${data.total} neue Lead${data.total !== 1 ? "s" : ""} in den letzten 24 Stunden`}
          </div>

          {/* Gmail-Postfach: unverarbeitete Anfragen */}
          {data.gmailUnprocessed?.length > 0 && (
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#4338ca", marginBottom: 8 }}>
                📩 Gmail-Postfach — noch nicht verarbeitet
              </div>
              {data.gmailUnprocessed.map(({ client_id, kunde, count }) => (
                <div key={client_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#3730a3" }}>
                    <strong>{kunde}:</strong> {count} mögliche Anfrage{count !== 1 ? "n" : ""}
                  </span>
                  <a href={`/kunden/${client_id}?tab=Kan%C3%A4le`}
                    style={{ fontSize: 12, color: "#4338ca", fontWeight: 600, textDecoration: "none" }}>
                    → Postfach öffnen
                  </a>
                </div>
              ))}
            </div>
          )}

          {data.total > 0 && (
            <>
              {/* Pro-Kunde-Zeilen */}
              <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={S.hd}>Pro Kunde</div>
                {data.perKunde.map(({ kunde, count, kanaele }) => (
                  <div key={kunde} style={{ fontSize: 13, color: "var(--ink)", display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontWeight: 600, minWidth: 160 }}>{kunde}:</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {count} Lead{count !== 1 ? "s" : ""} ({kanalZeile(kanaele)})
                    </span>
                  </div>
                ))}
              </div>

              {/* Lead-Liste */}
              <div>
                <div style={S.hd}>Alle Eingänge</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.leads.map((l, i) => {
                    const kontakt = [l.contact_name, l.email || l.phone].filter(Boolean).join(" · ");
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "8px 12px", background: "var(--bg)", borderRadius: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 500, color: "var(--ink)", minWidth: 120 }}>{l.kunde}</span>
                        <span style={S.badge(l.kanal)}>{l.kanal}</span>
                        {kontakt && <span style={{ color: "var(--text-secondary)", flex: 1 }}>{kontakt}</span>}
                        <span style={{ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                          {new Date(l.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
